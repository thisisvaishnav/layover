import test from "node:test";
import assert from "node:assert/strict";
import { splitAgentUtterance } from "../src/lib/voice-agent/agent-text";
import { getBilingualDialogue, getMultilingualScenario, getPlaceInfo } from "../src/scenarios/multilingual";

const TARGET_LANGS = ["hi", "te", "es", "ja", "fr", "it"] as const;
const ZONES = ["cafe", "bus_stop", "taxi", "barber"] as const;

test("TDD [Bilingual Reply]: agent reply is split into shop line and helper meaning", () => {
  const twoLines = splitAgentUtterance("¡Hola! Bienvenido.\nHello! Welcome.");
  assert.equal(twoLines.text, "¡Hola! Bienvenido.");
  assert.equal(twoLines.meaning, "Hello! Welcome.");

  // Some models still prefix the helper line — strip it.
  const prefixed = splitAgentUtterance("いらっしゃいませ。\nEN: Welcome.");
  assert.equal(prefixed.text, "いらっしゃいませ。");
  assert.equal(prefixed.meaning, "Welcome.");

  // One-line replies (no meaning) stay intact instead of being mangled.
  const single = splitAgentUtterance("नमस्ते! कैसे हैं आप?");
  assert.equal(single.text, "नमस्ते! कैसे हैं आप?");
  assert.equal(single.meaning, undefined);

  assert.equal(splitAgentUtterance("   ").text, "");
});

test("TDD [Bilingual Reply]: spoken greeting = shop line + its meaning, in every language and place", () => {
  for (const targetLang of TARGET_LANGS) {
    for (const zone of ZONES) {
      const scenario = getMultilingualScenario(targetLang, "en", zone);
      const where = `${targetLang}/${zone}`;

      assert.equal(
        scenario.greeting,
        `${scenario.dialogue.npcTargetText}\n${scenario.dialogue.npcNativeTranslation}`,
        `${where}: greeting must be the visible NPC line plus its meaning, so TTS reads both`
      );

      // The client splits on the newline — it must survive a round trip.
      const split = splitAgentUtterance(scenario.greeting);
      assert.equal(split.text, scenario.dialogue.npcTargetText, `${where}: shop line must be line 1`);
      assert.equal(split.meaning, scenario.dialogue.npcNativeTranslation, `${where}: meaning must be line 2`);

      // The agent is told to keep answering in that same two-line format.
      assert.ok(
        scenario.systemPrompt.includes("Line 1:") && scenario.systemPrompt.includes("Line 2:"),
        `${where}: system prompt must instruct the two-line reply format`
      );
    }
  }
});

test("TDD [Bilingual Reply]: every place announces itself in English and in the target language", () => {
  for (const zone of ZONES) {
    const en = getPlaceInfo(zone, "en");
    assert.ok(en.label.length > 0, `${zone}: English place label must not be empty`);
    assert.ok(en.icon.length > 0, `${zone}: place icon must not be empty`);

    for (const targetLang of TARGET_LANGS) {
      const info = getPlaceInfo(zone, targetLang);
      assert.equal(info.zone, zone);
      assert.equal(info.label, en.label, `${zone}/${targetLang}: English label must stay constant`);
      assert.ok(info.targetLabel.length > 0, `${zone}/${targetLang}: target-language label must not be empty`);
      assert.notEqual(
        info.targetLabel,
        info.label,
        `${zone}/${targetLang}: target label must actually be translated`
      );
    }
  }
});

test("TDD [Bilingual Reply]: suggested replies stay short and simple everywhere", () => {
  let longest = { words: 0, where: "", text: "" };

  for (const targetLang of TARGET_LANGS) {
    for (const zone of ZONES) {
      for (const stepIndex of [0, 1]) {
        const dialogue = getBilingualDialogue({
          targetLang,
          nativeLang: "en",
          zone,
          stepIndex,
        });
        const where = `${targetLang}/${zone}/step${stepIndex + 1}`;
        const text = dialogue.userSuggestedTarget;
        assert.ok(text.trim().length > 0, `${where}: suggested reply must not be empty`);

        // One short line the learner can actually say out loud.
        const words = text.trim().split(/\s+/).length;
        if (words > longest.words) longest = { words, where, text };

        assert.ok(
          words <= 6,
          `${where}: keep suggested replies simple (<= 6 words), got ${words} — "${text}"`
        );

        // "In English" backing for the phrase, also short.
        const nativeWords = dialogue.userSuggestedNative.trim().split(/\s+/).length;
        assert.ok(
          nativeWords <= 8,
          `${where}: keep the English meaning short too (<= 8 words), got ${nativeWords} — "${dialogue.userSuggestedNative}"`
        );
      }
    }
  }

  assert.ok(longest.words > 0, "expected at least one suggested reply");
});
