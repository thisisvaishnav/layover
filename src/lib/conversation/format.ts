import {
  getBarberScriptedNpcLines,
  getScriptedNpcLines,
  type ScriptedNpcLine,
} from "@/scenarios/multilingual";

export interface LessonLine {
  text: string;
  phonetic?: string;
  translation?: string;
  gloss?: string;
}

interface GlossEntry {
  variants: string[];
  meanings: Record<string, string>;
}

interface IndexedGloss {
  norm: string;
  ascii: boolean;
  meanings: Record<string, string>;
}

interface NormalizedForm {
  value: string;
  starts: number[];
  ends: number[];
}

const GLOSSARY: Record<string, GlossEntry[]> = {
  es: [
    { variants: ["hola"], meanings: { en: "hello", ja: "こんにちは", fr: "bonjour", it: "ciao", de: "hallo", hi: "नमस्ते" } },
    { variants: ["gracias"], meanings: { en: "thank you", ja: "ありがとう", fr: "merci", it: "grazie", de: "danke", hi: "धन्यवाद" } },
    { variants: ["por favor"], meanings: { en: "please", ja: "お願いします", fr: "s'il vous plaît", it: "per favore", de: "bitte", hi: "कृपया" } },
    { variants: ["café"], meanings: { en: "coffee", ja: "コーヒー", fr: "café", it: "caffè", de: "Kaffee", hi: "कॉफ़ी" } },
    { variants: ["leche"], meanings: { en: "milk", ja: "牛乳", fr: "lait", it: "latte", de: "Milch", hi: "दूध" } },
    { variants: ["agua"], meanings: { en: "water", ja: "水", fr: "eau", it: "acqua", de: "Wasser", hi: "पानी" } },
    { variants: ["cuenta"], meanings: { en: "bill", ja: "お会計", fr: "addition", it: "conto", de: "Rechnung", hi: "बिल" } },
    { variants: ["autobús"], meanings: { en: "bus", ja: "バス", fr: "bus", it: "autobus", de: "Bus", hi: "बस" } },
    { variants: ["billete"], meanings: { en: "ticket", ja: "切符", fr: "billet", it: "biglietto", de: "Fahrkarte", hi: "टिकट" } },
    { variants: ["taxi"], meanings: { en: "taxi", ja: "タクシー", fr: "taxi", it: "taxi", de: "Taxi", hi: "टैक्सी" } },
    { variants: ["parada"], meanings: { en: "stop", ja: "停留所", fr: "arrêt", it: "fermata", de: "Haltestelle" } },
    { variants: ["dónde"], meanings: { en: "where", ja: "どこ", fr: "où", it: "dove", de: "wo", hi: "कहाँ" } },
    { variants: ["aquí"], meanings: { en: "here", ja: "ここ", fr: "ici", it: "qui", de: "hier", hi: "यहाँ" } },
    { variants: ["quiero"], meanings: { en: "I want", ja: "欲しい", fr: "je veux", it: "voglio", de: "ich möchte", hi: "चाहिए" } },
    { variants: ["adiós"], meanings: { en: "goodbye", ja: "さようなら", fr: "au revoir", it: "arrivederci", de: "auf Wiedersehen", hi: "अलविदा" } },
    { variants: ["pelo"], meanings: { en: "hair", ja: "髪", fr: "cheveux", it: "capelli", de: "Haare", hi: "बाल" } },
  ],
  fr: [
    { variants: ["bonjour"], meanings: { en: "hello", ja: "こんにちは", es: "hola", it: "ciao", de: "hallo", hi: "नमस्ते" } },
    { variants: ["merci"], meanings: { en: "thank you", ja: "ありがとう", es: "gracias", it: "grazie", de: "danke", hi: "धन्यवाद" } },
    { variants: ["s'il vous plaît"], meanings: { en: "please", ja: "お願いします", es: "por favor", it: "per favore", de: "bitte", hi: "कृपया" } },
    { variants: ["café"], meanings: { en: "coffee", ja: "コーヒー", es: "café", it: "caffè", de: "Kaffee", hi: "कॉफ़ी" } },
    { variants: ["lait"], meanings: { en: "milk", ja: "牛乳", es: "leche", it: "latte", de: "Milch", hi: "दूध" } },
    { variants: ["eau"], meanings: { en: "water", ja: "水", es: "agua", it: "acqua", de: "Wasser", hi: "पानी" } },
    { variants: ["addition"], meanings: { en: "bill", ja: "お会計", es: "cuenta", it: "conto", de: "Rechnung" } },
    { variants: ["bus"], meanings: { en: "bus", ja: "バス", es: "autobús", it: "autobus", de: "Bus", hi: "बस" } },
    { variants: ["billet"], meanings: { en: "ticket", ja: "切符", es: "billete", it: "biglietto", de: "Fahrkarte", hi: "टिकट" } },
    { variants: ["taxi"], meanings: { en: "taxi", ja: "タクシー", es: "taxi", it: "taxi", de: "Taxi", hi: "टैक्सी" } },
    { variants: ["arrêt"], meanings: { en: "stop", ja: "停留所", es: "parada", it: "fermata", de: "Haltestelle" } },
    { variants: ["où"], meanings: { en: "where", ja: "どこ", es: "dónde", it: "dove", de: "wo", hi: "कहाँ" } },
    { variants: ["ici"], meanings: { en: "here", ja: "ここ", es: "aquí", it: "qui", de: "hier", hi: "यहाँ" } },
    { variants: ["cheveux"], meanings: { en: "hair", ja: "髪", es: "pelo", it: "capelli", de: "Haare", hi: "बाल" } },
    { variants: ["au revoir"], meanings: { en: "goodbye", ja: "さようなら", es: "adiós", it: "arrivederci", de: "auf Wiedersehen", hi: "अलविदा" } },
  ],
  it: [
    { variants: ["ciao"], meanings: { en: "hello", ja: "こんにちは", es: "hola", fr: "bonjour", de: "hallo", hi: "नमस्ते" } },
    { variants: ["buongiorno"], meanings: { en: "good morning", ja: "おはようございます", es: "buenos días", fr: "bonjour", de: "guten Morgen", hi: "सुप्रभात" } },
    { variants: ["grazie"], meanings: { en: "thank you", ja: "ありがとう", es: "gracias", fr: "merci", de: "danke", hi: "धन्यवाद" } },
    { variants: ["per favore"], meanings: { en: "please", ja: "お願いします", es: "por favor", fr: "s'il vous plaît", de: "bitte", hi: "कृपया" } },
    { variants: ["caffè"], meanings: { en: "coffee", ja: "コーヒー", es: "café", fr: "café", de: "Kaffee", hi: "कॉफ़ी" } },
    { variants: ["latte"], meanings: { en: "milk", ja: "牛乳", es: "leche", fr: "lait", de: "Milch", hi: "दूध" } },
    { variants: ["acqua"], meanings: { en: "water", ja: "水", es: "agua", fr: "eau", de: "Wasser", hi: "पानी" } },
    { variants: ["conto"], meanings: { en: "bill", ja: "お会計", es: "cuenta", fr: "addition", de: "Rechnung" } },
    { variants: ["autobus"], meanings: { en: "bus", ja: "バス", es: "autobús", fr: "bus", de: "Bus", hi: "बस" } },
    { variants: ["biglietto"], meanings: { en: "ticket", ja: "切符", es: "billete", fr: "billet", de: "Fahrkarte", hi: "टिकट" } },
    { variants: ["fermata"], meanings: { en: "stop", ja: "停留所", es: "parada", fr: "arrêt", de: "Haltestelle" } },
    { variants: ["dove"], meanings: { en: "where", ja: "どこ", es: "dónde", fr: "où", de: "wo", hi: "कहाँ" } },
    { variants: ["qui"], meanings: { en: "here", ja: "ここ", es: "aquí", fr: "ici", de: "hier", hi: "यहाँ" } },
    { variants: ["voglio"], meanings: { en: "I want", ja: "欲しい", es: "quiero", fr: "je veux", de: "ich möchte", hi: "चाहिए" } },
    { variants: ["arrivederci"], meanings: { en: "goodbye", ja: "さようなら", es: "adiós", fr: "au revoir", de: "auf Wiedersehen", hi: "अलविदा" } },
    { variants: ["capelli"], meanings: { en: "hair", ja: "髪", es: "pelo", fr: "cheveux", de: "Haare", hi: "बाल" } },
  ],
  hi: [
    { variants: ["नमस्ते", "namaste"], meanings: { en: "hello", ja: "こんにちは", es: "hola", fr: "bonjour", it: "ciao", de: "hallo" } },
    { variants: ["धन्यवाद", "dhanyavaad", "dhanyawad"], meanings: { en: "thank you", ja: "ありがとう", es: "gracias", fr: "merci", it: "grazie", de: "danke" } },
    { variants: ["कृपया", "kripya"], meanings: { en: "please", ja: "お願いします", es: "por favor", fr: "s'il vous plaît", it: "per favore", de: "bitte" } },
    { variants: ["चाय", "chai"], meanings: { en: "tea", ja: "紅茶", es: "té", fr: "thé", it: "tè", de: "Tee" } },
    { variants: ["पानी", "paani"], meanings: { en: "water", ja: "水", es: "agua", fr: "eau", it: "acqua", de: "Wasser" } },
    { variants: ["बिल", "bill"], meanings: { en: "bill", ja: "お会計", es: "cuenta", fr: "addition", it: "conto", de: "Rechnung" } },
    { variants: ["बस", "bus"], meanings: { en: "bus", ja: "バス", es: "autobús", fr: "bus", it: "autobus", de: "Bus" } },
    { variants: ["टिकट", "ticket"], meanings: { en: "ticket", ja: "切符", es: "billete", fr: "billet", it: "biglietto", de: "Fahrkarte" } },
    { variants: ["टैक्सी", "taxi"], meanings: { en: "taxi", ja: "タクシー", es: "taxi", fr: "taxi", it: "taxi", de: "Taxi" } },
    { variants: ["कहाँ", "kahan"], meanings: { en: "where", ja: "どこ", es: "dónde", fr: "où", it: "dove", de: "wo" } },
    { variants: ["यहाँ", "yahan"], meanings: { en: "here", ja: "ここ", es: "aquí", fr: "ici", it: "qui", de: "hier" } },
    { variants: ["चाहिए", "chahiye"], meanings: { en: "want", ja: "欲しい", es: "quiero", fr: "je veux", it: "voglio", de: "ich möchte" } },
    { variants: ["अलविदा", "alvida"], meanings: { en: "goodbye", ja: "さようなら", es: "adiós", fr: "au revoir", it: "arrivederci", de: "auf Wiedersehen" } },
    { variants: ["बाल", "baal"], meanings: { en: "hair", ja: "髪", es: "pelo", fr: "cheveux", it: "capelli", de: "Haare" } },
  ],
  ja: [
    { variants: ["こんにちは", "konnichiwa"], meanings: { en: "hello", es: "hola", fr: "bonjour", it: "ciao", de: "hallo", hi: "नमस्ते" } },
    { variants: ["ありがとう", "arigatou", "arigato"], meanings: { en: "thank you", es: "gracias", fr: "merci", it: "grazie", de: "danke", hi: "धन्यवाद" } },
    { variants: ["お願いします", "onegaishimasu"], meanings: { en: "please", es: "por favor", fr: "s'il vous plaît", it: "per favore", de: "bitte", hi: "कृपया" } },
    { variants: ["カフェ", "kafe"], meanings: { en: "coffee", es: "café", fr: "café", it: "caffè", de: "Kaffee", hi: "कॉफ़ी" } },
    { variants: ["水", "mizu"], meanings: { en: "water", es: "agua", fr: "eau", it: "acqua", de: "Wasser", hi: "पानी" } },
    { variants: ["お会計", "okaikei"], meanings: { en: "bill", es: "cuenta", fr: "addition", it: "conto", de: "Rechnung" } },
    { variants: ["バス", "basu"], meanings: { en: "bus", es: "autobús", fr: "bus", it: "autobus", de: "Bus", hi: "बस" } },
    { variants: ["切符", "kippu"], meanings: { en: "ticket", es: "billete", fr: "billet", it: "biglietto", de: "Fahrkarte", hi: "टिकट" } },
    { variants: ["タクシー", "takushii"], meanings: { en: "taxi", es: "taxi", fr: "taxi", it: "taxi", de: "Taxi", hi: "टैक्सी" } },
    { variants: ["停留所", "teiryuujo"], meanings: { en: "bus stop", es: "parada", fr: "arrêt", it: "fermata", de: "Haltestelle" } },
    { variants: ["どこ", "doko"], meanings: { en: "where", es: "dónde", fr: "où", it: "dove", de: "wo", hi: "कहाँ" } },
    { variants: ["ここ", "koko"], meanings: { en: "here", es: "aquí", fr: "ici", it: "qui", de: "hier", hi: "यहाँ" } },
    { variants: ["いらっしゃいませ", "irasshaimase"], meanings: { en: "welcome", es: "bienvenido", fr: "bienvenue", it: "benvenuto", de: "willkommen", hi: "स्वागत है" } },
    { variants: ["髪", "kami"], meanings: { en: "hair", es: "pelo", fr: "cheveux", it: "capelli", de: "Haare", hi: "बाल" } },
    { variants: ["ご注文", "gochuumon"], meanings: { en: "order", es: "pedido", fr: "commande", it: "ordine", de: "Bestellung" } },
    { variants: ["さようなら", "sayounara"], meanings: { en: "goodbye", es: "adiós", fr: "au revoir", it: "arrivederci", de: "auf Wiedersehen", hi: "अलविदा" } },
  ],
  te: [
    { variants: ["నమస్కారం", "namaskaram"], meanings: { en: "hello", ja: "こんにちは", es: "hola", fr: "bonjour", it: "ciao", de: "hallo", hi: "नमस्ते" } },
    { variants: ["ధన్యవాదాలు", "dhanyavaadaalu"], meanings: { en: "thank you", ja: "ありがとう", es: "gracias", fr: "merci", it: "grazie", de: "danke", hi: "धन्यवाद" } },
    { variants: ["దయచేసి", "dayachesi"], meanings: { en: "please", ja: "お願いします", es: "por favor", fr: "s'il vous plaît", it: "per favore", de: "bitte", hi: "कृपया" } },
    { variants: ["చాయ్", "chaay"], meanings: { en: "tea", ja: "紅茶", es: "té", fr: "thé", it: "tè", de: "Tee", hi: "चाय" } },
    { variants: ["నీరు", "neeru"], meanings: { en: "water", ja: "水", es: "agua", fr: "eau", it: "acqua", de: "Wasser", hi: "पानी" } },
    { variants: ["బిల్లు", "billu"], meanings: { en: "bill", ja: "お会計", es: "cuenta", fr: "addition", it: "conto", de: "Rechnung" } },
    { variants: ["బస్సు", "bassu"], meanings: { en: "bus", ja: "バス", es: "autobús", fr: "bus", it: "autobus", de: "Bus", hi: "बस" } },
    { variants: ["టికెట్", "tiket"], meanings: { en: "ticket", ja: "切符", es: "billete", fr: "billet", it: "biglietto", de: "Fahrkarte", hi: "टिकट" } },
    { variants: ["టాక్సీ", "taksee"], meanings: { en: "taxi", ja: "タクシー", es: "taxi", fr: "taxi", it: "taxi", de: "Taxi", hi: "टैक्सी" } },
    { variants: ["ఎక్కడ", "ekkada"], meanings: { en: "where", ja: "どこ", es: "dónde", fr: "où", it: "dove", de: "wo", hi: "कहाँ" } },
    { variants: ["ఇక్కడ", "ikkada"], meanings: { en: "here", ja: "ここ", es: "aquí", fr: "ici", it: "qui", de: "hier", hi: "यहाँ" } },
    { variants: ["కావాలి", "kaavaali"], meanings: { en: "want", ja: "欲しい", es: "quiero", fr: "je veux", it: "voglio", de: "ich möchte", hi: "चाहिए" } },
    { variants: ["జుట్టు", "juttu"], meanings: { en: "hair", ja: "髪", es: "pelo", fr: "cheveux", it: "capelli", de: "Haare", hi: "बाल" } },
  ],
};

