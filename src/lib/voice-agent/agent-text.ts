export interface AgentUtterance {
  /** Line 1 — what the NPC said, in the language being practised */
  text: string;
  /** Line 2 — what that line means, in the learner's own language */
  meaning?: string;
}

// Defensive: some agents prefix the helper line anyway ("EN: …" / "Meaning: …").
const MEANING_PREFIX = /^(?:en|meaning)\s*[:：]\s*/i;

/**
 * The agent is prompted to answer on exactly two lines — target language first,
 * learner-language meaning second — because AssemblyAI only speaks text the
 * agent itself produced. Split them here so the UI can show the shop line and
 * its meaning as separate fields instead of one run-on string.
 */
export function splitAgentUtterance(raw: string): AgentUtterance {
  const normalized = raw.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return { text: "" };

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return { text: normalized };

  const meaning = lines
    .slice(1)
    .join(" ")
    .replace(MEANING_PREFIX, "")
    .trim();

  return meaning ? { text: lines[0], meaning } : { text: lines[0] };
}
