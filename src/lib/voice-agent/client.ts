import {
  ClientEvent,
  ServerEvent,
  SessionUpdateConfig,
  ConnectionStatus,
  ToolCallEvent,
} from "./types";
import {
  AudioQueuePlayer,
  float32ToInt16,
  int16ToBase64,
  resampleAudio,
  calculateRms,
  TARGET_SAMPLE_RATE,
} from "../audio/pcm";
import { handleToolCall } from "../game/tool-handler";
import { CAFE_TOOLS, SPAIN_CAFE_SCENARIO } from "@/scenarios/spain-cafe";
import { useGameStore } from "../game/store";

export interface VoiceAgentClientOptions {
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: string) => void;
  onAudioLevel?: (level: number) => void;
}

export class VoiceAgentClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private audioPlayer: AudioQueuePlayer;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private options: VoiceAgentClientOptions;
  private isPushToTalkActive: boolean = false;
  private isSimulationMode: boolean = false;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(options: VoiceAgentClientOptions = {}) {
    this.options = options;
    this.audioPlayer = new AudioQueuePlayer();
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  /**
   * Initializes the session by fetching a token and opening the WebSocket
   */
  public async connect(): Promise<void> {
    if (this.status === "connecting" || this.status === "connected" || this.status === "ready") {
      return;
    }

    this.setStatus("connecting");

    try {
      // 1. Fetch token from server
      const res = await fetch("/api/assemblyai/token", { method: "POST" });
      const data = (await res.json()) as {
        token: string | null;
        mode: "live" | "simulation";
        error?: string;
      };

      if (!res.ok || data.mode === "simulation" || !data.token) {
        console.info(
          "Using interactive Simulation Mode (No live AssemblyAI API key configured)."
        );
        this.startSimulationMode();
        return;
      }

      // 2. Connect to live AssemblyAI Voice Agent WebSocket
      const wsUrl = `wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(
        data.token
      )}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[VoiceAgent] WebSocket connection established");
        this.setStatus("connected");
        this.sendSessionUpdate();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as ServerEvent;
          this.handleServerEvent(payload);
        } catch (err) {
          console.error("[VoiceAgent] Failed to parse server message:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[VoiceAgent] WebSocket error, falling back to simulator:", err);
        this.startSimulationMode();
      };

      this.ws.onclose = () => {
        console.log("[VoiceAgent] WebSocket closed");
        if (this.status !== "disconnected") {
          this.setStatus("disconnected");
        }
      };
    } catch (err) {
      console.warn("[VoiceAgent] Connection error, starting simulator:", err);
      this.startSimulationMode();
    }
  }

  /**
   * Sends the initial session configuration to AssemblyAI
   */
  private sendSessionUpdate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const sessionUpdate: SessionUpdateConfig = {
      type: "session.update",
      session: {
        system_prompt: SPAIN_CAFE_SCENARIO.systemPrompt,
        greeting: SPAIN_CAFE_SCENARIO.initialGreeting,
        voice: SPAIN_CAFE_SCENARIO.voice,
        tools: CAFE_TOOLS,
        vad_threshold: 0.5,
        min_silence: 300,
        max_silence: 2000,
      },
    };

    console.log("[VoiceAgent] Sending session.update");
    this.send(sessionUpdate);
  }

  /**
   * Handles incoming events from the AssemblyAI Voice Agent API
   */
  private handleServerEvent(event: ServerEvent) {
    const store = useGameStore.getState();

    switch (event.type) {
      case "session.ready":
        console.log("[VoiceAgent] Session ready!");
        this.setStatus("ready");
        break;

      case "input.speech.started":
        console.log("[VoiceAgent] User began speaking (Barge-in)");
        store.setBaristaAction("listening");
        // Flush audio queue immediately to support interruption
        this.audioPlayer.flush();
        break;

      case "input.speech.stopped":
        console.log("[VoiceAgent] User stopped speaking");
        store.setBaristaAction("idle");
        break;

      case "transcript.user":
        if (event.text?.trim()) {
          console.log("[VoiceAgent] User transcript:", event.text);
          store.addTranscriptMessage("user", event.text);
        }
        break;

      case "transcript.agent":
        if (event.text?.trim()) {
          console.log("[VoiceAgent] Agent transcript:", event.text);
          store.addTranscriptMessage("npc", event.text);
          store.setBaristaAction("speaking");
        }
        break;

      case "reply.audio":
        if (event.data) {
          store.setBaristaAction("speaking");
          this.audioPlayer.enqueuePcmBase64(event.data);
        }
        break;

      case "reply.done":
        console.log(`[VoiceAgent] Reply done with status: ${event.status}`);
        if (event.status === "interrupted") {
          this.audioPlayer.flush();
        }
        store.setBaristaAction("idle");
        break;

      case "tool.call":
        this.executeTool(event);
        break;

      case "session.error":
        console.error("[VoiceAgent] Session error:", event.error, event.message);
        this.options.onError?.(event.message || event.error);
        break;

      case "session.ended":
        this.setStatus("disconnected");
        break;
    }
  }

  /**
   * Executes a tool requested by AssemblyAI and replies with tool.result
   */
  private executeTool(event: ToolCallEvent) {
    const result = handleToolCall({
      tool_call_id: event.tool_call_id,
      name: event.name,
      arguments: event.arguments,
    });

    this.send({
      type: "tool.result",
      tool_call_id: result.tool_call_id,
      result: result.result,
    });
  }

  /**
   * Starts local microphone capture and streams base64 PCM16 over WebSocket
   */
  public async startMicrophone(): Promise<void> {
    if (this.micStream) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioCtxClass();

      this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
      // Using ScriptProcessorNode for universal browser compatibility
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate and report audio level for visual meter
        const level = calculateRms(inputData);
        this.options.onAudioLevel?.(level);

        // Only stream audio when push-to-talk is engaged or if running continuous
        if (!this.isPushToTalkActive) {
          return;
        }

        // Resample from browser mic sample rate to 24000 Hz if needed
        const resampled = resampleAudio(
          inputData,
          this.audioContext?.sampleRate || 48000,
          TARGET_SAMPLE_RATE
        );

        const int16 = float32ToInt16(resampled);
        const base64 = int16ToBase64(int16);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.send({
            type: "input.audio",
            data: base64,
          });
        }
      };

      this.micSource.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("[VoiceAgent] Error accessing microphone:", err);
      this.options.onError?.("No se pudo acceder al micrófono del navegador.");
    }
  }

  /**
   * Set Push-To-Talk active state
   */
  public setPushToTalk(active: boolean) {
    this.isPushToTalkActive = active;
    useGameStore.getState().setPushToTalkActive(active);

    if (active) {
      // User pressed talk button -> barge in on any current NPC speech
      this.audioPlayer.flush();
      useGameStore.getState().setBaristaAction("listening");
    } else {
      useGameStore.getState().setBaristaAction("idle");
    }
  }

  /**
   * Interactive Simulator mode for zero-config local testing and judges
   */
  private startSimulationMode() {
    this.isSimulationMode = true;
    this.setStatus("ready");

    console.log(
      "%c[Layover Simulator] Active · Speech recognition & NPC responses ready",
      "color: #10b981; font-weight: bold;"
    );
  }

  /**
   * Trigger simulated user speech in Simulator mode
   */
  public simulateUserUtterance(text: string) {
    const store = useGameStore.getState();
    store.addTranscriptMessage("user", text);
    store.setBaristaAction("listening");

    // Synthesize NPC response after turn-detection pause (~400ms)
    setTimeout(() => {
      const lower = text.toLowerCase();
      let npcReply = "";
      let toolToCall: { name: string; args: Record<string, unknown> } | null = null;

      if (lower.includes("café") || lower.includes("cafe")) {
        npcReply = "¡Marchando ese café! ¿Te apetece con leche entera o prefieres de avena?";
        toolToCall = {
          name: "order_item",
          args: { item: "café con leche", quantity: 1 },
        };
      } else if (lower.includes("avena") || lower.includes("sin azúcar") || lower.includes("azucar")) {
        npcReply = "Oído cocina, con leche de avena y sin azúcar. Te lo preparo enseguida.";
        toolToCall = {
          name: "modify_order",
          args: { milk_type: "avena", sugar: "sin_azucar" },
        };
      } else if (lower.includes("madrid") || lower.includes("viaje") || lower.includes("prado")) {
        npcReply = "¡Qué buen plan! El Museo del Prado es imprescindible. Además, por aquí cerca tenemos unas tapas increíbles.";
      } else if (lower.includes("cuanto") || lower.includes("cuenta") || lower.includes("cobras")) {
        npcReply = "¡Vaya por Dios! Perdona que te diga, pero se nos ha caído el datáfono y solo podemos cobrar en efectivo hoy. ¿Te viene bien?";
        toolToCall = {
          name: "trigger_unexpected",
          args: {
            situation_type: "cash_only",
            barista_explanation: "El datáfono no tiene cobertura, solo aceptamos efectivo.",
          },
        };
      } else if (lower.includes("efectivo") || lower.includes("cajero") || lower.includes("tengo")) {
        npcReply = "¡Muchísimas gracias por tu comprensión! Aquí tienes tu café recién hecho. ¡Disfruta de tu estancia en Madrid!";
        store.resolveUnexpectedSituation();
        toolToCall = {
          name: "finish_mission",
          args: {
            success: true,
            fluency_rating: 4.8,
            cultural_note: "¡Has completado la misión con sobresaliente!",
          },
        };
      } else {
        npcReply = "¡Perfecto! ¿Deseas alguna cosa más con tu pedido?";
      }

      store.addTranscriptMessage("npc", npcReply);
      store.setBaristaAction("speaking");

      // Play audio using Web Speech API if in simulation
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(npcReply);
        utterance.lang = "es-ES";
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }

      if (toolToCall) {
        handleToolCall({
          tool_call_id: `sim-tool-${Date.now()}`,
          name: toolToCall.name,
          arguments: toolToCall.args,
        });
      }

      setTimeout(() => {
        store.setBaristaAction("idle");
      }, 3000);
    }, 450);
  }

  private send(event: ClientEvent) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  public disconnect() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    this.processor?.disconnect();
    this.micSource?.disconnect();
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();
    this.audioPlayer.close();

    if (this.ws) {
      this.send({ type: "session.end" });
      this.ws.close();
      this.ws = null;
    }

    this.setStatus("disconnected");
  }
}