function normalizeForm(input: string): NormalizedForm {
  const chars: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let spaceStart = -1;
  let spaceEnd = -1;

  const flushSpace = (): void => {
    if (spaceStart >= 0) {
      chars.push(" ");
      starts.push(spaceStart);
      ends.push(spaceEnd);
      spaceStart = -1;
    }
  };

  for (let i = 0; i < input.length; ) {
    const cp = input.codePointAt(i);
    if (cp === undefined) break;
    const char = String.fromCodePoint(cp);
    const charEnd = i + char.length;
    for (const unit of char.normalize("NFD")) {
      if (/\p{M}/u.test(unit)) {
        if (starts.length > 0) ends[ends.length - 1] = charEnd;
        continue;
      }
      if (/[\s\p{P}\p{S}\p{Cf}]/u.test(unit)) {
        if (spaceStart < 0) spaceStart = i;
        spaceEnd = charEnd;
        continue;
      }
      flushSpace();
      for (const lower of unit.toLowerCase()) {
        if (/\p{M}/u.test(lower)) {
          if (starts.length > 0) ends[ends.length - 1] = charEnd;
          continue;
        }
        chars.push(lower);
        starts.push(i);
        ends.push(charEnd);
      }
    }
    i = charEnd;
  }
  flushSpace();

  let from = 0;
  let to = chars.length;
  if (to > 0 && chars[to - 1] === " ") to -= 1;
  if (to > from && chars[from] === " ") from += 1;
  return {
    value: chars.slice(from, to).join(""),
    starts: starts.slice(from, to),
    ends: ends.slice(from, to),
  };
}

