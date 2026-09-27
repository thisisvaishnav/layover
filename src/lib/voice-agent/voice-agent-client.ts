import { createMicrophoneCapture, type MicrophoneCapture } from "./audio-capture";
import { createAudioPlayback, type AudioPlayback } from "./audio-playback";
import { splitAgentUtterance } from "./agent-text";
import type { ConversationMessage } from "../conversation/types";

export interface VoiceAgentClientOptions {
  /** Scenario/agent context injected into the system prompt via API */
  agentId?: string;
  /** System prompt configuring the agent inline */
  systemPrompt?: string;
  /** Initial greeting spoken by the NPC */
  greeting?: string;
  /** Called when the voice agent sends a partial transcript */
  onPartialTranscript(text: string): void;
  /** Called when the voice agent finalizes a user turn */
  onFinalTranscript(text: string): void;
  /** Called when the NPC starts speaking (agent turn begins) */
  onNpcTurnStart(): void;
  /** Called when a complete NPC message arrives with its text */
  onNpcMessage(msg: Omit<ConversationMessage, "id" | "timestamp">): void;
  /** Called when the NPC finishes speaking */
  onNpcTurnEnd(): void;
  /** Called when connection is established and the agent is ready */
  onConnected(): void;
  /** Called on any error */
  onError(message: string): void;
  /** Called when the session ends (intentionally or by timeout) */
  onSessionEnded(): void;
}

type WsStatus = "idle" | "connecting" | "connected" | "closed" | "error";

/**
 * Voice Agent WebSocket client for AssemblyAI.
 *
 * Architecture:
 *   Browser <-> AssemblyAI Voice Agent WebSocket
 *     - Every client message is JSON. Mic audio goes out as
 *       `{ type: "input.audio", audio: <base64 PCM16 mono 24kHz> }`,
 *       and only after the server has sent `session.ready`.
 *     - Server sends JSON events (transcripts, agent text/audio, status)
 *
 * The permanent API key stays on the server; the browser uses a short-lived token.
 */
export interface VoiceAgentClient {
  /** Open mic + WebSocket connection */
  connect(): Promise<void>;
  /** Gracefully close connection and stop mic */
  disconnect(): void;
  /** Start capturing speech and streaming to AssemblyAI */
  startRecording(): Promise<boolean>;
  /** Stop capturing speech */
  stopRecording(): void;
  /** Send text message directly over WebSocket if supported */
  sendTextMessage(text: string): boolean;
  readonly status: WsStatus;
  readonly isRecording: boolean;
}

const VOICE_AGENT_WS_BASE = "wss://agents.assemblyai.com/v1/ws";

/**
 * Error codes for a bad inbound message. AssemblyAI keeps the session alive
 * after these (unlike auth/session-expiry errors), so they must not tear the
 * conversation down.
 */
const RECOVERABLE_ERROR_CODES = new Set([
  "invalid_format",
  "invalid_audio",
  "invalid_value",
  "immutable_field",
  "invalid_config",
  "audio_rate_violation",
  "server_error",
  "agent_id_not_first",
  "agent_not_found",
]);

