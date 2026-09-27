import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceAgentClient } from "../src/lib/voice-agent/voice-agent-client";

type Restore = () => void;

interface SentMessage {
  raw: string;
  parsed: Record<string, unknown>;
}

/**
 * Minimal WebSocket stand-in that records every outbound message so the test
 * can assert on the exact wire format the client produces.
 */
class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static last: FakeWebSocket | null = null;

  readyState = FakeWebSocket.CONNECTING;
  binaryType = "";
  sent: SentMessage[] = [];
  closeCode: number | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.last = this;
  }

  send(data: string | ArrayBuffer): void {
    if (typeof data === "string") {
      this.sent.push({ raw: data, parsed: JSON.parse(data) as Record<string, unknown> });
    } else {
      // The old client shipped raw PCM this way — AssemblyAI answers
      // "Expected JSON string" and the session dies. Never again.
      this.sent.push({ raw: `<binary ${data.byteLength}B>`, parsed: { type: "<binary-frame>" } });
    }
  }

  close(code = 1000, reason = ""): void {
    this.closeCode = code;
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }

  /** Test helper: complete the handshake. */
  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  /** Test helper: deliver a server event. */
  emit(payload: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  types(): string[] {
    return this.sent.map((m) => String(m.parsed.type));
  }
}

class FakeAudioNode {
  connect(): void {}
  disconnect(): void {}
}

class FakeAudioContext {
  state = "running";
  destination = new FakeAudioNode();
  static processors: Array<{ onaudioprocess: ((e: unknown) => void) | null }> = [];

  constructor() {}
  resume(): Promise<void> {
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }
  createMediaStreamSource(): FakeAudioNode {
    return new FakeAudioNode();
  }
  createScriptProcessor(): { onaudioprocess: ((e: unknown) => void) | null; connect(): void; disconnect(): void } {
    const node = {
      onaudioprocess: null as ((e: unknown) => void) | null,
      connect(): void {},
      disconnect(): void {},
    };
    FakeAudioContext.processors.push(node);
    return node;
  }
  createGain(): FakeAudioNode & { gain: { value: number } } {
    const node = new FakeAudioNode() as FakeAudioNode & { gain: { value: number } };
    node.gain = { value: 1 };
    return node;
  }
}