function isAscii(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 127) return false;
  }
  return true;
}

function buildGlossIndex(glossary: Record<string, GlossEntry[]>): Record<string, IndexedGloss[]> {
  const index: Record<string, IndexedGloss[]> = {};
  for (const lang of Object.keys(glossary)) {
    const flat: IndexedGloss[] = [];
    for (const entry of glossary[lang]) {
      for (const variant of entry.variants) {
        const norm = normalizeForm(variant).value;
        if (!norm) continue;
        flat.push({ norm, ascii: isAscii(norm), meanings: entry.meanings });
      }
    }
    flat.sort((a, b) => b.norm.length - a.norm.length);
    index[lang] = flat;
  }
  return index;
}

const GLOSS_INDEX: Record<string, IndexedGloss[]> = buildGlossIndex(GLOSSARY);

function findInNormalized(value: string, candidate: IndexedGloss): number {
  const first = value.indexOf(candidate.norm);
  if (first === -1) return -1;
  // Space-separated scripts (incl. Devanagari/Telugu) need word boundaries;
  // space-less text (CJK, Thai) can only be matched as a substring.
  const requireBoundary = candidate.ascii || value.includes(" ");
  if (!requireBoundary) return first;
  let at = first;
  while (at !== -1) {
    const before = at === 0 ? " " : value[at - 1];
    const after = at + candidate.norm.length >= value.length ? " " : value[at + candidate.norm.length];
    if (before === " " && after === " ") return at;
    at = value.indexOf(candidate.norm, at + 1);
  }
  return -1;
}

