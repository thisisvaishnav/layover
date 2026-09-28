export interface ConversationUiStrings {
  /** Label above the current objective */
  objective: string;
  /** Label on the right-hand dialogue card */
  you: string;
  /** Label on the left-hand dialogue card */
  npc: string;
  /** e.g. "日本語 を勉強中" — {lang} is replaced with the target language */
  learning: string;
  thinking: string;
  complete: string;
  retry: string;
  send: string;
  /** Placeholder when a card has nothing to show yet */
  empty: string;
  /** Label/aria for the "hear this phrase" speaker button */
  speak: string;
  /** Retry prompt shown after a wrong attempt */
  tryAgain: string;
  /** Prefix showing what the learner actually said */
  youSaidWrong: string;
  /** Prefix showing the correct phrase */
  shouldSay: string;
  /** Remaining-attempts notice — {n} is replaced with the number */
  attemptLeft: string;
}

const JA: ConversationUiStrings = {
  objective: "目的",
  you: "あなた",
  npc: "NPC",
  learning: "{lang} を勉強中",
  thinking: "考え中…",
  complete: "目標達成！",
  retry: "再接続",
  send: "送信",
  empty: "…",
  speak: "聞く",
  tryAgain: "もう一度",
  youSaidWrong: "あなた:",
  shouldSay: "正しくは:",
  attemptLeft: "残り {n} 回",
};

export const CONVERSATION_UI_STRINGS: Record<string, ConversationUiStrings> = {
  ja: JA,
};

export function getConversationUiStrings(nativeLang?: string): ConversationUiStrings {
  if (nativeLang && nativeLang in CONVERSATION_UI_STRINGS) {
    return CONVERSATION_UI_STRINGS[nativeLang];
  }
  return JA;
}
