import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReply, mustRetry } from "../src/lib/conversation/feedback";

test("Exact Spanish sentence → correct, no corrections", () => {
  const fb = evaluateReply({
    expected: "Un café con leche, por favor.",
    said: "un cafe con leche por favor",
    attempt: 1,
  });
  assert.equal(fb.verdict, "correct");
  assert.equal(fb.similarity, 1);
  assert.deepEqual(fb.corrections, []);
  assert.deepEqual(fb.missing, []);
  assert.deepEqual(fb.extra, []);
});

test("Right words, wrong one → not correct, correction reported", () => {
  const fb = evaluateReply({
    expected: "Quiero un café",
    said: "Quiero un te",
    attempt: 1,
  });
  assert.notEqual(fb.verdict, "correct");
  assert.ok(
    fb.corrections.some((c) => c.wrong === "te" && c.right === "café"),
    `expected {wrong:"te", right:"café"} in ${JSON.stringify(fb.corrections)}`,
  );
});

test("Japanese romaji reply matches the phonetic path", () => {
  const fb = evaluateReply({
    expected: "すみません、駅はどこですか",
    expectedPhonetic: "sumimasen eki wa doko desu ka",
    said: "sumimasen, eki wa doko desu ka",
    attempt: 1,
  });
  assert.equal(fb.verdict, "correct");
  assert.equal(fb.similarity, 1);
  assert.deepEqual(fb.corrections, []);
  assert.deepEqual(fb.missing, []);
});

test("Japanese exact kana/kanji reply → correct via char-level path", () => {
  const phrase = "すみません、駅はどこですか";
  const fb = evaluateReply({ expected: phrase, said: phrase, attempt: 1 });
  assert.equal(fb.verdict, "correct");
  assert.equal(fb.similarity, 1);

  const greeting = evaluateReply({ expected: "こんにちは", said: "こんにちは", attempt: 1 });
  assert.equal(greeting.verdict, "correct");
  assert.deepEqual(greeting.missing, []);
});

test("Far-off reply → incorrect with missing populated", () => {
  const fb = evaluateReply({
    expected: "hola amigo",
    said: "zzz qqq",
    attempt: 1,
  });
  assert.equal(fb.verdict, "incorrect");
  assert.ok(fb.similarity >= 0 && fb.similarity < 0.55);
  assert.deepEqual(fb.missing, ["hola", "amigo"]);
});

test("Empty said → incorrect, everything missing, no corrections", () => {
  const fb = evaluateReply({ expected: "hola amigo", said: "", attempt: 2 });
  assert.equal(fb.verdict, "incorrect");
  assert.equal(fb.similarity, 0);
  assert.deepEqual(fb.missing, ["hola", "amigo"]);
  assert.deepEqual(fb.corrections, []);
  assert.deepEqual(fb.extra, []);

  const blank = evaluateReply({ expected: "hola amigo", said: "   ", attempt: 1 });
  assert.equal(blank.verdict, "incorrect");
  assert.deepEqual(blank.missing, ["hola", "amigo"]);
});

test("Hindi with real spaces → exact match is correct", () => {
  const fb = evaluateReply({
    expected: "मुझे एक कॉफ़ी चाहिए",
    said: "मुझे एक कॉफ़ी चाहिए",
    attempt: 1,
  });
  assert.equal(fb.verdict, "correct");
  assert.equal(fb.similarity, 1);
  assert.deepEqual(fb.corrections, []);
  assert.deepEqual(fb.missing, []);
});

test("Near-miss phonetic → correction without missing words", () => {
  const fb = evaluateReply({
    expected: "こんにちは",
    expectedPhonetic: "konnichiwa",
    said: "konnichiha",
    attempt: 1,
  });
  assert.ok(
    fb.corrections.some((c) => c.wrong === "konnichiha" && c.right === "konnichiwa"),
    `expected {wrong:"konnichiha", right:"konnichiwa"} in ${JSON.stringify(fb.corrections)}`,
  );
  assert.deepEqual(fb.missing, []);
  assert.ok(
    !(fb.verdict === "incorrect" && fb.missing.length > 0),
    "a tolerated near-miss must not land in missing",
  );
});

test("attempt/maxAttempts are echoed; maxAttempts defaults to 3", () => {
  const first = evaluateReply({ expected: "hola", said: "hola", attempt: 1 });
  assert.equal(first.attempt, 1);
  assert.equal(first.maxAttempts, 3);

  const last = evaluateReply({ expected: "hola", said: "hola", attempt: 3, maxAttempts: 3 });
  assert.equal(last.attempt, 3);
  assert.equal(last.maxAttempts, 3);

  const custom = evaluateReply({ expected: "hola", said: "adios", attempt: 2, maxAttempts: 5 });
  assert.equal(custom.attempt, 2);
  assert.equal(custom.maxAttempts, 5);
  assert.equal(custom.verdict, "incorrect");
});

test("Dropped word in a 10-token phrase is not correct (0.9 threshold boundary)", () => {
  const fb = evaluateReply({
    expected: "uno dos tres cuatro cinco seis siete ocho nueve diez",
    said: "uno dos tres cuatro cinco seis siete ocho nueve",
    attempt: 1,
  });
  assert.deepEqual(fb.missing, ["diez"]);
  assert.deepEqual(fb.extra, []);
  assert.ok(fb.similarity >= 0.9, `similarity ${fb.similarity} must reach the 0.9 bar`);
  assert.notEqual(fb.verdict, "correct", "a missing word must never score correct");
});

test("Extra word in a 10-token phrase is not correct", () => {
  const fb = evaluateReply({
    expected: "uno dos tres cuatro cinco seis siete ocho nueve diez",
    said: "uno dos tres cuatro cinco seis siete ocho nueve diez once",
    attempt: 1,
  });
  assert.deepEqual(fb.extra, ["once"]);
  assert.deepEqual(fb.missing, []);
  assert.ok(fb.similarity >= 0.9, `similarity ${fb.similarity} must reach the 0.9 bar`);
  assert.notEqual(fb.verdict, "correct", "an extra word must never score correct");
});

test("Mixed CJK spacing compares char-vs-char instead of garbage", () => {
  const fb = evaluateReply({
    expected: "おはようございます",
    said: "おはよう ございます",
    attempt: 1,
  });
  assert.equal(fb.said, "おはよう ございます", "said echoes the trimmed input");
  assert.notEqual(fb.verdict, "incorrect");
  assert.ok(fb.similarity >= 0.9, `similarity ${fb.similarity} should stay high for one space`);
  assert.deepEqual(fb.missing, [], "spacing must not fabricate missing words");
  assert.deepEqual(fb.extra, [], "spacing must not fabricate extra words");
});

test("mustRetry matrix: null, correct, wrong with attempts left, wrong exhausted", () => {
  assert.equal(mustRetry(null, 1), false, "no feedback never gates");

  const correct = evaluateReply({ expected: "hola", said: "hola", attempt: 1 });
  assert.equal(correct.verdict, "correct");
  assert.equal(mustRetry(correct, 1), false, "correct never gates");

  const wrongLeft = evaluateReply({ expected: "hola amigo", said: "adios", attempt: 1 });
  assert.notEqual(wrongLeft.verdict, "correct");
  assert.equal(mustRetry(wrongLeft, 1), true, "wrong with attempts left must gate");

  const wrongExhausted = evaluateReply({
    expected: "hola amigo",
    said: "adios",
    attempt: 3,
    maxAttempts: 3,
  });
  assert.notEqual(wrongExhausted.verdict, "correct");
  assert.equal(mustRetry(wrongExhausted, 3), false, "wrong but exhausted must not gate");
});
