import test from "node:test";
import assert from "node:assert/strict";
import { buildLessonLine, matchScriptedNpcLine } from "../src/lib/conversation/format";
import { getScriptedNpcLines, getMultilingualScenario } from "../src/scenarios/multilingual";

test("TDD [Lesson Gloss Found]: Known target-language key word becomes a gloss", () => {
  const line = buildLessonLine({ text: "カフェを飲みます。", targetLang: "ja", nativeLang: "ja" });
  assert.equal(line.text, "カフェを飲みます。");
  assert.equal(line.gloss, "カフェ = コーヒーを飲む店");
});

test("TDD [Lesson Gloss Missing]: Unknown words produce no gloss key", () => {
  const line = buildLessonLine({
    text: "気象学は難しい",
    targetLang: "ja",
    nativeLang: "ja",
  });
  assert.equal(line.gloss, undefined);
  assert.equal("gloss" in line, false);
});

test("TDD [Lesson Gloss Accents]: Gloss matches without punctuation or exact casing", () => {
  const punctuated = buildLessonLine({ text: "バスです。", targetLang: "ja", nativeLang: "ja" });
  assert.equal(punctuated.gloss, "バス = 大型の乗合乗り物");

  const upper = buildLessonLine({ text: "KONNICHIWA", targetLang: "ja", nativeLang: "ja" });
  assert.equal(upper.gloss, "KONNICHIWA = 昼間のあいさつ");
});

test("TDD [Lesson Gloss Longest Match]: Longest glossary entry wins over shorter words", () => {
  const line = buildLessonLine({
    text: "バス停留所",
    targetLang: "ja",
    nativeLang: "ja",
  });
  assert.equal(line.gloss, "停留所 = バス停");
});

test("TDD [Lesson Line Fields]: Trims text and turns empty optionals into undefined", () => {
  const empty = buildLessonLine({
    text: "  こんにちは  ",
    phonetic: "",
    translation: "   ",
    targetLang: "ja",
    nativeLang: "ja",
  });
  assert.equal(empty.text, "こんにちは");
  assert.equal(empty.phonetic, undefined);
  assert.equal(empty.translation, undefined);
  assert.equal(empty.gloss, "こんにちは = 昼間のあいさつ");

  const filled = buildLessonLine({
    text: " こんにちは ",
    phonetic: " OH-lah ",
    translation: " Hello ",
    targetLang: "ja",
    nativeLang: "ja",
  });
  assert.deepEqual(filled, {
    text: "こんにちは",
    phonetic: "OH-lah",
    translation: "Hello",
    gloss: "こんにちは = 昼間のあいさつ",
  });
});

test("TDD [Lesson Gloss Native Meaning]: Learner meaning is used, unknown learners fall back to Japanese", () => {
  const native = buildLessonLine({ text: "水", targetLang: "ja", nativeLang: "ja" });
  assert.equal(native.gloss, "水 = みず");

  const unknownLearner = buildLessonLine({ text: "水", targetLang: "ja", nativeLang: "tr" });
  assert.equal(unknownLearner.gloss, "水 = みず");
});