export function createVoiceAgentClient(opts: VoiceAgentClientOptions): VoiceAgentClient {
  let ws: WebSocket | null = null;
  let mic: MicrophoneCapture | null = null;
  let playback: AudioPlayback | null = null;
  let status: WsStatus = "idle";
  let disconnected = false;
  let isRecording = false;
  let sessionEndedNotified = false;
  // AssemblyAI rejects any `input.audio` sent before `session.ready`.
  let sessionReady = false;

  /** Release the microphone device (and its OS indicator) immediately. */
  function stopMic(): void {
    isRecording = false;
    mic?.stop();
    mic = null;
  }

  function stopPlayback(): void {
    playback?.stop();
    playback = null;
  }

  /** Encode PCM16 to base64 (block-wise so large buffers can't blow the stack). */
  function pcm16ToBase64(chunk: Int16Array): string {
    const bytes = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    let binary = "";
    const BLOCK = 0x2000;
    for (let i = 0; i < bytes.length; i += BLOCK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + BLOCK));
    }
    return btoa(binary);
  }

  /**
   * Stream one mic chunk to AssemblyAI. The API is JSON-only: audio travels
   * as `input.audio` with base64 PCM16, and only after `session.ready`.
   */
  function sendAudioChunk(chunk: Int16Array): void {
    if (!sessionReady || !isRecording || !ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: "input.audio", audio: pcm16ToBase64(chunk) }));
    } catch (err) {
      console.warn("[VoiceAgentClient] Failed to send audio chunk:", err);
    }
  }

  /** Open the mic and start streaming — only ever called after `session.ready`. */
  async function beginStreaming(): Promise<void> {
    const capture = createMicrophoneCapture({
      onAudioChunk: sendAudioChunk,
      onError(err: Error) {
        console.warn("[VoiceAgentClient] Mic warning:", err.message);
        opts.onError(`Microphone notice: ${err.message}. You can also type in the chat.`);
      },
    });
    mic = capture;

    const micOk = await capture.start();
    if (disconnected || sessionEndedNotified) {
      // Session died or user left while getUserMedia was pending — never keep it open.
      capture.stop();
      if (mic === capture) {
        mic = null;
      }
      isRecording = false;
      return;
    }
    if (!micOk) {
      console.warn("[VoiceAgentClient] Mic not available — continuing in listen/type mode");
      opts.onError("Microphone access is unavailable. You can listen and type your answers below!");
      isRecording = false;
    } else {
      isRecording = true;
    }
  }

  function notifySessionEnded(): void {
    if (sessionEndedNotified || disconnected) return;
    sessionEndedNotified = true;
    opts.onSessionEnded();
  }

  /** The voice session died: kill audio and close the socket, then notify once. */
  function endSession(): void {
    stopMic();
    stopPlayback();
    if (status !== "error") {
      status = "closed";
    }
    if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
      try {
        ws.close(1000, "Session ended");
      } catch {
        // Socket may already be tearing down
      }
    }
    notifySessionEnded();
  }

  async function connect(): Promise<void> {
    if (status === "connecting" || status === "connected") {
      console.warn("[VoiceAgentClient] Already connecting/connected");
      return;
    }

    disconnected = false;
    sessionEndedNotified = false;
    sessionReady = false;
    status = "connecting";
    console.log("[VoiceAgentClient] Connecting...");

    // 1. Mint a temporary token from our backend
    let token: string;
    try {
      const tokenRes = await fetch("/api/voice-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: opts.agentId }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token request failed: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json() as { token: string };
      token = tokenData.token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[VoiceAgentClient] Token error:", msg);
      status = "error";
      opts.onError(`Could not start voice session: ${msg}`);
      return;
    }

    // Aborted (unmounted / closed) while minting the token — never open a socket
    if (disconnected) {
      status = "closed";
      return;
    }

    // 2. Set up audio playback for NPC voice (24kHz native from AssemblyAI)
    playback = createAudioPlayback({
      sampleRate: 24000,
      onStart: () => opts.onNpcTurnStart(),
      onEnd:   () => opts.onNpcTurnEnd(),
    });

    // 3. Connect to Voice Agent WebSocket
    const wsUrl = `${VOICE_AGENT_WS_BASE}?token=${encodeURIComponent(token)}`;

    try {
      ws = new WebSocket(wsUrl);
    } catch {
      status = "error";
      opts.onError("Could not connect to voice service");
      return;
    }

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      if (disconnected) {
        ws?.close();
        return;
      }
      console.log("[VoiceAgentClient] WebSocket open — sending session.update");
      status = "connected";

      // Send mandatory session.update to configure the agent. The microphone
      // stays closed until the server answers with `session.ready`.
      const sessionUpdate = {
        type: "session.update",
        session: {
          ...(opts.systemPrompt ? { system_prompt: opts.systemPrompt } : {}),
          ...(opts.greeting ? { greeting: opts.greeting } : {}),
        },
      };
      ws?.send(JSON.stringify(sessionUpdate));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        handleJsonEvent(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        // Binary: NPC audio PCM16
        handleAudioData(event.data);
      }
    };

    ws.onerror = () => {
      console.error("[VoiceAgentClient] WebSocket error");
      status = "error";
      // Never leave the mic hot on a dead connection
      stopMic();
      opts.onError("Voice connection lost. Please try again.");
    };

    ws.onclose = (ev) => {
      console.log("[VoiceAgentClient] WebSocket closed:", ev.code, ev.reason);
      if (status !== "error") {
        status = "closed";
      }
      // Don't fire onSessionEnded after an intentional disconnect()
      notifySessionEnded();
      cleanup();
    };
  }

  function handleJsonEvent(raw: string): void {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.warn("[VoiceAgentClient] Unparseable event:", raw.slice(0, 200));
      return;
    }

    const type = event.type as string | undefined;
    console.log("[VoiceAgentClient] Event:", type);

    switch (type) {
      case "session.ready":
      case "session_ready":
      case "SessionBegins":
      case "session_begins":
        // The server only accepts `input.audio` from this moment on.
        if (!sessionReady) {
          sessionReady = true;
          opts.onConnected();
          void beginStreaming();
        }
        break;

      case "session.updated":
      case "session_updated":
        // Ack that session.update was applied — `session.ready` still follows.
        break;

      // Partial speech-to-text transcript
      case "transcript.user.delta":
      case "transcript_user_delta":
      case "PartialTranscript":
      case "partial_transcript": {
        const text = (event.text ?? event.delta ?? event.transcript ?? "") as string;
        opts.onPartialTranscript(text);
        break;
      }

      // Final speech-to-text transcript
      case "transcript.user":
      case "transcript_user":
      case "FinalTranscript":
      case "final_transcript": {
        const text = (event.text ?? event.transcript ?? "") as string;
        opts.onFinalTranscript(text);
        break;
      }

      // Agent text response (what the NPC says)
      case "reply.started":
      case "reply_started":
      case "TurnStarted":
      case "turn_started":
      case "AgentTurnStarted":
        opts.onNpcTurnStart();
        break;

      case "reply.done":
      case "reply_done":
      case "TurnEnded":
      case "turn_ended":
      case "AgentTurnEnded":
        // Barge-in: user talked over the agent — drop audio not played yet.
        if (event.status === "interrupted") {
          playback?.stop();
        }
        opts.onNpcTurnEnd();
        break;

      case "transcript.agent.delta":
      case "transcript_agent_delta": {
        // Incremental text streaming from agent
        break;
      }

      case "transcript.agent":
      case "transcript_agent":
      case "AgentResponse":
      case "agent_response": {
        const raw = (event.text ?? event.transcript ?? event.message ?? "") as string;
        if (raw) {
          // Two-line reply: shop line in the target language, then its meaning.
          const { text, meaning } = splitAgentUtterance(raw);
          if (text) {
            opts.onNpcMessage({
              speaker: "NPC",
              text,
              ...(meaning ? { translation: meaning } : {}),
            });
          }
        }
        break;
      }

      // Audio chunk from agent response in base64 format (24kHz PCM16)
      case "reply.audio":
      case "reply_audio": {
        const base64Audio = (event.audio ?? event.data) as string;
        if (base64Audio && typeof atob === "function") {
          try {
            const binaryStr = atob(base64Audio);
            const len = binaryStr.length;
            const evenLen = len - (len % 2);
            if (evenLen > 0) {
              const bytes = new Uint8Array(evenLen);
              for (let i = 0; i < evenLen; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              handleAudioData(bytes.buffer);
            }
          } catch (e) {
            console.warn("[VoiceAgentClient] Failed to decode base64 audio:", e);
          }
        }
        break;
      }

      // Barge-in: user started speaking while the agent is still replying
      case "input.speech.started":
      case "interrupted":
      case "SpeechStarted":
      case "speech_started":
        playback?.stop();
        opts.onPartialTranscript("");
        break;

      case "session.ended":
      case "session_ended":
      case "SessionEnded":
        endSession();
        break;

      case "session.error":
      case "session_error": {
        const code = (event.code ?? "") as string;
        const msg = (event.message ?? event.error ?? "Voice agent error") as string;
        if (RECOVERABLE_ERROR_CODES.has(code)) {
          console.warn(`[VoiceAgentClient] Recoverable ${code}:`, msg);
          break;
        }
        opts.onError(msg);
        // Fatal session error: the session is dead, so release the mic too
        endSession();
        break;
      }

      case "Error":
      case "error": {
        const msg = (event.message ?? event.error ?? "Voice agent error") as string;
        opts.onError(msg);
        break;
      }

      default:
        // Unknown event — log in dev, ignore in prod
        if (process.env.NODE_ENV === "development") {
          console.debug("[VoiceAgentClient] Unknown event type:", type, event);
        }
    }
  }

  function handleAudioData(buffer: ArrayBuffer): void {
    playback?.playChunk(buffer);
  }

  function disconnect(): void {
    if (disconnected) return;
    disconnected = true;
    status = "closed";

    stopMic();
    stopPlayback();

    const socket = ws;
    ws = null;
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Closing alone would leave the session in a billable 30s resume window.
      try {
        socket.send(JSON.stringify({ type: "session.end" }));
      } catch {
        // Socket may already be tearing down
      }
      setTimeout(() => {
        try {
          socket.close(1000, "User closed conversation");
        } catch {
          // Socket may already be closed
        }
      }, 250);
    } else if (socket && socket.readyState !== WebSocket.CLOSED) {
      try {
        socket.close(1000, "User closed conversation");
      } catch {
        // Socket may already be closed
      }
    }

    console.log("[VoiceAgentClient] Disconnected cleanly");
  }

  function cleanup(): void {
    sessionReady = false;
    stopMic();
    stopPlayback();
  }

  async function startRecording(): Promise<boolean> {
    // Never open the microphone for a dead/dying socket
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      return false;
    }

    if (!mic) {
      mic = createMicrophoneCapture({
        onAudioChunk: sendAudioChunk,
        onError(err: Error) {
          console.warn("[VoiceAgentClient] Mic warning:", err.message);
          opts.onError(`Microphone notice: ${err.message}. You can also type in the chat.`);
        },
      });
    }

    if (!mic.isActive) {
      const ok = await mic.start();
      if (!ok) return false;
    }

    if (disconnected || !ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      // Session died while the mic was being acquired — release it again
      stopMic();
      return false;
    }

    isRecording = true;
    return true;
  }

  function stopRecording(): void {
    // Actually release the device — otherwise the OS mic indicator stays on
    // even though we stopped streaming. startRecording() re-acquires it on
    // the next user gesture.
    isRecording = false;
    mic?.stop();
  }

  function sendTextMessage(text: string): boolean {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      // Inject the typed line into the agent's context. It deliberately does
      // not provoke a reply — the local scripted answer handles that turn.
      ws.send(
        JSON.stringify({
          type: "conversation.message",
          role: "user",
          content: text,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    get status() {
      return status;
    },
    get isRecording() {
      return isRecording;
    },
  };
}