function stubGlobals(): Restore {
  const originals = {
    fetch: globalThis.fetch,
    ws: (globalThis as { WebSocket?: unknown }).WebSocket,
    audio: (globalThis as { AudioContext?: unknown }).AudioContext,
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  };

  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ token: "test-token" }),
  })) as unknown as typeof fetch;

  (globalThis as { WebSocket?: unknown }).WebSocket = FakeWebSocket;
  (globalThis as { AudioContext?: unknown }).AudioContext = FakeAudioContext;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      mediaDevices: {
        getUserMedia: () =>
          Promise.resolve({ getTracks: () => [{ stop() {} }] }),
      },
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return () => {
    globalThis.fetch = originals.fetch;
    (globalThis as { WebSocket?: unknown }).WebSocket = originals.ws;
    (globalThis as { AudioContext?: unknown }).AudioContext = originals.audio;
    if (originals.navigator) {
      Object.defineProperty(globalThis, "navigator", originals.navigator);
    } else {
      Reflect.deleteProperty(globalThis, "navigator");
    }
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeClient() {
  const calls = {
    connected: 0,
    partial: [] as string[],
    final: [] as string[],
    errors: [] as string[],
    sessionEnded: 0,
  };
  const client = createVoiceAgentClient({
    systemPrompt: "You are a barista.",
    greeting: "Hola!",
    onPartialTranscript: (t) => calls.partial.push(t),
    onFinalTranscript: (t) => calls.final.push(t),
    onNpcTurnStart() {},
    onNpcMessage() {},
    onNpcTurnEnd() {},
    onConnected() {
      calls.connected++;
    },
    onError: (m) => calls.errors.push(m),
    onSessionEnded() {
      calls.sessionEnded++;
    },
  });
  return { client, calls };
}

/** Fire one mic chunk through the ScriptProcessor the client wired up. */
function fireMicChunk(samples = 256): void {
  const processor = FakeAudioContext.processors[FakeAudioContext.processors.length - 1];
  assert.ok(processor, "client must have created a ScriptProcessorNode");
  assert.ok(processor.onaudioprocess, "client must have installed onaudioprocess");
  processor.onaudioprocess({
    inputBuffer: { getChannelData: () => new Float32Array(samples) },
  });
}

test("TDD [Voice Protocol]: streams input.audio JSON only after session.ready", async () => {
  const restore = stubGlobals();
  FakeWebSocket.last = null;
  FakeAudioContext.processors = [];
  try {
    const { client, calls } = makeClient();
    await client.connect();

    // Re-widen: TS keeps the `null` narrowing from the reset above across calls.
    const ws = FakeWebSocket.last as FakeWebSocket | null;
    assert.ok(ws, "connect() must open a WebSocket");
    ws.open();
    await tick();

    // 1. First message out is always the session configuration.
    assert.equal(ws.sent.length, 1, "only session.update may be sent on open");
    assert.equal(ws.types()[0], "session.update");

    // 2. Before session.ready the mic is never even opened.
    assert.equal(
      FakeAudioContext.processors.length,
      0,
      "mic must stay closed until session.ready"
    );
    assert.equal(calls.connected, 0, "onConnected must not fire before session.ready");

    // 3. session.updated is only an ack — still not ready to stream.
    ws.emit({ type: "session.updated" });
    await tick();
    assert.equal(calls.connected, 0, "session.updated must not mark the session ready");

    // 4. session.ready unlocks the mic and notifies the UI.
    ws.emit({ type: "session.ready", session_id: "sess_test" });
    await tick();
    await tick();
    assert.equal(calls.connected, 1, "onConnected must fire exactly once");
    assert.equal(client.isRecording, true, "mic must be streaming after session.ready");

    // 5. Mic audio now goes out as base64 input.audio, never as binary frames.
    fireMicChunk(256);
    assert.equal(
      ws.sent.filter((m) => m.parsed.type === "<binary-frame>").length,
      0,
      "audio must never be sent as a raw binary WebSocket frame"
    );
    const audioMsgs = ws.sent.filter((m) => m.parsed.type === "input.audio");
    assert.equal(audioMsgs.length, 1, "each mic chunk becomes one input.audio message");
    const audio = audioMsgs[0].parsed.audio;
    assert.equal(typeof audio, "string", "input.audio must carry base64 audio");
    assert.equal(
      Buffer.from(audio as string, "base64").length,
      256 * 2,
      "base64 payload must decode to PCM16 bytes (2 bytes per sample)"
    );

    // 6. Typed text uses AssemblyAI's conversation.message, not OpenAI's shape.
    assert.equal(client.sendTextMessage("Un café, por favor."), true);
    const textMsg = ws.sent[ws.sent.length - 1].parsed;
    assert.equal(textMsg.type, "conversation.message");
    assert.equal(textMsg.content, "Un café, por favor.");

    // 7. Closing the conversation ends the session instead of leaving it billable.
    client.disconnect();
    assert.ok(ws.types().includes("session.end"), "disconnect must send session.end");
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(ws.closeCode, 1000, "socket must still close after session.end");
  } finally {
    restore();
  }
});

test("TDD [Voice Protocol]: recoverable session.error does not kill the session", async () => {
  const restore = stubGlobals();
  FakeWebSocket.last = null;
  FakeAudioContext.processors = [];
  try {
    const { client, calls } = makeClient();
    await client.connect();
    const ws = FakeWebSocket.last!;
    ws.open();
    await tick();
    ws.emit({ type: "session.ready", session_id: "sess_test" });
    await tick();
    await tick();

    // A malformed inbound message keeps the session alive per AssemblyAI docs.
    ws.emit({ type: "session.error", code: "invalid_format", message: "Expected JSON string" });
    assert.equal(calls.sessionEnded, 0, "invalid_format must not end the session");
    assert.equal(calls.errors.length, 0, "invalid_format must not surface as a fatal error");

    // Auth / expiry failures are fatal.
    ws.emit({ type: "session.error", code: "session_expired", message: "Session TTL reached" });
    assert.equal(calls.sessionEnded, 1, "fatal codes must end the session");
    assert.equal(calls.errors.length, 1, "fatal codes must be reported to the UI");
  } finally {
    restore();
  }
});
