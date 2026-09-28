/**
 * Standalone text-to-speech for the "Say this" phrase card.
 * Wraps the Web Speech API; safe to import during SSR (never touches
 * `window` at module scope).
 */

/** App language code -> BCP-47 tag. */
const LANG_TAGS: Record<string, string> = {
  ja: "ja-JP",
};

/** Longest string we will hand to the speech engine (guard against abuse). */
const MAX_SPOKEN_CHARS = 400;
/** Chrome drops speech when cancel() and speak() happen back-to-back. */
const SPEAK_DELAY_MS = 50;

/** Cached browser voices; refreshed once voices finish loading. */
let cachedVoices: SpeechSynthesisVoice[] = [];
let listenerAttached = false;
let pendingSpeak: ReturnType<typeof setTimeout> | null = null;

/** Named handler so the subscription is attached exactly once, never leaked. */
function handleVoicesChanged(): void {
  if (!isSpeechSupported()) return;
  cachedVoices = window.speechSynthesis.getVoices();
}

function cancelPendingSpeak(): void {
  if (pendingSpeak) {
    clearTimeout(pendingSpeak);
    pendingSpeak = null;
  }
}

/**
 * Maps an app language code to a BCP-47 tag.
 * Values that already look like BCP-47 (`ja-JP`) pass through unchanged.
 */
export function toBcp47(lang: string): string {
  if (lang.includes("-")) return lang;
  return LANG_TAGS[lang.toLowerCase()] ?? lang;
}

/**
 * Picks the best voice for a language: exact tag match first,
 * then base-language match, else `undefined`. Pure, never mutates `voices`.
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | undefined {
  const target = toBcp47(lang).toLowerCase();
  const targetBase = target.split("-")[0];
  for (const voice of voices) {
    if (voice.lang.toLowerCase() === target) return voice;
  }
  for (const voice of voices) {
    if (voice.lang.toLowerCase().split("-")[0] === targetBase) return voice;
  }
  return undefined;
}

/** Whether this environment exposes a usable speech synthesis API. */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

/** Reads (and caches) available voices, subscribing to `voiceschanged` once. */
function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return cachedVoices;
  const synth = window.speechSynthesis;
  if (!listenerAttached) {
    listenerAttached = true;
    synth.addEventListener("voiceschanged", handleVoicesChanged);
  }
  const fresh = synth.getVoices();
  if (fresh.length > 0) cachedVoices = fresh;
  return cachedVoices;
}

/**
 * Speaks `text` aloud in `lang`. Returns `false` when speech is unsupported
 * or `text` is empty; otherwise starts playback and returns `true`.
 * An empty voice list still speaks — the browser picks the default voice.
 */
export function speakPhrase(text: string, lang: string): boolean {
  if (!isSpeechSupported()) return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  const spoken = trimmed.length > MAX_SPOKEN_CHARS ? trimmed.slice(0, MAX_SPOKEN_CHARS) : trimmed;
  const synth = window.speechSynthesis;
  cancelPendingSpeak();
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = toBcp47(lang);
  utterance.rate = 0.9;
  const voice = pickVoice(loadVoices(), lang);
  if (voice) utterance.voice = voice;

  synth.resume();
  pendingSpeak = setTimeout(() => {
    pendingSpeak = null;
    synth.speak(utterance);
  }, SPEAK_DELAY_MS);
  return true;
}

/** Stops any in-progress speech. No-op outside the browser. */
export function stopSpeaking(): void {
  cancelPendingSpeak();
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