function findGloss(text: string, targetLang: string, nativeLang: string): string | undefined {
  const index = GLOSS_INDEX[targetLang];
  if (!index || index.length === 0) return undefined;
  const form = normalizeForm(text);
  if (!form.value) return undefined;

  for (const candidate of index) {
    const at = findInNormalized(form.value, candidate);
    if (at === -1) continue;
    const from = form.starts[at];
    const to = form.ends[at + candidate.norm.length - 1];
    const matched = text.slice(from, to).replace(/\s+/g, " ");
    if (!matched) continue;
    const meaning = nativeLang in candidate.meanings ? candidate.meanings[nativeLang] : candidate.meanings.en;
    if (!meaning) continue;
    return `${matched} = ${meaning}`;
  }
  return undefined;
}

function normalizeZone(zone: string): string {
  const key = zone.toLowerCase();
  if (key.includes("bus")) return "bus_stop";
  if (key.includes("taxi") || key.includes("cab")) return "taxi";
  return "cafe";
}

function pickTranslation(translations: Record<string, string>, nativeLang: string): string {
  if (nativeLang in translations) return translations[nativeLang];
  if ("en" in translations) return translations.en;
  return Object.values(translations)[0] ?? "";
}

export function buildLessonLine(input: {
  text: string;
  phonetic?: string;
  translation?: string;
  targetLang: string;
  nativeLang: string;
}): LessonLine {
  const text = input.text.trim();
  const line: LessonLine = { text };
  const phonetic = input.phonetic ? input.phonetic.trim() : "";
  if (phonetic) line.phonetic = phonetic;
  const translation = input.translation ? input.translation.trim() : "";
  if (translation) line.translation = translation;
  const gloss = findGloss(text, input.targetLang, input.nativeLang);
  if (gloss) line.gloss = gloss;
  return line;
}

