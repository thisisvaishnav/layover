import test from "node:test";
import assert from "node:assert/strict";
import {
  getBilingualDialogue,
  getMultilingualScenario,
  SUPPORTED_LEARNER_LANGUAGES,
} from "../src/scenarios/multilingual";
import { ONBOARDING_COUNTRIES } from "../src/scenarios/catalog";
import { useConversationStore } from "../src/lib/conversation/store";
import { createVoiceAgentClient } from "../src/lib/voice-agent/voice-agent-client";

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
    partialUserTranscript: "",
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
    suggestedTarget: "",
    suggestedPhonetics: "",
    suggestedNative: "",
    isMicRecording: false,
  });
}

test("TDD [Multilingual Coverage]: All onboarding countries have cafe and bus_stop scenarios", () => {
  assert.ok(SUPPORTED_LEARNER_LANGUAGES.length >= 5, "Must have supported learner languages");
  const targetCodes = ONBOARDING_COUNTRIES.map((c) => c.code);
  assert.ok(targetCodes.includes("es"), "Spain (es) must be present");
  assert.ok(targetCodes.includes("hi"), "India (hi) must be present");
  assert.ok(targetCodes.includes("ja"), "Japan (ja) must be present");
  assert.ok(targetCodes.includes("fr"), "France (fr) must be present");
  assert.ok(targetCodes.includes("it"), "Italy (it) must be present");

  for (const code of targetCodes) {
    // 1. Cafe check
    const cafeDialogue = getBilingualDialogue({
      targetLang: code,
      nativeLang: "en",
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
      nativeLang: "en",
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
  // Test French Cafe
  const frCafe = getMultilingualScenario("fr", "en", "cafe");
  assert.equal(frCafe.npcName, "Pierre");
  assert.equal(frCafe.targetLanguage, "French");
  assert.equal(frCafe.city, "Paris");
  assert.ok(frCafe.systemPrompt.includes("Pierre"), "System prompt must mention Pierre");
  assert.ok(frCafe.systemPrompt.includes("French"), "System prompt must mention French");
  assert.ok(frCafe.greeting.includes("Bonjour"), "Greeting must be in French");
  assert.ok(frCafe.objectives.length >= 1, "Must have objectives");

  // Test Italian Bus Stop
  const itBus = getMultilingualScenario("it", "en", "bus_stop");
  assert.equal(itBus.npcName, "Giovanni");
  assert.equal(itBus.targetLanguage, "Italian");
  assert.equal(itBus.city, "Rome");
  assert.ok(itBus.systemPrompt.includes("Giovanni"), "System prompt must mention Giovanni");
  assert.ok(itBus.greeting.includes("Salve") || itBus.greeting.includes("autobus"), "Greeting must be in Italian");

  // Test Spanish Cafe
  const esCafe = getMultilingualScenario("es", "en", "cafe");
  assert.equal(esCafe.npcName, "Mateo");
  assert.equal(esCafe.targetLanguage, "Spanish");
  assert.ok(esCafe.greeting.includes("Qué te pongo") || esCafe.greeting.includes("amigo"));

  // Test Japanese Bus Stop
  const jaBus = getMultilingualScenario("ja", "en", "bus_stop");
  assert.equal(jaBus.npcName, "Tanaka");
  assert.equal(jaBus.targetLanguage, "Japanese");
  assert.ok(jaBus.greeting.includes("どちらまで"));
});

test("TDD [Conversation Store Multilingual]: Stores suggested reply and updates on advanceStep", () => {
  resetStore();
  const dialogue = getBilingualDialogue({
    targetLang: "es",
    nativeLang: "en",
    zone: "cafe",
    stepIndex: 0,
  });

  useConversationStore.getState().openConversation(
    dialogue.npcName,
    dialogue.objective,
    dialogue.totalSteps,
    {
      targetLang: "es",
      nativeLang: "en",
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
  assert.equal(state1.currentNpcName, "Mateo");
  assert.equal(state1.targetLang, "es");
  assert.equal(state1.messages.length, 1, "Initial NPC message must be present");
  assert.equal(state1.messages[0].text, dialogue.npcTargetText);
  assert.equal(state1.suggestedTarget, "Un café con leche, por favor.");

  // Advance to step 2
  useConversationStore.getState().advanceStep();
  const state2 = useConversationStore.getState();
  assert.equal(state2.currentStep, 2);
  assert.ok((state2.suggestedTarget ?? "").length > 0);
  assert.notEqual(state2.suggestedTarget, state1.suggestedTarget, "Step 2 suggested reply must differ from Step 1");
});

test("TDD [Voice Client Recording Interface]: Provides startRecording and stopRecording controls", async () => {
  const client = createVoiceAgentClient({
    onPartialTranscript() {},
    onFinalTranscript() {},
    onNpcTurnStart() {},
    onNpcMessage() {},
    onNpcTurnEnd() {},
    onConnected() {},
    onError() {},
    onSessionEnded() {},
  });

  assert.equal(typeof client.startRecording, "function", "startRecording must be a function");
  assert.equal(typeof client.stopRecording, "function", "stopRecording must be a function");
  assert.equal(typeof client.sendTextMessage, "function", "sendTextMessage must be a function");
  assert.equal(client.isRecording, false, "Initial recording state should be false before connect");

  // Calling stopRecording when idle should not throw
  assert.doesNotThrow(() => client.stopRecording());
});

test("TDD [Mic Recording State in Store]: setIsMicRecording updates store flag", () => {
  resetStore();
  const store = useConversationStore.getState();
  assert.equal(store.isMicRecording, false);

  store.setIsMicRecording(true);
  assert.equal(useConversationStore.getState().isMicRecording, true);

  store.setIsMicRecording(false);
  assert.equal(useConversationStore.getState().isMicRecording, false);
});
