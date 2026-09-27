export interface ConversationUiStrings {
  /** Label above the current objective */
  objective: string;
  /** Label on the right-hand dialogue card */
  you: string;
  /** Label on the left-hand dialogue card */
  npc: string;
  /** e.g. "Learning Spanish" — {lang} is replaced with the target language */
  learning: string;
  /** Caption under the mic button when idle */
  micHint: string;
  /** Caption while the microphone is capturing */
  listening: string;
  connecting: string;
  thinking: string;
  speaking: string;
  complete: string;
  retry: string;
  send: string;
  /** Placeholder when a card has nothing to show yet */
  empty: string;
  /** Prefix for a live partial transcript under the mic */
  youSaid: string;
}

const EN: ConversationUiStrings = {
  objective: "Objective",
  you: "You",
  npc: "NPC",
  learning: "Learning {lang}",
  micHint: "Tap the mic to say your line",
  listening: "Listening… tap to send",
  connecting: "Connecting…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  complete: "Objective complete!",
  retry: "Retry",
  send: "Send",
  empty: "…",
  youSaid: "you said",
};

const JA: ConversationUiStrings = {
  objective: "目的",
  you: "あなた",
  npc: "NPC",
  learning: "{lang} を勉強中",
  micHint: "マイクをタップして話す",
  listening: "聞いています…タップで送信",
  connecting: "接続中…",
  thinking: "考え中…",
  speaking: "話しています…",
  complete: "目標達成！",
  retry: "再接続",
  send: "送信",
  empty: "…",
  youSaid: "発言",
};

const ES: ConversationUiStrings = {
  objective: "Objetivo",
  you: "Tú",
  npc: "NPC",
  learning: "Aprendiendo {lang}",
  micHint: "Toca el micrófono para hablar",
  listening: "Escuchando… toca para enviar",
  connecting: "Conectando…",
  thinking: "Pensando…",
  speaking: "Hablando…",
  complete: "¡Objetivo completado!",
  retry: "Reintentar",
  send: "Enviar",
  empty: "…",
  youSaid: "dijiste",
};

const HI: ConversationUiStrings = {
  objective: "उद्देश्य",
  you: "आप",
  npc: "NPC",
  learning: "{lang} सीखना",
  micHint: "अपनी बात बोलने के लिए माइक दबाएँ",
  listening: "सुन रहे हैं… भेजने के लिए दबाएँ",
  connecting: "जुड़ रहा है…",
  thinking: "सोच रहे हैं…",
  speaking: "बोल रहे हैं…",
  complete: "उद्देश्य पूरा हुआ!",
  retry: "फिर कोशिश करें",
  send: "भेजें",
  empty: "…",
  youSaid: "आपने कहा",
};

const FR: ConversationUiStrings = {
  objective: "Objectif",
  you: "Toi",
  npc: "NPC",
  learning: "Apprendre {lang}",
  micHint: "Touche le micro pour parler",
  listening: "Écoute… touche pour envoyer",
  connecting: "Connexion…",
  thinking: "Réflexion…",
  speaking: "Parle…",
  complete: "Objectif atteint !",
  retry: "Réessayer",
  send: "Envoyer",
  empty: "…",
  youSaid: "tu as dit",
};

const DE: ConversationUiStrings = {
  objective: "Ziel",
  you: "Du",
  npc: "NPC",
  learning: "{lang} lernen",
  micHint: "Tippe auf das Mikrofon zum Sprechen",
  listening: "Ich höre zu… zum Senden tippen",
  connecting: "Verbinden…",
  thinking: "Denke nach…",
  speaking: "Spricht…",
  complete: "Ziel erreicht!",
  retry: "Erneut versuchen",
  send: "Senden",
  empty: "…",
  youSaid: "du hast gesagt",
};

const IT: ConversationUiStrings = {
  objective: "Obiettivo",
  you: "Tu",
  npc: "NPC",
  learning: "Imparare {lang}",
  micHint: "Tocca il microfono per parlare",
  listening: "In ascolto… tocca per inviare",
  connecting: "Connessione…",
  thinking: "Sto pensando…",
  speaking: "Parla…",
  complete: "Obiettivo completato!",
  retry: "Riprova",
  send: "Invia",
  empty: "…",
  youSaid: "hai detto",
};

export const CONVERSATION_UI_STRINGS: Record<string, ConversationUiStrings> = {
  en: EN,
  ja: JA,
  es: ES,
  hi: HI,
  fr: FR,
  de: DE,
  it: IT,
};

export function getConversationUiStrings(nativeLang?: string): ConversationUiStrings {
  if (nativeLang && nativeLang in CONVERSATION_UI_STRINGS) {
    return CONVERSATION_UI_STRINGS[nativeLang];
  }
  return EN;
}
