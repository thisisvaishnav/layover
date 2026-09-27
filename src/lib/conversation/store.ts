import { create } from "zustand";
import type { ConversationState, ConversationActions, ConversationMessage } from "./types";
import { getBilingualDialogue } from "@/scenarios/multilingual";

type ConversationStore = ConversationState & ConversationActions;

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
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
  partialUserTranscript: "",
  targetLang: "es",
  nativeLang: "en",
  zone: "cafe",
  suggestedTarget: "",
  suggestedPhonetics: "",
  suggestedNative: "",
  isMicRecording: false,
  sessionVersion: 0,

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

    set((prev) => ({
      isOpen: true,
      status: "CONNECTING",
      currentNpcName: npcName,
      currentObjective: objective,
      currentStep: 1,
      totalSteps,
      messages: initialMsgs,
      errorMessage: null,
      partialUserTranscript: "",
      targetLang: meta?.targetLang ?? "es",
      nativeLang: meta?.nativeLang ?? "en",
      zone: meta?.zone ?? "cafe",
      npcRole: meta?.npcRole,
      suggestedTarget: meta?.suggestedTarget ?? "",
      suggestedPhonetics: meta?.suggestedPhonetics ?? "",
      suggestedNative: meta?.suggestedNative ?? "",
      isMicRecording: false,
      sessionVersion: (prev.sessionVersion ?? 0) + 1,
    }));
  },

  closeConversation() {
    set({
      isOpen: false,
      status: "CLOSED",
      partialUserTranscript: "",
      isMicRecording: false,
    });
  },

  setIsMicRecording(recording) {
    set({ isMicRecording: recording });
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

  updatePartialTranscript(text) {
    set({ partialUserTranscript: text });
  },

  finalizeUserTurn(text) {
    set({ partialUserTranscript: "", isMicRecording: false });
    if (!text.trim()) return;
    const msg: ConversationMessage = {
      id: makeId(),
      speaker: "USER",
      text,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, msg],
      partialUserTranscript: "",
      status: "PROCESSING",
    }));
  },

  advanceStep() {
    const state = get();
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
        nativeLang: state.nativeLang ?? "en",
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
    });
  },

  setError(message) {
    set({ status: "ERROR", errorMessage: message });
  },

  clearError() {
    set({ errorMessage: null, status: "CLOSED", isOpen: false });
  },
}));
