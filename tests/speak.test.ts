import test from "node:test";
import assert from "node:assert/strict";
import {
  toBcp47,
  pickVoice,
  isSpeechSupported,
  speakPhrase,
  stopSpeaking,
} from "../src/lib/audio/speak";

function voice(lang: string): SpeechSynthesisVoice {
  return {
    default: false,
    lang,
    localService: true,
    name: `fake-${lang}`,
    voiceURI: `fake-${lang}`,
  };
}

test("toBcp47: maps the app language to its BCP-47 tag", () => {
  assert.equal(toBcp47("ja"), "ja-JP");
  // Japanese is the only language the app ships a tag for; anything else passes through.
  assert.equal(toBcp47("es"), "es");
  assert.equal(toBcp47("en"), "en");
});

test("toBcp47: passes BCP-47-looking values through unchanged", () => {
  assert.equal(toBcp47("ja-JP"), "ja-JP");
  assert.equal(toBcp47("es-MX"), "es-MX");
  assert.equal(toBcp47("JA-jp"), "JA-jp");
  assert.equal(toBcp47("EN-us"), "EN-us");
});

test("toBcp47: is case-insensitive for app codes", () => {
  assert.equal(toBcp47("JA"), "ja-JP");
  assert.equal(toBcp47("Ja"), "ja-JP");
});

test("pickVoice: exact tag match wins over base-language match", () => {
  const voices = [voice("ja-Kansai"), voice("ja-JP"), voice("en-US")];
  assert.equal(pickVoice(voices, "ja"), voices[1]);
});

test("pickVoice: falls back to the base language (es-MX voice for es)", () => {
  const voices = [voice("fr-FR"), voice("es-MX")];
  assert.equal(pickVoice(voices, "es"), voices[1]);
  assert.equal(pickVoice(voices, "es-MX"), voices[1]);
});

test("pickVoice: returns undefined when nothing matches", () => {
  const voices = [voice("ja-JP"), voice("fr-FR")];
  assert.equal(pickVoice(voices, "de"), undefined);
  assert.equal(pickVoice([], "es"), undefined);
});

test("pickVoice: does not mutate the input array", () => {
  const voices = [voice("fr-FR"), voice("es-MX"), voice("ja-JP")];
  const langsBefore = voices.map((v) => v.lang);
  const refsBefore = [...voices];

  pickVoice(voices, "es");

  assert.deepEqual(voices.map((v) => v.lang), langsBefore, "langs must be untouched");
  assert.deepEqual(voices, refsBefore, "order and identities must be untouched");
  assert.equal(voices.length, 3, "no voice may be added or removed");
});

test("isSpeechSupported: false in the Node test environment", () => {
  assert.equal(isSpeechSupported(), false);
});

test("speakPhrase: empty text and unsupported environments both return false", () => {
  assert.equal(speakPhrase("", "es"), false);
  assert.equal(speakPhrase("   ", "es"), false);
  assert.equal(speakPhrase("hola", "es"), false, "Node has no speechSynthesis");
});

test("stopSpeaking: does not throw when speech is unsupported", () => {
  assert.doesNotThrow(() => stopSpeaking());
});
