import test from "node:test";
import assert from "node:assert/strict";
import { getBilingualDialogue, getPlaceInfo } from "../src/scenarios/multilingual";

const TARGET_LANGS = ["hi", "te", "es", "ja", "fr", "it"] as const;
const ZONES = ["cafe", "bus_stop", "taxi", "barber"] as const;

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
