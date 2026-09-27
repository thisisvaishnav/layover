import test from "node:test";
import assert from "node:assert/strict";
import { createMicrophoneCapture } from "../src/lib/voice-agent/audio-capture";
import { useConversationStore } from "../src/lib/conversation/store";

type Restore = () => void;

function stubNavigator(getUserMedia: () => Promise<unknown>): Restore {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: { mediaDevices: { getUserMedia } },
    configurable: true,
    enumerable: true,
  });
  return () => {
    if (original) {
      Object.defineProperty(globalThis, "navigator", original);
    } else {
      Reflect.deleteProperty(globalThis, "navigator");
    }
  };
}

class FakeAudioNode {
  connect(): void {}
  disconnect(): void {}
}

class FakeAudioContext {
  state = "running";
  destination = new FakeAudioNode();
  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }
  createMediaStreamSource(): FakeAudioNode {
    return new FakeAudioNode();
  }
  createScriptProcessor(): { onaudioprocess: ((e: unknown) => void) | null } & FakeAudioNode {
    const node = new FakeAudioNode() as { onaudioprocess: ((e: unknown) => void) | null } & FakeAudioNode;
    node.onaudioprocess = null;
    return node;
  }
  createGain(): FakeAudioNode & { gain: { value: number } } {
    const node = new FakeAudioNode() as FakeAudioNode & { gain: { value: number } };
    node.gain = { value: 1 };
    return node;
  }
}

function stubAudioContext(): Restore {
  const original = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  Object.defineProperty(globalThis, "AudioContext", {
    value: FakeAudioContext,
    configurable: true,
    enumerable: true,
  });
  return () => {
    if (original) {
      Object.defineProperty(globalThis, "AudioContext", original);
    } else {
      Reflect.deleteProperty(globalThis, "AudioContext");
    }
  };
}

function makeFakeStream(stopped: string[]): { getTracks(): Array<{ stop(): void }> } {
  return {
    getTracks: () => [
      {
        stop: () => stopped.push("track"),
      },
    ],
  };
}

test("TDD [Mic Lifecycle]: stop() while getUserMedia is pending discards the stream", async () => {
  const stopped: string[] = [];
  let resolveGetUserMedia!: (stream: unknown) => void;
  const pending = new Promise<unknown>((resolve) => {
    resolveGetUserMedia = resolve;
  });

  const restoreNavigator = stubNavigator(() => pending);
  try {
    const capture = createMicrophoneCapture({ onAudioChunk() {}, onError() {} });

    const startPromise = capture.start();
    // Session dies while the permission request is still in flight
    capture.stop();
    resolveGetUserMedia(makeFakeStream(stopped));

    const ok = await startPromise;
    assert.equal(ok, false, "start() must fail when stop() raced it");
    assert.equal(capture.isActive, false, "capture must not report active");
    assert.equal(stopped.length, 1, "orphaned MediaStream tracks must be stopped");
  } finally {
    restoreNavigator();
  }
});

test("TDD [Mic Lifecycle]: stop() releases the microphone device", async () => {
  const stopped: string[] = [];
  const stream = makeFakeStream(stopped);

  const restoreNavigator = stubNavigator(() => Promise.resolve(stream));
  const restoreAudioContext = stubAudioContext();
  try {
    const capture = createMicrophoneCapture({ onAudioChunk() {}, onError() {} });

    const ok = await capture.start();
    assert.equal(ok, true, "start() must succeed with a granted stream");
    assert.equal(capture.isActive, true);
    assert.equal(stopped.length, 0, "stream stays live while active");

    capture.stop();
    assert.equal(capture.isActive, false, "stop() must deactivate capture");
    assert.equal(stopped.length, 1, "stop() must stop the mic tracks (OS indicator off)");

    // A later start() (user gesture) can re-acquire the device
    const restarted = await capture.start();
    assert.equal(restarted, true, "capture must be restartable after stop()");
    capture.stop();
    assert.equal(stopped.length, 2, "each stop() must release its own stream");
  } finally {
    restoreNavigator();
    restoreAudioContext();
  }
});

test("TDD [Mic Lifecycle]: a failed start() reports an error without leaving the capture active", async () => {
  const restoreNavigator = stubNavigator(() =>
    Promise.reject(new Error("Permission denied"))
  );
  try {
    const errors: string[] = [];
    const capture = createMicrophoneCapture({
      onAudioChunk() {},
      onError: (err) => errors.push(err.message),
    });

    const ok = await capture.start();
    assert.equal(ok, false, "denied permission must fail start()");
    assert.equal(capture.isActive, false, "capture must stay inactive after failure");
    assert.equal(errors.length, 1, "caller must be told the mic is unavailable");
  } finally {
    restoreNavigator();
  }
});

test("TDD [Conversation Session]: openConversation bumps sessionVersion and closeConversation releases the mic flag", () => {
  const before = useConversationStore.getState().sessionVersion ?? 0;

  useConversationStore.getState().openConversation("Mateo", "Order a coffee", 3);
  const opened = useConversationStore.getState();
  assert.equal(opened.sessionVersion, before + 1, "each open must be observable by lifecycle listeners");
  assert.equal(opened.isOpen, true);
  assert.equal(opened.isMicRecording, false, "a freshly opened conversation never claims an open mic");

  useConversationStore.getState().setIsMicRecording(true);
  useConversationStore.getState().closeConversation();
  const closed = useConversationStore.getState();
  assert.equal(closed.isOpen, false, "closing must hide the conversation");
  assert.equal(closed.isMicRecording, false, "closing must never leave the mic flag set");
});
