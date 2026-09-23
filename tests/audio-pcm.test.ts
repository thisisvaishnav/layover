import test from "node:test";
import assert from "node:assert/strict";
import {
  float32ToInt16,
  int16ToFloat32,
  int16ToBase64,
  base64ToInt16,
  resampleAudio,
  calculateRms,
} from "../src/lib/audio/pcm";

test("PCM conversion: Float32 <-> Int16 roundtrip preserves amplitude", () => {
  const inputFloat32 = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0]);
  const int16 = float32ToInt16(inputFloat32);

  assert.equal(int16[0], 0);
  assert.equal(int16[1], 16383);
  assert.equal(int16[2], -16384);
  assert.equal(int16[3], 32767);
  assert.equal(int16[4], -32768);

  const outputFloat32 = int16ToFloat32(int16);
  assert.ok(Math.abs(outputFloat32[1] - 0.5) < 0.001);
  assert.ok(Math.abs(outputFloat32[2] - -0.5) < 0.001);
});

test("Base64 encoding/decoding of Int16 PCM audio", () => {
  const original = new Int16Array([1000, -2000, 3000, -4000, 0]);
  const base64 = int16ToBase64(original);
  assert.ok(typeof base64 === "string");
  assert.ok(base64.length > 0);

  const decoded = base64ToInt16(base64);
  assert.equal(decoded.length, original.length);
  for (let i = 0; i < original.length; i++) {
    assert.equal(decoded[i], original[i]);
  }
});

test("Audio resampling from 48000Hz to 24000Hz halves sample length", () => {
  const source = new Float32Array(480);
  const resampled = resampleAudio(source, 48000, 24000);
  assert.equal(resampled.length, 240);
});

test("Audio RMS calculation detects silence vs active speech", () => {
  const silence = new Float32Array(100).fill(0);
  assert.equal(calculateRms(silence), 0);

  const active = new Float32Array(100).fill(0.2);
  const rms = calculateRms(active);
  assert.ok(rms > 0);
  assert.ok(rms <= 1);
});
