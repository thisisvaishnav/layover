import { create } from "zustand";
import type { ConversationState, ConversationActions, ConversationMessage } from "./types";
import { evaluateReply, mustRetry } from "./feedback";
import { getBilingualDialogue } from "@/scenarios/multilingual";

type ConversationStore = ConversationState & ConversationActions;

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Loose text comparison for duplicate-turn detection. */
function normalizeTurnText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * The same turn can be redelivered right after the send path already sent it —
 * as the same text, or as a shorter variant of the fuller final. Either way
 * inside the guard window we must never double-append or burn an attempt.
 */
function isDuplicateTurn(previous: string, incoming: string, previousAt: number): boolean {
  if (Date.now() - previousAt >= 8000) return false;
  const a = normalizeTurnText(previous);
  const b = normalizeTurnText(incoming);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  // Initial state
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
  replyFeedback: null,
  attemptCount: 0,

  // Actions
  setStatus(status) {
    set({ status });
  },

  setInRange(isInRange) {
    set({ isInRange });
  },

  openConversation(npcName, objective, totalSteps, meta) {
    const initialMsgs: ConversationMessage[] = [];
    if (meta?.initialNpcMessage) {
      initialMsgs.push({
        ...meta.initialNpcMessage,
        id: makeId(),
        timestamp: Date.now(),
      });
    }

    set({
      isOpen: true,
      status: "LISTENING",
      currentNpcName: npcName,
      currentObjective: objective,
      currentStep: 1,
      totalSteps,
      messages: initialMsgs,
      errorMessage: null,
      targetLang: meta?.targetLang ?? "ja",
      nativeLang: meta?.nativeLang ?? "ja",
      zone: meta?.zone ?? "cafe",
      npcRole: meta?.npcRole,
      suggestedTarget: meta?.suggestedTarget ?? "",
      suggestedPhonetics: meta?.suggestedPhonetics ?? "",
      suggestedNative: meta?.suggestedNative ?? "",
      replyFeedback: null,
      attemptCount: 0,
    });
  },

  closeConversation() {
    set({
      isOpen: false,
      status: "CLOSED",
      replyFeedback: null,
      attemptCount: 0,
    });
  },

  setReplyFeedback(fb) {
    set({ replyFeedback: fb });
  },

  updateSuggestedReply(target, phonetics, native) {
    set({
      suggestedTarget: target,
      suggestedPhonetics: phonetics,
      suggestedNative: native,
    });
  },

  addMessage(msg) {
    const full: ConversationMessage = {
      ...msg,
      id: makeId(),
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, full] }));
  },

  finalizeUserTurn(text) {
    if (!text.trim()) return;

    const state = get();
    const last = state.messages[state.messages.length - 1];
    if (last && last.speaker === "USER" && isDuplicateTurn(last.text, text, last.timestamp)) {
      // The same turn can be redelivered right after the send path already
      // sent it — never double-append or burn an attempt on a repeat.
      return;
    }

    const msg: ConversationMessage = {
      id: makeId(),
      speaker: "USER",
      text,
      timestamp: Date.now(),
    };

    const target = state.suggestedTarget ?? "";
    if (target) {
      const fb = evaluateReply({
        expected: target,
        expectedPhonetic: state.suggestedPhonetics || undefined,
        said: text,
        attempt: state.attemptCount + 1,
      });
      set((prev) => ({
        messages: [...prev.messages, msg],
        replyFeedback: fb,
        attemptCount: fb.attempt,
        status: "PROCESSING",
      }));
    } else {
      set((prev) => ({
        messages: [...prev.messages, msg],
        replyFeedback: null,
        status: "PROCESSING",
      }));
    }
  },

  advanceStep() {
    const state = get();
    if (mustRetry(state.replyFeedback, state.attemptCount)) {
      // Wrong reply with attempts left — the learner must retry this step.
      return;
    }
    const nextStep = Math.min(state.currentStep + 1, state.totalSteps);
    let nextSuggested = {
      target: state.suggestedTarget ?? "",
      phonetics: state.suggestedPhonetics ?? "",
      native: state.suggestedNative ?? "",
      objective: state.currentObjective,
    };

    if (state.targetLang && state.zone) {
      const dialogue = getBilingualDialogue({
        targetLang: state.targetLang,
        nativeLang: state.nativeLang ?? "ja",
        zone: state.zone,
        stepIndex: nextStep - 1,
      });
      nextSuggested = {
        target: dialogue.userSuggestedTarget,
        phonetics: dialogue.userSuggestedPhonetics,
        native: dialogue.userSuggestedNative,
        objective: dialogue.objective,
      };
    }

    set({
      currentStep: nextStep,
      currentObjective: nextSuggested.objective,
      suggestedTarget: nextSuggested.target,
      suggestedPhonetics: nextSuggested.phonetics,
      suggestedNative: nextSuggested.native,
      replyFeedback: null,
      attemptCount: 0,
    });
  },

  setError(message) {
    set({ status: "ERROR", errorMessage: message });
  },

  clearError() {
    set({ errorMessage: null, status: "CLOSED", isOpen: false });
  },
}));
