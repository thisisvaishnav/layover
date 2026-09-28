/**
 * TDD Evidence: Reply feedback gating
 *
 * Tests cover:
 *  - finalizeUserTurn evaluates the reply against suggestedTarget
 *  - advanceStep is gated on verdict / attemptCount
 *  - duplicate-turn guard does not double-append or burn an attempt
 *  - legacy behavior when no suggestedTarget is set
 *  - openConversation / closeConversation reset reply state
 *  - empty transcript early-return
 */

import test from "node:test";
import assert from "node:assert/strict";
import { useConversationStore } from "../src/lib/conversation/store";
import type { ReplyFeedback } from "../src/lib/conversation/feedback";

const TARGET = "Quiero un café, por favor.";

function resetStore(target: string = TARGET): void {
  useConversationStore.setState({
    status: "LISTENING",
    messages: [],
    currentNpcName: "Mateo",
    currentObjective: "Order a coffee",
    currentStep: 1,
    totalSteps: 3,
    isInRange: true,
    isOpen: true,
    errorMessage: null,
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
    suggestedTarget: target,
    suggestedPhonetics: "",
    suggestedNative: "",
    replyFeedback: null,
    attemptCount: 0,
  });
}

function wrongFeedback(attempt: number, maxAttempts = 3): ReplyFeedback {
  return {
    verdict: "incorrect",
    similarity: 0,
    corrections: [],
    missing: ["Quiero", "café"],
    extra: [],
    said: "Quiero un te",
    attempt,
    maxAttempts,
  };
}

test("TDD [ReplyGating]: wrong reply evaluates and records attempt", () => {
  resetStore();
  useConversationStore.getState().finalizeUserTurn("Quiero un te");
  const s = useConversationStore.getState();

  assert.ok(s.replyFeedback, "replyFeedback must be recorded for a wrong reply");
  assert.notEqual(s.replyFeedback!.verdict, "correct", "a wrong reply must not be correct");
  assert.ok(
    s.replyFeedback!.verdict === "close" || s.replyFeedback!.verdict === "incorrect",
    `expected close|incorrect, got ${s.replyFeedback!.verdict}`,
  );
  assert.equal(s.replyFeedback!.attempt, 1);
  assert.equal(s.attemptCount, 1);
  assert.equal(s.status, "PROCESSING");
  assert.equal(s.messages.length, 1, "USER message must be appended");
  assert.equal(s.messages[0].speaker, "USER");
  assert.equal(s.messages[0].text, "Quiero un te");
});

test("TDD [ReplyGating]: wrong reply blocks advanceStep", () => {
  resetStore();
  useConversationStore.getState().finalizeUserTurn("Quiero un te");
  assert.equal(useConversationStore.getState().attemptCount, 1);

  useConversationStore.getState().advanceStep();
  const s = useConversationStore.getState();

  assert.equal(s.currentStep, 1, "advanceStep must not advance on a wrong reply");
  assert.ok(s.replyFeedback, "replyFeedback must remain present after a blocked advance");
  assert.notEqual(s.replyFeedback!.verdict, "correct");
  assert.equal(s.attemptCount, 1, "a blocked advance must not burn an attempt");
});

test("TDD [ReplyGating]: correct reply advances and clears reply state", () => {
  resetStore();
  // Feedback from an earlier wrong attempt…
  useConversationStore.getState().finalizeUserTurn("Quiero un te");
  assert.equal(useConversationStore.getState().replyFeedback!.verdict, "incorrect");

  // …then the learner says it right.
  useConversationStore.getState().finalizeUserTurn("Quiero un café, por favor");
  const mid = useConversationStore.getState();
  assert.equal(mid.replyFeedback!.verdict, "correct");
  assert.equal(mid.currentStep, 1, "still on the same step until advanceStep is called");

  useConversationStore.getState().advanceStep();
  const s = useConversationStore.getState();
  assert.equal(s.currentStep, 2, "correct reply must advance the step");
  assert.equal(s.replyFeedback, null, "advance must clear replyFeedback");
  assert.equal(s.attemptCount, 0, "advance must reset attemptCount");
});