const BARBER_LINES_CACHE: Record<string, ScriptedNpcLine[]> = {};

function getBarberLinesCached(targetLang: string): ScriptedNpcLine[] {
  const cached = BARBER_LINES_CACHE[targetLang];
  if (cached) return cached;
  const lines = getBarberScriptedNpcLines(targetLang);
  BARBER_LINES_CACHE[targetLang] = lines;
  return lines;
}

export function matchScriptedNpcLine(input: {
  text: string;
  targetLang: string;
  nativeLang: string;
  zone: string;
}): { phonetic: string; translation: string } | null {
  const query = normalizeForm(input.text).value;
  if (!query) return null;

  const zoneKey = normalizeZone(input.zone);
  const lines: ScriptedNpcLine[] = getScriptedNpcLines(input.targetLang, zoneKey);
  if (zoneKey === "cafe") lines.push(...getBarberLinesCached(input.targetLang));

  let best: { line: ScriptedNpcLine; exact: boolean; diff: number } | null = null;
  for (const line of lines) {
    const candidate = normalizeForm(line.text).value;
    if (!candidate) continue;
    const exact = candidate === query;
    if (!exact) {
      // Containment fallback: reject loose fragments ("hola" vs a whole sentence)
      // so a short live line never inherits an unrelated scripted translation.
      const shorter = Math.min(candidate.length, query.length);
      const longer = Math.max(candidate.length, query.length);
      if (shorter / longer < 0.6) continue;
      if (!candidate.includes(query) && !query.includes(candidate)) continue;
    }
    const diff = Math.abs(candidate.length - query.length);
    if (best === null) {
      best = { line, exact, diff };
      continue;
    }
    if (exact && !best.exact) {
      best = { line, exact, diff };
      continue;
    }
    if (exact === best.exact && diff < best.diff) {
      best = { line, exact, diff };
    }
  }
  if (best === null) return null;
  return {
    phonetic: best.line.phonetic,
    translation: pickTranslation(best.line.translations, input.nativeLang),
  };
}
