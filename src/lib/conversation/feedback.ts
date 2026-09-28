import { normalizeForm } from "./format";

/** How close the learner's spoken reply was to the expected phrase. */
export type ReplyVerdict = "correct" | "close" | "incorrect";

/** A wrong-word/right-word pair to show the learner. */
export interface WordCorrection {
  wrong: string;
  right: string;
}

/** Result of comparing a spoken reply against the expected phrase. */
export interface ReplyFeedback {
  verdict: ReplyVerdict;
  /** Similarity in 0..1, where 1 is an exact match. */
  similarity: number;
  corrections: WordCorrection[];
  /** Expected words the learner did not say. */
  missing: string[];
  /** Words the learner said that are not in the expected phrase. */
  extra: string[];
  /** The trimmed input the learner actually said on this attempt. */
  said: string;
  attempt: number;
  maxAttempts: number;
}

/**
 * Single gate for "the learner must retry this step": non-correct feedback
 * with attempts still left. Used by the store's advanceStep so every caller
 * agrees on when a step is still blocked.
 */
export function mustRetry(fb: ReplyFeedback | null, attempt: number): boolean {
  return !!fb && fb.verdict !== "correct" && attempt < fb.maxAttempts;
}

interface Token {
  raw: string;
  norm: string;
}

interface PathResult {
  /** Similarity before clamping, used to pick the better of the two paths. */
  raw: number;
  corrections: WordCorrection[];
  missing: string[];
  extra: string[];
  errors: number;
}

const CJK_NO_SPACE = /[\u3040-\u30ff\u3400-\u9fff]/;

/**
 * A side of a comparison that must be read char-by-char: CJK text with no
 * whitespace of its own (Japanese is written without spaces).
 */
function isCharLevelCandidate(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && !/\s/.test(trimmed) && CJK_NO_SPACE.test(trimmed);
}

/**
 * Granularity is decided per comparison: when EITHER side has no whitespace
 * and contains CJK, BOTH sides are tokenized at char level so that
 * "おはようございます" and "おはよう ございます" compare as the same characters.
 */
function tokenize(text: string, charLevel: boolean): Token[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const pieces = charLevel ? Array.from(trimmed) : trimmed.split(/\s+/);
  const tokens: Token[] = [];
  for (const piece of pieces) {
    const norm = normalizeForm(piece).value;
    if (norm) tokens.push({ raw: piece, norm });
  }
  return tokens;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev: number[] = new Array<number>(b.length + 1);
  let curr: number[] = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length];
}

function isNearMiss(a: string, b: string): boolean {
  const shorter = Math.min(a.length, b.length);
  const longer = Math.max(a.length, b.length);
  if (longer === 0) return true;
  if (shorter / longer < 0.6) return false;
  return levenshtein(a, b) <= Math.max(1, Math.floor(0.4 * shorter));
}

function lcsPairs(a: string[], b: string[]): Array<[number, number]> {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return pairs;
}

function scorePath(expected: Token[], said: Token[]): PathResult {
  const n = expected.length;
  const m = said.length;
  const corrections: WordCorrection[] = [];
  const missing: string[] = [];
  const extra: string[] = [];
  let substitutions = 0;

  const handleUnequal = (e: Token, s: Token): void => {
    corrections.push({ wrong: s.raw, right: e.raw });
    if (isNearMiss(e.norm, s.norm)) {
      substitutions += 1;
    } else {
      missing.push(e.raw);
      extra.push(s.raw);
    }
  };

  const drainGap = (eFrom: number, eTo: number, sFrom: number, sTo: number): void => {
    const paired = Math.min(eTo - eFrom, sTo - sFrom);
    for (let t = 0; t < paired; t += 1) {
      const e = expected[eFrom + t];
      const s = said[sFrom + t];
      if (e.norm !== s.norm) handleUnequal(e, s);
    }
    for (let t = eFrom + paired; t < eTo; t += 1) missing.push(expected[t].raw);
    for (let t = sFrom + paired; t < sTo; t += 1) extra.push(said[t].raw);
  };

  let prevE = 0;
  let prevS = 0;
  for (const [i, j] of lcsPairs(expected.map((t) => t.norm), said.map((t) => t.norm))) {
    drainGap(prevE, i, prevS, j);
    prevE = i + 1;
    prevS = j + 1;
  }
  drainGap(prevE, n, prevS, m);

  const edits = substitutions + missing.length + extra.length;
  const raw = 1 - edits / Math.max(n, 1);
  return { raw, corrections, missing, extra, errors: missing.length + extra.length };
}

/**
 * Compares what the learner said against the expected phrase and reports how
 * close it was, which words to correct, and how many attempts are left.
 *
 * Pure: no state, no I/O. Safe to call from Node or the browser.
 */
export function evaluateReply(input: {
  expected: string;
  /** Romanization of the expected phrase, e.g. "konnichiwa". */
  expectedPhonetic?: string;
  said: string;
  /** 1-based attempt number. */
  attempt: number;
  /** Defaults to 3. */
  maxAttempts?: number;
}): ReplyFeedback {
  const maxAttempts = input.maxAttempts ?? 3;
  const echo = { attempt: input.attempt, maxAttempts, said: input.said.trim() };
  const mainCharLevel =
    isCharLevelCandidate(input.expected) || isCharLevelCandidate(input.said);
  const expectedTokens = tokenize(input.expected, mainCharLevel);
  const saidTokens = tokenize(input.said, mainCharLevel);

  if (saidTokens.length === 0) {
    return {
      verdict: "incorrect",
      similarity: 0,
      corrections: [],
      missing: expectedTokens.map((t) => t.raw),
      extra: [],
      ...echo,
    };
  }

  let best = scorePath(expectedTokens, saidTokens);
  const phonetic = input.expectedPhonetic?.trim();
  if (phonetic) {
    // The phonetic path is its own comparison, so it picks its own granularity.
    const phoneticCharLevel =
      isCharLevelCandidate(phonetic) || isCharLevelCandidate(input.said);
    const alt = scorePath(
      tokenize(phonetic, phoneticCharLevel),
      tokenize(input.said, phoneticCharLevel)
    );
    if (alt.raw > best.raw || (alt.raw === best.raw && alt.errors < best.errors)) best = alt;
  }

  const similarity = Math.min(1, Math.max(0, best.raw));
  const verdict: ReplyVerdict =
    similarity >= 0.9 && best.missing.length === 0 && best.extra.length === 0
      ? "correct"
      : similarity >= 0.55
        ? "close"
        : "incorrect";
  return {
    verdict,
    similarity,
    corrections: best.corrections,
    missing: best.missing,
    extra: best.extra,
    ...echo,
  };
}
