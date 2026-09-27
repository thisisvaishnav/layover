/**
 * MicrophoneCapture manages browser microphone access and PCM16 conversion.
 * Audio capture uses AudioContext with PCM16 encoding at 24kHz mono.
 */
export interface MicrophoneCapture {
  /** Start capturing. Returns false if permission denied. */
  start(): Promise<boolean>;
  /** Stop capturing and clean up. */
  stop(): void;
  /** Whether the mic is currently capturing. */
  readonly isActive: boolean;
}

export interface MicrophoneCaptureOptions {
  /** Called with each chunk of PCM16 Int16Array audio data (24kHz mono) */
  onAudioChunk(chunk: Int16Array): void;
  /** Called when an error occurs (e.g. permission denied) */
  onError(error: Error): void;
}

const SAMPLE_RATE = 24000;
const CHUNK_SIZE = 2048; // samples per chunk

/**
 * Pre-warms or resumes AudioContext inside a user gesture so autoplay policy is satisfied.
 */
export function warmUpAudioContext(): void {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const dummyCtx = new AudioCtx({ sampleRate: SAMPLE_RATE });
      if (dummyCtx.state === "suspended") {
        void dummyCtx.resume();
      }
      setTimeout(() => {
        void dummyCtx.close();
      }, 500);
    }
  } catch {
    // Ignore in non-browser / test environments
  }
}

/**
 * Creates a microphone capture instance.
 * Converts mic audio to 24kHz mono PCM16 suitable for the AssemblyAI Voice Agent API.
 */
export function createMicrophoneCapture(opts: MicrophoneCaptureOptions): MicrophoneCapture {
  let audioContext: AudioContext | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let processorNode: ScriptProcessorNode | null = null;
  let mediaStream: MediaStream | null = null;
  let active = false;
  // Bumped by stop() so a start() still awaiting getUserMedia discards its
  // stream instead of leaving the mic indicator lit forever.
  let generation = 0;

  async function start(): Promise<boolean> {
    if (active) return true;
    const myGeneration = ++generation;
    const isCurrent = () => myGeneration === generation;

    try {
      // NOTE: Do not pass sampleRate constraint to getUserMedia to prevent OverconstrainedError on macOS
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      if (!isCurrent()) {
        stopTracks(stream);
        return false;
      }
      mediaStream = stream;

      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContext = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      if (!isCurrent()) {
        cleanup();
        return false;
      }

      sourceNode = ctx.createMediaStreamSource(stream);

      // ScriptProcessorNode for PCM16 conversion
      processorNode = ctx.createScriptProcessor(CHUNK_SIZE, 1, 1);

      processorNode.onaudioprocess = (event) => {
        if (!active) return;
        const inputData = event.inputBuffer.getChannelData(0); // Float32Array
        const pcm16 = floatToPcm16(inputData);
        opts.onAudioChunk(pcm16);
      };

      // Route processor into the graph (required for onaudioprocess to fire),
      // but use a silent GainNode so the raw mic is never played back to the user.
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      sourceNode.connect(processorNode);
      processorNode.connect(silentGain);
      silentGain.connect(ctx.destination);

      active = true;
      console.log("[MicrophoneCapture] Started — 24kHz mono PCM16");
      return true;
    } catch (err) {
      if (!isCurrent()) {
        // stop() raced this start(); its cleanup already ran — not a real failure.
        cleanup();
        return false;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[MicrophoneCapture] Failed to start:", error.message);
      opts.onError(error);
      cleanup();
      return false;
    }
  }

  function stop(): void {
    generation++;
    const wasActive = active;
    active = false;
    cleanup();
    if (wasActive) {
      console.log("[MicrophoneCapture] Stopped");
    }
  }

  function cleanup(): void {
    try {
      if (processorNode) {
        processorNode.disconnect();
        processorNode.onaudioprocess = null;
        processorNode = null;
      }
      if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
      }
      if (audioContext) {
        void audioContext.close();
        audioContext = null;
      }
      if (mediaStream) {
        stopTracks(mediaStream);
        mediaStream = null;
      }
    } catch (e) {
      console.warn("[MicrophoneCapture] Cleanup error:", e);
    }
  }

  function stopTracks(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  return {
    start,
    stop,
    get isActive() {
      return active;
    },
  };
}

/** Convert Float32 audio samples to PCM16 Int16Array */
function floatToPcm16(float32: Float32Array): Int16Array {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return pcm;
}
