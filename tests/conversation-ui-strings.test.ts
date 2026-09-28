import test from "node:test";
import assert from "node:assert/strict";
import {
  CONVERSATION_UI_STRINGS,
  getConversationUiStrings,
} from "../src/lib/conversation/ui-strings";
import { SUPPORTED_LEARNER_LANGUAGES } from "../src/scenarios/multilingual";
import { useConversationStore } from "../src/lib/conversation/store";

const REQUIRED_KEYS = [
  "objective",
  "you",
  "npc",
  "learning",
  "thinking",
  "complete",
  "retry",
  "send",
  "empty",
  "speak",
  "tryAgain",
  "youSaidWrong",
  "shouldSay",
  "attemptLeft",
] as const;

test("TDD [ConversationUI]: every learner language ships a complete UI string set", () => {
  for (const lang of SUPPORTED_LEARNER_LANGUAGES) {
    const strings = CONVERSATION_UI_STRINGS[lang.code];
    assert.ok(strings, `missing UI strings for native language "${lang.code}"`);
    for (const key of REQUIRED_KEYS) {
      const value = strings[key];
      assert.equal(typeof value, "string", `${lang.code}.${key} must be a string`);
      assert.ok(value.trim().length > 0, `${lang.code}.${key} must not be empty`);
    }
    assert.ok(
      strings.learning.includes("{lang}"),
      `${lang.code}.learning must keep the {lang} placeholder`
    );
  }
});

test("TDD [ConversationUI]: attemptLeft keeps the {n} placeholder in every language", () => {
  for (const lang of SUPPORTED_LEARNER_LANGUAGES) {
    const strings = CONVERSATION_UI_STRINGS[lang.code];
    assert.ok(strings, `missing UI strings for native language "${lang.code}"`);
    assert.ok(
      strings.attemptLeft.includes("{n}"),
      `${lang.code}.attemptLeft must keep the {n} placeholder`
    );
  }
});

test("TDD [ConversationUI]: unknown native languages fall back to Japanese strings", () => {
  assert.deepEqual(getConversationUiStrings("xx"), CONVERSATION_UI_STRINGS.ja);
  assert.deepEqual(getConversationUiStrings(undefined), CONVERSATION_UI_STRINGS.ja);
  assert.equal(getConversationUiStrings("ja").objective, "目的");
});

test("TDD [ConversationUI]: learning label interpolates the target language", () => {
  const strings = getConversationUiStrings("ja");
  assert.equal(strings.learning.replace("{lang}", "日本語"), "日本語 を勉強中");
});

test("TDD [ConversationUI]: openConversation stores the NPC role shown in the header", () => {
  useConversationStore.setState({
    npcRole: undefined,
    isOpen: false,
    status: "CLOSED",
    messages: [],
  });

  useConversationStore.getState().openConversation("Marco", "Greet the barber", 3, {
    npcRole: "Master Barber",
  });
  assert.equal(useConversationStore.getState().npcRole, "Master Barber");

  // A conversation opened without a role must not keep the previous NPC's role
  useConversationStore.getState().openConversation("Raju", "Order chai", 3);
  assert.equal(useConversationStore.getState().npcRole, undefined);

  useConversationStore.getState().closeConversation();
});
