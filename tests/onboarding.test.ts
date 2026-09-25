import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getBilingualDialogue, SUPPORTED_LEARNER_LANGUAGES } from "../src/scenarios/multilingual";
import { ONBOARDING_COUNTRIES, DEFAULT_STARTING_PLACE } from "../src/scenarios/catalog";

test("TDD [Supported Learner Languages]: Provides core scaffolding languages including Hindi and English", () => {
  const codes = SUPPORTED_LEARNER_LANGUAGES.map((l) => l.code);
  assert.ok(codes.includes("en"), "English must be supported");
  assert.ok(codes.includes("hi"), "Hindi must be supported as comfortable language");
  assert.ok(codes.includes("ja"), "Japanese must be supported");
});

test("TDD [Onboarding Countries]: Provides country selection with Hindi instead of Telugu", () => {
  // Must have countries defined
  assert.ok(Array.isArray(ONBOARDING_COUNTRIES), "ONBOARDING_COUNTRIES must be an array");
  assert.ok(ONBOARDING_COUNTRIES.length >= 4, "Must offer multiple destination countries");

  // Verify India is present with Hindi (not Telugu)
  const india = ONBOARDING_COUNTRIES.find((c) => c.country.toLowerCase() === "india");
  assert.ok(india, "India must be available in country selection");
  assert.equal(india.code, "hi", "India must map to Hindi language code 'hi'");
  assert.equal(india.language, "Hindi", "Language for India must be Hindi");
  assert.equal(india.nativeName, "हिन्दी", "Native name must be हिन्दी");

  // Verify Telugu is not in the country options
  const telugu = ONBOARDING_COUNTRIES.find(
    (c) => c.code === "te" || c.language.toLowerCase().includes("telugu")
  );
  assert.equal(telugu, undefined, "Telugu must be replaced and not present in onboarding countries");

  // Verify other core countries are present
  const countryNames = ONBOARDING_COUNTRIES.map((c) => c.country.toLowerCase());
  assert.ok(countryNames.includes("spain"), "Spain must be present");
  assert.ok(countryNames.includes("japan"), "Japan must be present");
  assert.ok(countryNames.includes("france"), "France must be present");
  assert.ok(countryNames.includes("italy"), "Italy must be present");
});

test("TDD [Onboarding Map]: Defaults to single map starting place without forced place selection", () => {
  assert.equal(DEFAULT_STARTING_PLACE, "cafe", "Single map starting place should default to 'cafe'");
});

test("TDD [Multilingual Hindi Support]: Scenario dialogues exist for Hindi target language in all zones", () => {
  // 1. Cafe zone in Hindi taught to English speaker
  const hindiCafe = getBilingualDialogue({
    targetLang: "hi",
    nativeLang: "en",
    zone: "cafe",
    stepIndex: 0,
  });
  assert.equal(hindiCafe.targetLangName, "हिन्दी");
  assert.ok(hindiCafe.npcTargetText.length > 0, "Hindi cafe NPC dialogue must exist");
  assert.ok(hindiCafe.npcPhonetics.length > 0, "Hindi cafe phonetics must exist");
  assert.ok(hindiCafe.npcNativeTranslation.length > 0, "Hindi cafe translation must exist");

  // 2. Bus stop zone in Hindi
  const hindiBus = getBilingualDialogue({
    targetLang: "hi",
    nativeLang: "en",
    zone: "bus_stop",
    stepIndex: 0,
  });
  assert.equal(hindiBus.targetLangName, "हिन्दी");
  assert.ok(hindiBus.npcTargetText.length > 0, "Hindi bus stop NPC dialogue must exist");

  // 3. Airport zone in Hindi
  const hindiAirport = getBilingualDialogue({
    targetLang: "hi",
    nativeLang: "en",
    zone: "airport",
    stepIndex: 0,
  });
  assert.equal(hindiAirport.targetLangName, "हिन्दी");
  assert.ok(hindiAirport.npcTargetText.length > 0, "Hindi airport NPC dialogue must exist");
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
});
