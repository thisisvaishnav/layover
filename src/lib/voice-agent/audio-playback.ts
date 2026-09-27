/**
 * NPC audio playback for the Voice Agent API.
 * Queues and plays PCM16 audio chunks from the agent's TTS output.
 */
export interface AudioPlayback {
  /** Play a PCM16 chunk from the voice agent (base64-encoded or ArrayBuffer). */
  playChunk(data: ArrayBuffer): void;
  /** Stop playback and clear the queue. */
  stop(): void;
  /** Whether audio is currently playing. */
  readonly isPlaying: boolean;
}

export interface AudioPlaybackOptions {
  /** Called when NPC audio starts playing */
  onStart?(): void;
  /** Called when NPC audio playback ends */
  onEnd?(): void;
  sampleRate?: number;
}

/**
 * Creates an audio playback instance for NPC TTS voice output.
 * Buffers incoming PCM16 chunks and plays them in sequence without gaps.
 */
export function createAudioPlayback(opts: AudioPlaybackOptions = {}): AudioPlayback {
  const sampleRate = opts.sampleRate ?? 24000;
  let audioContext: AudioContext | null = null;
  let nextPlayTime = 0;
  let playing = false;
  let activeSources = 0;

  function getContext(): AudioContext {
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContext({ sampleRate });
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    return audioContext;
  }

  function playChunk(data: ArrayBuffer): void {
    try {
      const ctx = getContext();
      const evenBytes = data.byteLength - (data.byteLength % 2);
      if (evenBytes <= 0) return;
      const pcm16 = new Int16Array(data, 0, evenBytes / 2);
      if (pcm16.length === 0) return;

      // Convert PCM16 to Float32
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const buffer = ctx.createBuffer(1, float32.length, sampleRate);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Schedule back-to-back playback
      const now = ctx.currentTime;
      const startAt = Math.max(now, nextPlayTime);
      source.start(startAt);
      nextPlayTime = startAt + buffer.duration;
      activeSources++;

      if (!playing) {
        playing = true;
        opts.onStart?.();
        console.log("[AudioPlayback] NPC audio started");
      }

      source.onended = () => {
        activeSources = Math.max(0, activeSources - 1);
        if (activeSources === 0 && playing) {
          playing = false;
          opts.onEnd?.();
          console.log("[AudioPlayback] NPC audio ended");
        }
      };
    } catch (err) {
      console.error("[AudioPlayback] Playback error:", err);
    }
  }

  function stop(): void {
    const wasPlaying = playing;
    playing = false;
    activeSources = 0;
    nextPlayTime = 0;
    try {
      audioContext?.close();
      audioContext = null;
    } catch {
      // ignore
    }
    if (wasPlaying) opts.onEnd?.();
    console.log("[AudioPlayback] Stopped");
  }

  return {
    playChunk,
    stop,
    get isPlaying() {
      return playing;
    },
  };
}
