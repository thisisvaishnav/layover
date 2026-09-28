import type { ReplyFeedback } from "./feedback";

export type ConversationStatus =
  | "CLOSED"
  | "LISTENING"
  | "PROCESSING"
  | "ERROR"
  | "COMPLETED";

export interface ConversationMessage {
  id: string;
  speaker: "NPC" | "USER";
  text: string;           // Original spoken text
  phonetic?: string;      // Romanization / transliteration
  translation?: string;   // Translation in learner's language
  learningTip?: string;   // Optional grammar/vocab tip
  isPartial?: boolean;    // True if still streaming
  timestamp: number;
}

export interface ConversationState {
  status: ConversationStatus;
  messages: ConversationMessage[];
  currentNpcName: string;
  currentObjective: string;
  currentStep: number;
  totalSteps: number;
  isInRange: boolean;       // Player within interaction radius
  isOpen: boolean;          // UI is currently visible
  errorMessage: string | null;
  /** Role of the current NPC (e.g. "Barista", "Master Barber") */
  npcRole?: string;
  targetLang?: string;
  nativeLang?: string;
  zone?: "cafe" | "bus_stop" | "taxi";
  suggestedTarget?: string;
  suggestedPhonetics?: string;
  suggestedNative?: string;
  /** Latest spoken-reply evaluation; non-null while the learner must retry */
  replyFeedback: ReplyFeedback | null;
  /** How many attempts the learner has used on the current step */
  attemptCount: number;
}

export interface ConversationActions {
  setStatus(status: ConversationStatus): void;
  setInRange(inRange: boolean): void;
  openConversation(
    npcName: string,
    objective: string,
    totalSteps: number,
    meta?: {
      targetLang?: string;
      nativeLang?: string;
      zone?: "cafe" | "bus_stop" | "taxi";
      npcRole?: string;
      suggestedTarget?: string;
      suggestedPhonetics?: string;
      suggestedNative?: string;
      initialNpcMessage?: Omit<ConversationMessage, "id" | "timestamp">;
    }
  ): void;
  closeConversation(): void;
  addMessage(msg: Omit<ConversationMessage, "id" | "timestamp">): void;
  finalizeUserTurn(text: string): void;
  advanceStep(): void;
  setReplyFeedback(fb: ReplyFeedback | null): void;
  updateSuggestedReply(target: string, phonetics: string, native: string): void;
  setError(message: string): void;
  clearError(): void;
}

export interface CoffeeShopScenario {
  id: string;
  npcName: string;
  npcRole: string;
  location: string;
  city: string;
  targetLanguage: string;
  targetLanguageCode: string;
  learnerLevel: "beginner" | "intermediate" | "advanced";
  interactionRadius: number;
  systemPrompt: string;
  greeting: string;
  objectives: string[];
  contextPayload: Record<string, string>;
}