test("TDD [ReplyGating]: force-advance after the final attempt", () => {
  resetStore();
  useConversationStore.setState({
    attemptCount: 2,
    replyFeedback: wrongFeedback(2, 3),
  });

  useConversationStore.getState().finalizeUserTurn("nonsense words here");
  const mid = useConversationStore.getState();
  assert.equal(mid.attemptCount, 3, "third attempt must be recorded");
  assert.equal(mid.replyFeedback!.attempt, 3);
  assert.equal(mid.replyFeedback!.maxAttempts, 3);
  assert.notEqual(mid.replyFeedback!.verdict, "correct");

  useConversationStore.getState().advanceStep();
  const s = useConversationStore.getState();
  assert.equal(s.currentStep, 2, "last attempt must force the advance");
  assert.equal(s.replyFeedback, null, "forced advance must clear replyFeedback");
  assert.equal(s.attemptCount, 0, "forced advance must reset attemptCount");
});

test("TDD [ReplyGating]: duplicate turn is ignored — no double append, no attempt burn", () => {
  resetStore();
  useConversationStore.getState().finalizeUserTurn("Quiero un te");
  assert.equal(useConversationStore.getState().attemptCount, 1);

  // Same normalized text redelivered inside the 8000 ms guard window.
  useConversationStore.getState().finalizeUserTurn("  quiero  un  TE ");
  const s = useConversationStore.getState();

  const userMsgs = s.messages.filter((m) => m.speaker === "USER");
  assert.equal(userMsgs.length, 1, "duplicate turn must not append a second USER message");
  assert.equal(s.attemptCount, 1, "duplicate turn must not burn an attempt");
  assert.equal(s.replyFeedback!.attempt, 1, "evaluation must stay on the original attempt");
});

test("TDD [ReplyGating]: no suggestedTarget keeps legacy behavior", () => {
  resetStore("");
  useConversationStore.getState().finalizeUserTurn("hola");
  const s = useConversationStore.getState();

  assert.equal(s.replyFeedback, null, "no target → no evaluation");
  assert.equal(s.attemptCount, 0, "no target → no attempt burned");
  assert.equal(s.messages.length, 1, "message still appended");
  assert.equal(s.messages[0].speaker, "USER");
  assert.equal(s.status, "PROCESSING");

  useConversationStore.getState().advanceStep();
  const after = useConversationStore.getState();
  assert.equal(after.currentStep, 2, "ungated advance must work as before");
  assert.equal(after.replyFeedback, null);
  assert.equal(after.attemptCount, 0);
});

test("TDD [ReplyGating]: openConversation resets replyFeedback and attemptCount", () => {
  resetStore();
  useConversationStore.setState({
    attemptCount: 2,
    replyFeedback: wrongFeedback(2, 3),
  });

  useConversationStore.getState().openConversation("Mateo", "Order a coffee", 3, {
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
    suggestedTarget: TARGET,
  });
  const s = useConversationStore.getState();

  assert.equal(s.isOpen, true);
  assert.equal(s.replyFeedback, null, "open must clear replyFeedback");
  assert.equal(s.attemptCount, 0, "open must reset attemptCount");
});

test("TDD [ReplyGating]: closeConversation resets replyFeedback and attemptCount", () => {
  resetStore();
  useConversationStore.setState({
    attemptCount: 2,
    replyFeedback: wrongFeedback(2, 3),
  });

  useConversationStore.getState().closeConversation();
  const s = useConversationStore.getState();

  assert.equal(s.isOpen, false);
  assert.equal(s.status, "CLOSED");
  assert.equal(s.replyFeedback, null, "close must clear replyFeedback");
  assert.equal(s.attemptCount, 0, "close must reset attemptCount");
});

test("TDD [ReplyGating]: empty transcript is ignored — no message, no evaluation", () => {
  resetStore();
  useConversationStore.setState({
    attemptCount: 1,
    replyFeedback: wrongFeedback(1, 3),
  });

  useConversationStore.getState().finalizeUserTurn("");
  const s = useConversationStore.getState();

  assert.equal(s.messages.length, 0, "empty text must not append a USER message");
  assert.equal(s.attemptCount, 1, "empty text must not change attemptCount");
  assert.ok(s.replyFeedback, "empty text must not re-evaluate");
  assert.equal(s.replyFeedback!.attempt, 1, "existing evaluation must be untouched");
});
