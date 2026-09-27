import test from "node:test";
import assert from "node:assert/strict";
import { buildLessonLine, matchScriptedNpcLine } from "../src/lib/conversation/format";
import { getScriptedNpcLines, getMultilingualScenario } from "../src/scenarios/multilingual";

test("TDD [Lesson Gloss Found]: Known target-language key word becomes a gloss", () => {
  const line = buildLessonLine({ text: "Necesito un café.", targetLang: "es", nativeLang: "en" });
  assert.equal(line.text, "Necesito un café.");
  assert.equal(line.gloss, "café = coffee");
});

test("TDD [Lesson Gloss Missing]: Unknown words produce no gloss key", () => {
  const line = buildLessonLine({
    text: "Meteorología complicada",
    targetLang: "es",
    nativeLang: "en",
  });
  assert.equal(line.gloss, undefined);
  assert.equal("gloss" in line, false);
});

test("TDD [Lesson Gloss Accents]: Gloss matches without accents or exact casing", () => {
  const line = buildLessonLine({ text: "Donde esta?", targetLang: "es", nativeLang: "en" });
  assert.equal(line.gloss, "Donde = where");

  const upper = buildLessonLine({ text: "DONDE esta?", targetLang: "es", nativeLang: "en" });
  assert.equal(upper.gloss, "DONDE = where");
});

test("TDD [Lesson Gloss Longest Match]: Multi-word entry wins over shorter words", () => {
  const line = buildLessonLine({
    text: "Quiero un café por favor.",
    targetLang: "es",
    nativeLang: "en",
  });
  assert.equal(line.gloss, "por favor = please");
});

test("TDD [Lesson Line Fields]: Trims text and turns empty optionals into undefined", () => {
  const empty = buildLessonLine({
    text: "  Hola  ",
    phonetic: "",
    translation: "   ",
    targetLang: "es",
    nativeLang: "en",
  });
  assert.equal(empty.text, "Hola");
  assert.equal(empty.phonetic, undefined);
  assert.equal(empty.translation, undefined);
  assert.equal(empty.gloss, "Hola = hello");

  const filled = buildLessonLine({
    text: " Hola ",
    phonetic: " OH-lah ",
    translation: " Hello ",
    targetLang: "es",
    nativeLang: "en",
  });
  assert.deepEqual(filled, {
    text: "Hola",
    phonetic: "OH-lah",
    translation: "Hello",
    gloss: "Hola = hello",
  });
});

test("TDD [Lesson Gloss Native Meaning]: Learner language meaning beats English fallback", () => {
  const native = buildLessonLine({ text: "Café", targetLang: "es", nativeLang: "ja" });
  assert.equal(native.gloss, "Café = コーヒー");

  const english = buildLessonLine({ text: "Café", targetLang: "es", nativeLang: "en" });
  assert.equal(english.gloss, "Café = coffee");

  const unknownLearner = buildLessonLine({ text: "Café", targetLang: "es", nativeLang: "tr" });
  assert.equal(unknownLearner.gloss, "Café = coffee");
});

