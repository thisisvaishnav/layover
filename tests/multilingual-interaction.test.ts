import test from "node:test";
import assert from "node:assert/strict";
import {
  getBilingualDialogue,
  getMultilingualScenario,
  SUPPORTED_LEARNER_LANGUAGES,
} from "../src/scenarios/multilingual";
import { ONBOARDING_COUNTRIES } from "../src/scenarios/catalog";
import { useConversationStore } from "../src/lib/conversation/store";

// Reset store helper
function resetStore(): void {
  useConversationStore.setState({
    status: "CLOSED",
    messages: [],
    currentNpcName: "",
    currentObjective: "",
    currentStep: 0,
    totalSteps: 1,
    isInRange: false,
    isOpen: false,
    errorMessage: null,
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
    suggestedTarget: "",
    suggestedPhonetics: "",
    suggestedNative: "",
  });
}

test("TDD [Multilingual Coverage]: Japanese is the only onboarding country and has cafe and bus_stop scenarios", () => {
  assert.equal(SUPPORTED_LEARNER_LANGUAGES.length, 1, "Only one learner language must be supported");
  const targetCodes = ONBOARDING_COUNTRIES.map((c) => c.code);
  assert.deepEqual(targetCodes, ["ja"], "Japan (ja) must be the only onboarding country");

  for (const code of targetCodes) {
    // 1. Cafe check
    const cafeDialogue = getBilingualDialogue({
      targetLang: code,
      nativeLang: "ja",
      zone: "cafe",
      stepIndex: 0,
    });
    assert.ok(cafeDialogue.npcName.length > 0, `Cafe NPC name for ${code} must not be empty`);
    assert.ok(cafeDialogue.npcTargetText.length > 0, `Cafe NPC target text for ${code} must not be empty`);
    assert.ok(cafeDialogue.npcPhonetics.length > 0, `Cafe NPC phonetics for ${code} must not be empty`);
    assert.ok(cafeDialogue.npcNativeTranslation.length > 0, `Cafe NPC translation for ${code} must not be empty`);
    assert.ok(cafeDialogue.userSuggestedTarget.length > 0, `Cafe user suggested target for ${code} must not be empty`);
    assert.ok(cafeDialogue.userSuggestedPhonetics.length > 0, `Cafe user suggested phonetics for ${code} must not be empty`);
    assert.ok(cafeDialogue.userSuggestedNative.length > 0, `Cafe user suggested translation for ${code} must not be empty`);

    // 2. Bus stop check
    const busDialogue = getBilingualDialogue({
      targetLang: code,
      nativeLang: "ja",
      zone: "bus_stop",
      stepIndex: 0,
    });
    assert.ok(busDialogue.npcName.length > 0, `Bus NPC name for ${code} must not be empty`);
    assert.ok(busDialogue.npcTargetText.length > 0, `Bus NPC target text for ${code} must not be empty`);
    assert.ok(busDialogue.npcPhonetics.length > 0, `Bus NPC phonetics for ${code} must not be empty`);
    assert.ok(busDialogue.npcNativeTranslation.length > 0, `Bus NPC translation for ${code} must not be empty`);
    assert.ok(busDialogue.userSuggestedTarget.length > 0, `Bus user suggested target for ${code} must not be empty`);
    assert.ok(busDialogue.userSuggestedPhonetics.length > 0, `Bus user suggested phonetics for ${code} must not be empty`);
    assert.ok(busDialogue.userSuggestedNative.length > 0, `Bus user suggested translation for ${code} must not be empty`);
  }
});

test("TDD [Multilingual Scenarios]: getMultilingualScenario produces complete agent configuration", () => {
  // Test Japanese Cafe
  const jaCafe = getMultilingualScenario("ja", "ja", "cafe");
  assert.equal(jaCafe.npcName, "Kenji");
  assert.equal(jaCafe.targetLanguage, "Japanese");
  assert.equal(jaCafe.city, "Tokyo");
  assert.ok(jaCafe.systemPrompt.includes("Kenji"), "System prompt must mention Kenji");
  assert.ok(jaCafe.systemPrompt.includes("Japanese"), "System prompt must mention Japanese");
  assert.ok(jaCafe.greeting.includes("いらっしゃいませ"), "Greeting must be in Japanese");
  assert.ok(jaCafe.objectives.length >= 1, "Must have objectives");

  // Test Japanese Bus Stop
  const jaBus = getMultilingualScenario("ja", "ja", "bus_stop");
  assert.equal(jaBus.npcName, "Tanaka");
  assert.equal(jaBus.targetLanguage, "Japanese");
  assert.equal(jaBus.city, "Tokyo");
  assert.ok(jaBus.systemPrompt.includes("Tanaka"), "System prompt must mention Tanaka");
  assert.ok(jaBus.greeting.includes("どちらまで"), "Greeting must be in Japanese");

  // Test Japanese Taxi
  const jaTaxi = getMultilingualScenario("ja", "ja", "taxi");
  assert.equal(jaTaxi.npcName, "Kenji");
  assert.equal(jaTaxi.targetLanguage, "Japanese");
  assert.ok(jaTaxi.greeting.includes("どちらまで"), "Greeting must be in Japanese");

  // Unknown languages fall back to the Japanese scenario instead of breaking
  const fallback = getMultilingualScenario("es", "en", "cafe");
  assert.equal(fallback.targetLanguage, "Japanese");
  assert.equal(fallback.npcName, "Kenji");
});

test("TDD [Conversation Store Multilingual]: Stores suggested reply and stays clamped on advanceStep", () => {
  resetStore();
  const dialogue = getBilingualDialogue({
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
    stepIndex: 0,
  });

  useConversationStore.getState().openConversation(
    dialogue.npcName,
    dialogue.objective,
    dialogue.totalSteps,
    {
      targetLang: "ja",
      nativeLang: "ja",
      zone: "cafe",
      suggestedTarget: dialogue.userSuggestedTarget,
      suggestedPhonetics: dialogue.userSuggestedPhonetics,
      suggestedNative: dialogue.userSuggestedNative,
      initialNpcMessage: {
        speaker: "NPC",
        text: dialogue.npcTargetText,
        phonetic: dialogue.npcPhonetics,
        translation: dialogue.npcNativeTranslation,
      },
    }
  );

  const state1 = useConversationStore.getState();
  assert.equal(state1.isOpen, true);
  assert.equal(state1.currentNpcName, "Kenji");
  assert.equal(state1.targetLang, "ja");
  assert.equal(state1.messages.length, 1, "Initial NPC message must be present");
  assert.equal(state1.messages[0].text, dialogue.npcTargetText);
  assert.equal(state1.suggestedTarget, "アイス抹茶ラテをお願いします。");

  // The Japanese scenario has a single step, so advancing clamps instead of overshooting
  useConversationStore.getState().advanceStep();
  const state2 = useConversationStore.getState();
  assert.equal(state2.currentStep, state1.currentStep, "Step must never exceed totalSteps");
  assert.ok((state2.suggestedTarget ?? "").length > 0);
  assert.equal(state2.suggestedTarget, state1.suggestedTarget);
});
