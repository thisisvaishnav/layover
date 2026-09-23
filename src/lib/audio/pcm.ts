// Audio processing utilities for 24kHz PCM16 Mono
export const TARGET_SAMPLE_RATE = 24000;

/**
 * Converts Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
 */
export function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/**
 * Converts Int16Array to Float32Array
 */
export function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

/**
 * Encodes an Int16Array buffer to Base64 string
 */
export function int16ToBase64(int16: Int16Array): string {
  const uint8 = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string to Int16Array
 */
export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const len = binary.length;
  const uint8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    uint8[i] = binary.charCodeAt(i);
  }
  return new Int16Array(uint8.buffer);
}

/**
 * Resamples Float32 audio from sourceSampleRate to targetSampleRate
 */
export function resampleAudio(
  audioData: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) return audioData;

  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const indexFloor = Math.floor(originalIndex);
    const indexCeil = Math.min(audioData.length - 1, Math.ceil(originalIndex));
    const interpolation = originalIndex - indexFloor;
    result[i] =
      audioData[indexFloor] * (1 - interpolation) +
      audioData[indexCeil] * interpolation;
  }

  return result;
}

/**
 * Calculates audio level (0.0 to 1.0) for visual meters
 */
export function calculateRms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / buffer.length);
  // Normalize & scale non-linearly for UI reactivity
  return Math.min(1, rms * 5);
}

/**
 * Low-latency audio queue player for streaming NPC speech
 */
export class AudioQueuePlayer {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized on first user interaction
  }

  public init() {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: TARGET_SAMPLE_RATE });
      this.nextPlayTime = this.audioCtx.currentTime;
    }

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public enqueuePcmBase64(base64: string) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const int16 = base64ToInt16(base64);
      const float32 = int16ToFloat32(int16);

      const buffer = this.audioCtx.createBuffer(
        1,
        float32.length,
        TARGET_SAMPLE_RATE
      );
      buffer.getChannelData(0).set(float32);

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      // Add slight jitter buffer (20ms) if falling behind
      const startTime = Math.max(now + 0.02, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + buffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  }

  /**
   * Stop all currently scheduled or playing audio immediately (Barge-in / Interrupt)
   */
  public flush() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Ignored if already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.flush();
    }
  }

  public close() {
    this.flush();
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close();
    }
    this.audioCtx = null;
  }
}