test("TDD [Scripted Match Exact]: Real Spanish cafe line matches its phonetic and translation", () => {
  const scripted = getScriptedNpcLines("es", "cafe")[0];
  assert.equal(scripted.text, "¿Qué te pongo, amigo?");
  assert.equal(scripted.phonetic, "Keh teh POHN-goh, ah-MEE-goh?");

  const match = matchScriptedNpcLine({
    text: scripted.text,
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.ok(match, "Scripted Spanish cafe line must match");
  assert.equal(match.phonetic, scripted.phonetic);
  assert.equal(match.translation, scripted.translations.en);
  assert.equal(match.translation, "What can I get you, friend?");

  const nativeMatch = matchScriptedNpcLine({
    text: scripted.text,
    targetLang: "es",
    nativeLang: "ja",
    zone: "cafe",
  });
  assert.equal(nativeMatch?.translation, scripted.translations.ja);
});

test("TDD [Scripted Match Normalized]: Case, punctuation and emoji are ignored", () => {
  const scripted = getScriptedNpcLines("es", "cafe")[0];
  const match = matchScriptedNpcLine({
    text: "  🎉 ¿QUÉ TE PONGO, AMIGO??  ",
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.ok(match, "Decorated transcript must still match the scripted line");
  assert.equal(match.phonetic, scripted.phonetic);
  assert.equal(match.translation, scripted.translations.en);
});

test("TDD [Scripted Match Miss]: Unrelated transcript returns null", () => {
  const match = matchScriptedNpcLine({
    text: "The weather in London is quite mild today.",
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.equal(match, null);

  const unknownLang = matchScriptedNpcLine({
    text: getScriptedNpcLines("es", "cafe")[0].text,
    targetLang: "xx",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.equal(unknownLang, null);
});

test("TDD [Scripted Match Zone]: bus zone normalizes to bus_stop scenarios", () => {
  const busLine = getScriptedNpcLines("es", "bus_stop")[0];
  assert.equal(busLine.text, "¡Buenas! ¿Adónde viajas?");

  const busMatch = matchScriptedNpcLine({
    text: busLine.text,
    targetLang: "es",
    nativeLang: "en",
    zone: "bus",
  });
  assert.ok(busMatch, "zone 'bus' must resolve to the bus_stop scenario");
  assert.equal(busMatch.phonetic, busLine.phonetic);
  assert.equal(busMatch.translation, busLine.translations.en);

  const cafeMiss = matchScriptedNpcLine({
    text: busLine.text,
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.equal(cafeMiss, null, "bus line must not match cafe steps");
});

test("TDD [Scripted Match English Fallback]: Missing learner translation falls back to en", () => {
  const japaneseCafe = getScriptedNpcLines("ja", "cafe")[0];
  assert.equal(japaneseCafe.translations.de, undefined, "fixture must lack a German translation");

  const match = matchScriptedNpcLine({
    text: japaneseCafe.text,
    targetLang: "ja",
    nativeLang: "de",
    zone: "cafe",
  });
  assert.ok(match, "Japanese cafe line must match");
  assert.equal(match.translation, japaneseCafe.translations.en);
  assert.equal(match.translation, "Welcome! Are you ready to order?");
});

test("TDD [Scripted Match Barber]: Barber greeting literals resolve for barber zone", () => {
  const scenario = getMultilingualScenario("es", "en", "barber");
  const match = matchScriptedNpcLine({
    text: scenario.greeting,
    targetLang: "es",
    nativeLang: "en",
    zone: "barber",
  });
  assert.ok(match, "Barber greeting must match");
  assert.equal(match.translation, scenario.dialogue.npcNativeTranslation);
});

test("TDD [Scripted Match Fragment]: Short substring does not inherit a whole-line translation", () => {
  const fragment = matchScriptedNpcLine({
    text: "amigo",
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.equal(fragment, null, "single-word fragment must not inherit a scripted sentence translation");

  const nearFull = matchScriptedNpcLine({
    text: "¿Qué te pongo?",
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
  });
  assert.ok(nearFull, "a near-complete transcript must still match");
  assert.equal(nearFull.translation, "What can I get you, friend?");
});

test("TDD [Gloss Boundary]: Devanagari substring inside a word does not gloss", () => {
  const insideWord = buildLessonLine({
    text: "मैं बस्ता रखता हूँ",
    targetLang: "hi",
    nativeLang: "en",
  });
  assert.equal(insideWord.gloss, undefined, "बस inside बस्ता must not gloss as bus");

  const bounded = buildLessonLine({
    text: "मैं बस से जा रहा हूँ",
    targetLang: "hi",
    nativeLang: "en",
  });
  assert.equal(bounded.gloss, "बस = bus");
});