test("TDD [Scripted Match Exact]: Real Japanese cafe line matches its phonetic and translation", () => {
  const scripted = getScriptedNpcLines("ja", "cafe")[0];
  assert.equal(scripted.text, "いらっしゃいませ！ご注文はお決まりですか？");
  assert.equal(scripted.phonetic, "Irasshaimase! Go-chuumon wa o-kimari desu ka?");

  const match = matchScriptedNpcLine({
    text: scripted.text,
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.ok(match, "Scripted Japanese cafe line must match");
  assert.equal(match.phonetic, scripted.phonetic);
  assert.equal(match.translation, scripted.translations.ja);
  assert.equal(match.translation, scripted.text);

  const unknownNative = matchScriptedNpcLine({
    text: scripted.text,
    targetLang: "ja",
    nativeLang: "de",
    zone: "cafe",
  });
  assert.equal(unknownNative?.translation, scripted.translations.ja);
});

test("TDD [Scripted Match Normalized]: Case, punctuation and emoji are ignored", () => {
  const scripted = getScriptedNpcLines("ja", "cafe")[0];
  const match = matchScriptedNpcLine({
    text: "  🎉 いらっしゃいませ！ご注文はお決まりですか？?  ",
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.ok(match, "Decorated transcript must still match the scripted line");
  assert.equal(match.phonetic, scripted.phonetic);
  assert.equal(match.translation, scripted.translations.ja);
});

test("TDD [Scripted Match Miss]: Unrelated transcript returns null", () => {
  const match = matchScriptedNpcLine({
    text: "The weather in London is quite mild today.",
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.equal(match, null);

  const unknownLang = matchScriptedNpcLine({
    text: getScriptedNpcLines("ja", "cafe")[0].text,
    targetLang: "xx",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.equal(unknownLang, null);
});

test("TDD [Scripted Match Zone]: bus zone normalizes to bus_stop scenarios", () => {
  const busLine = getScriptedNpcLines("ja", "bus_stop")[0];
  assert.equal(busLine.text, "どちらまでご利用ですか？");

  const busMatch = matchScriptedNpcLine({
    text: busLine.text,
    targetLang: "ja",
    nativeLang: "ja",
    zone: "bus",
  });
  assert.ok(busMatch, "zone 'bus' must resolve to the bus_stop scenario");
  assert.equal(busMatch.phonetic, busLine.phonetic);
  assert.equal(busMatch.translation, busLine.translations.ja);

  const cafeMiss = matchScriptedNpcLine({
    text: busLine.text,
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.equal(cafeMiss, null, "bus line must not match cafe steps");
});

test("TDD [Scripted Match Fallback]: Missing learner translation falls back to Japanese", () => {
  const japaneseCafe = getScriptedNpcLines("ja", "cafe")[0];
  assert.equal(japaneseCafe.translations.de, undefined, "fixture must lack a non-Japanese translation");

  const match = matchScriptedNpcLine({
    text: japaneseCafe.text,
    targetLang: "ja",
    nativeLang: "de",
    zone: "cafe",
  });
  assert.ok(match, "Japanese cafe line must match");
  assert.equal(match.translation, japaneseCafe.translations.ja);
});

test("TDD [Scripted Match Barber]: Barber greeting literals resolve for barber zone", () => {
  const scenario = getMultilingualScenario("ja", "ja", "barber");
  const match = matchScriptedNpcLine({
    text: scenario.greeting,
    targetLang: "ja",
    nativeLang: "ja",
    zone: "barber",
  });
  assert.ok(match, "Barber greeting must match");
  assert.equal(match.translation, scenario.dialogue.npcNativeTranslation);
});

test("TDD [Scripted Match Fragment]: Short substring does not inherit a whole-line translation", () => {
  const fragment = matchScriptedNpcLine({
    text: "いらっしゃいませ",
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.equal(fragment, null, "single-phrase fragment must not inherit a scripted sentence translation");

  const truncated = matchScriptedNpcLine({
    text: "いらっしゃいませ！ご注文はお",
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.ok(truncated, "a near-complete transcript must still match");
  assert.equal(truncated.translation, "いらっしゃいませ！ご注文はお決まりですか？");
});

test("TDD [Gloss Boundary]: Glossary entry inside a larger word does not gloss", () => {
  const insideWord = buildLessonLine({
    text: "kafeteria de nomimasu",
    targetLang: "ja",
    nativeLang: "ja",
  });
  assert.equal(insideWord.gloss, undefined, "kafe inside kafeteria must not gloss");

  const bounded = buildLessonLine({
    text: "kafe de nomimasu",
    targetLang: "ja",
    nativeLang: "ja",
  });
  assert.equal(bounded.gloss, "kafe = コーヒーを飲む店");
});
