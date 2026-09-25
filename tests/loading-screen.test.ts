import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getLoadingScreenMetadata,
  LOADING_STAGES,
} from "../src/components/ui/LoadingScreen";

test("TDD [Loading Screen Metadata]: Resolves selected country, languages, and place details accurately", () => {
  // Test case 1: Spain (es) to English (en)
  const meta1 = getLoadingScreenMetadata("es", "en", "cafe");
  assert.equal(meta1.countryName, "Spain");
  assert.equal(meta1.targetLanguageName, "Spanish");
  assert.equal(meta1.nativeLanguageName, "English");
  assert.ok(meta1.flagEmoji.length > 0, "Flag emoji should be present");
  assert.equal(meta1.destinationTitle, "Café de la Luna");

  // Test case 2: India (hi) to English (en)
  const meta2 = getLoadingScreenMetadata("hi", "en", "bus_stop");
  assert.equal(meta2.countryName, "India");
  assert.equal(meta2.targetLanguageName, "Hindi");
  assert.equal(meta2.nativeLanguageName, "English");
  assert.equal(meta2.flagEmoji, "🇮🇳");

  // Test case 3: Japan (ja) to Hindi (hi)
  const meta3 = getLoadingScreenMetadata("ja", "hi", "airport");
  assert.equal(meta3.countryName, "Japan");
  assert.equal(meta3.targetLanguageName, "Japanese");
  assert.equal(meta3.nativeLanguageName, "Hindi");
  assert.equal(meta3.flagEmoji, "🇯🇵");

  // Test case 4: Fallback for unknown country/language
  const fallback = getLoadingScreenMetadata("unknown_lang", "unknown_native", "unknown_place");
  assert.ok(fallback.countryName.length > 0, "Should have default country fallback");
  assert.ok(fallback.targetLanguageName.length > 0, "Should have default target language fallback");
  assert.ok(fallback.nativeLanguageName.length > 0, "Should have default native language fallback");
});

test("TDD [Loading Screen Stages]: Provides structured flight & 3D world preparation stages", () => {
  assert.ok(Array.isArray(LOADING_STAGES), "LOADING_STAGES must be an array");
  assert.ok(LOADING_STAGES.length >= 3, "Must have at least 3 progressive stages");

  const stageKeys = LOADING_STAGES.map((s) => s.id);
  assert.ok(stageKeys.includes("boarding"), "Must have flight boarding stage");
  assert.ok(stageKeys.includes("city_generation"), "Must have 3D city generation stage");
  assert.ok(stageKeys.includes("ready"), "Must have simulation ready stage");
});

test("TDD [Onboarding Page Loading Trigger]: Sets loading feedback on Start and links to 3D game", () => {
  const pagePath = path.join(process.cwd(), "src/app/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Must have state for starting / loading screen
  assert.ok(
    content.includes("isStarting") || content.includes("isLoading"),
    "Onboarding page must manage an isStarting/isLoading state when clicking start"
  );

  // Must render loading screen or loading state on Start
  assert.ok(
    content.includes("LoadingScreen"),
    "Onboarding page must import and render LoadingScreen during transition"
  );
});

test("TDD [Play Page Loading Integration]: Holds full-screen loading curtain until 3D scene is ready", () => {
  const playPagePath = path.join(process.cwd(), "src/app/play/page.tsx");
  const content = fs.readFileSync(playPagePath, "utf-8");

  // Must import LoadingScreen
  assert.ok(
    content.includes("LoadingScreen"),
    "Play page must import and display LoadingScreen"
  );

  // Must track scene readiness state
  assert.ok(
    content.includes("isSceneReady"),
    "Play page must maintain isSceneReady state"
  );

  // Must wire onSceneReady callback to Cafe3DWorld
  assert.ok(
    content.includes("onSceneReady"),
    "Play page must pass onSceneReady to Cafe3DWorld"
  );
});

test("TDD [Scene Builder WebGL Ready Hook]: Cafe3DScene supports onReady hook invoked on initial frame", () => {
  const sceneBuilderPath = path.join(process.cwd(), "src/lib/world/scene-builder.ts");
  const content = fs.readFileSync(sceneBuilderPath, "utf-8");

  assert.ok(
    content.includes("onReady?: () => void") || content.includes("onReady?:"),
    "CafeSceneHooks must define an onReady callback hook"
  );
  assert.ok(
    content.includes("this.hooks?.onReady?.()") || content.includes("this.hooks.onReady()"),
    "Cafe3DScene must invoke onReady when the initial frame renders"
  );
});
