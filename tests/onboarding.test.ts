import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getBilingualDialogue, SUPPORTED_LEARNER_LANGUAGES } from "../src/scenarios/multilingual";
import { ONBOARDING_COUNTRIES, DEFAULT_STARTING_PLACE } from "../src/scenarios/catalog";

test("TDD [Supported Learner Languages]: Japanese is the only learner language", () => {
  const codes = SUPPORTED_LEARNER_LANGUAGES.map((l) => l.code);
  assert.deepEqual(codes, ["ja"], "Japanese must be the only supported learner language");
});

test("TDD [Onboarding Countries]: Provides Japan as the only destination country", () => {
  assert.ok(Array.isArray(ONBOARDING_COUNTRIES), "ONBOARDING_COUNTRIES must be an array");
  assert.equal(ONBOARDING_COUNTRIES.length, 1, "Only Japan must be offered as a destination");

  const japan = ONBOARDING_COUNTRIES[0];
  assert.equal(japan.country, "Japan", "Destination country must be Japan");
  assert.equal(japan.code, "ja", "Japan must map to language code 'ja'");
  assert.equal(japan.language, "Japanese", "Language for Japan must be Japanese");
  assert.equal(japan.nativeName, "日本語", "Native name must be 日本語");

  // No other language may remain selectable
  const others = ONBOARDING_COUNTRIES.filter(
    (c) => c.code !== "ja" || c.language.toLowerCase() !== "japanese"
  );
  assert.equal(others.length, 0, "No non-Japanese country may be present in onboarding");
});

test("TDD [Onboarding Map]: Defaults to single map starting place without forced place selection", () => {
  assert.equal(DEFAULT_STARTING_PLACE, "cafe", "Single map starting place should default to 'cafe'");
});

test("TDD [Japanese Support]: Scenario dialogues exist for the Japanese target language in all zones", () => {
  // 1. Cafe zone in Japanese
  const cafe = getBilingualDialogue({
    targetLang: "ja",
    nativeLang: "ja",
    zone: "cafe",
    stepIndex: 0,
  });
  assert.equal(cafe.targetLangName, "日本語");
  assert.ok(cafe.npcTargetText.length > 0, "Japanese cafe NPC dialogue must exist");
  assert.ok(cafe.npcPhonetics.length > 0, "Japanese cafe phonetics must exist");
  assert.ok(cafe.npcNativeTranslation.length > 0, "Japanese cafe translation must exist");

  // 2. Bus stop zone in Japanese
  const bus = getBilingualDialogue({
    targetLang: "ja",
    nativeLang: "ja",
    zone: "bus_stop",
    stepIndex: 0,
  });
  assert.equal(bus.targetLangName, "日本語");
  assert.ok(bus.npcTargetText.length > 0, "Japanese bus stop NPC dialogue must exist");

  // 3. Airport zone in Japanese
  const airport = getBilingualDialogue({
    targetLang: "ja",
    nativeLang: "ja",
    zone: "airport",
    stepIndex: 0,
  });
  assert.equal(airport.targetLangName, "日本語");
  assert.ok(airport.npcTargetText.length > 0, "Japanese airport NPC dialogue must exist");
});

test("TDD [Onboarding Page Content]: Removes clutter and adheres to simple two-color layout contract", () => {
  const pagePath = path.join(process.cwd(), "src/app/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Clutter phrases explicitly requested to be removed:
  const forbiddenPhrases = [
    "READY FOR DEPARTURE",
    "Where would you like to spawn? (All places are in the same walkable 3D world!)",
    "Your native tongue: We explain grammar, vocabulary, and phonetics in this language.",
    "STAGE",
    "METRO PLAZA",
    "002600",
    "🪙",
    "CHOOSE YOUR STARTING PLACE",
    "#5c94fc", // Mario blue
    "#ffcc00", // Mario yellow
    "#e52521", // Mario red
  ];

  for (const phrase of forbiddenPhrases) {
    assert.ok(
      !content.includes(phrase),
      `Onboarding page must not contain '${phrase}'`
    );
  }

  // Required sections / elements
  assert.ok(
    content.toLowerCase().includes("pick a country"),
    "Page must include 'Pick a country' section"
  );
  assert.ok(
    content.toLowerCase().includes("language you are comfortable in"),
    "Page must include 'Language you are comfortable in' section"
  );
  assert.ok(
    content.includes("Onboarding Complete"),
    "Page must include completion confirmation card"
  );
  assert.ok(
    content.includes("Edit Preferences"),
    "Page must include option to edit preferences"
  );
});

test("TDD [Pure Onboarding Repo]: All 3D map, city simulation, and game HUD files have been removed", () => {
  const forbiddenPaths = [
    "src/buildings",
    "src/city",
    "src/park",
    "src/pedestrians",
    "src/roads",
    "src/traffic",
    "src/components/world",
    "src/components/hud",
    "src/components/voice",
    "src/lib/world",
    "src/lib/game",
    "src/app/play",
    "src/components/ui/LoadingScreen.tsx",
    "src/components/ui",
    "docs/testing/loading-screen.tdd.md",
    "docs/testing/city-expansion.tdd.md",
    "docs/testing/3d-world.tdd.md",
    "info.md",
    "MAPLE_HOLLOW_SPEC.md",
  ];

  for (const relPath of forbiddenPaths) {
    const fullPath = path.join(process.cwd(), relPath);
    assert.equal(
      fs.existsSync(fullPath),
      false,
      `Path '${relPath}' must be completely removed from the repository`
    );
  }
});

