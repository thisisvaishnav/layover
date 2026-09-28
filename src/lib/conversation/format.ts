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
  ja: [
    { variants: ["こんにちは", "konnichiwa"], meanings: { ja: "昼間のあいさつ" } },
    { variants: ["ありがとう", "arigatou", "arigato"], meanings: { ja: "感謝を伝えるあいさつ" } },
    { variants: ["お願いします", "onegaishimasu"], meanings: { ja: "頼む・願うときの言葉" } },
    { variants: ["カフェ", "kafe"], meanings: { ja: "コーヒーを飲む店" } },
    { variants: ["水", "mizu"], meanings: { ja: "みず" } },
    { variants: ["お会計", "okaikei"], meanings: { ja: "勘定・請求" } },
    { variants: ["バス", "basu"], meanings: { ja: "大型の乗合乗り物" } },
    { variants: ["切符", "kippu"], meanings: { ja: "乗車券" } },
    { variants: ["タクシー", "takushii"], meanings: { ja: "屋根付きの営業用クルマ" } },
    { variants: ["停留所", "teiryuujo"], meanings: { ja: "バス停" } },
    { variants: ["どこ", "doko"], meanings: { ja: "場所を尋ねる疑問詞" } },
    { variants: ["ここ", "koko"], meanings: { ja: "自分のいる場所" } },
    { variants: ["いらっしゃいませ", "irasshaimase"], meanings: { ja: "店での客あいさつ" } },
    { variants: ["髪", "kami"], meanings: { ja: "かみ" } },
    { variants: ["ご注文", "gochuumon"], meanings: { ja: "注文" } },
    { variants: ["さようなら", "sayounara"], meanings: { ja: "別れのあいさつ" } },
  ],
};

export function normalizeForm(input: string): NormalizedForm {
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
    const meaning = nativeLang in candidate.meanings ? candidate.meanings[nativeLang] : candidate.meanings.ja;
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
  if ("ja" in translations) return translations.ja;
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
