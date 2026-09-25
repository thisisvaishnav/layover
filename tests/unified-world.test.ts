import test from "node:test";
import assert from "node:assert/strict";
import {
  UNIFIED_PLAZA_BOUNDS,
  UNIFIED_PLAZA_HOTSPOTS,
  PLAZA_SPAWN_POINTS,
  getSpawnPositionForZone,
  getZoneFromPosition,
} from "../src/lib/world/unified-plaza";
import { computeAvatarKinematics } from "../src/lib/world/avatar-kinematics";
import { getBilingualDialogue } from "../src/scenarios/multilingual";

test("TDD [Unified Plaza]: Bounds contain all three zones (Café, Bus Stop, Airport)", () => {
  // World must span at least 40 units in X to comfortably fit all 3 walkable zones
  assert.ok(
    UNIFIED_PLAZA_BOUNDS.maxX - UNIFIED_PLAZA_BOUNDS.minX >= 40,
    "Plaza width must be at least 40 units"
  );
  // Z depth must be at least 18 units
  assert.ok(
    UNIFIED_PLAZA_BOUNDS.maxZ - UNIFIED_PLAZA_BOUNDS.minZ >= 18,
    "Plaza depth must be at least 18 units"
  );

  // Check spawn points exist for all 3 primary zones
  const cafeSpawn = PLAZA_SPAWN_POINTS["cafe"];
  const busSpawn = PLAZA_SPAWN_POINTS["bus_stop"];
  const airportSpawn = PLAZA_SPAWN_POINTS["airport"];

  assert.ok(cafeSpawn, "Cafe spawn point must exist");
  assert.ok(busSpawn, "Bus stop spawn point must exist");
  assert.ok(airportSpawn, "Airport spawn point must exist");

  // Verify cafe is to the west (negative X), bus stop central (around 0), airport to the east (positive X)
  assert.ok(cafeSpawn.x < -5, "Cafe should be on the West wing");
  assert.ok(
    Math.abs(busSpawn.x) <= 4,
    "Bus stop should be centrally located"
  );
  assert.ok(airportSpawn.x > 5, "Airport should be on the East wing");
});

test("TDD [Unified Plaza]: getZoneFromPosition returns correct zone dynamically as player walks", () => {
  assert.equal(getZoneFromPosition({ x: -14, y: 0, z: 1 }), "cafe");
  assert.equal(getZoneFromPosition({ x: 0, y: 0, z: 1 }), "bus_stop");
  assert.equal(getZoneFromPosition({ x: 14, y: 0, z: 1 }), "airport");
});

test("TDD [Unified Plaza]: Hotspots exist for Barista, Bus Conductor, and Airport Agent in one world", () => {
  const hotspotIds = UNIFIED_PLAZA_HOTSPOTS.map((h) => h.id);
  assert.ok(hotspotIds.includes("barista_mateo"), "Must have barista hotspot");
  assert.ok(hotspotIds.includes("bus_conductor"), "Must have bus conductor hotspot");
  assert.ok(hotspotIds.includes("airport_agent"), "Must have airport agent hotspot");
});

test("TDD [Avatar Kinematics]: computes limb rotations with opposition and idle damping", () => {
  // Idle state: limbs should return to rest (0 rotation)
  const idleKinematics = computeAvatarKinematics(false, 1.5, 0);
  assert.equal(idleKinematics.leftLegRotX, 0);
  assert.equal(idleKinematics.rightLegRotX, 0);
  assert.equal(idleKinematics.leftArmRotX, 0);
  assert.equal(idleKinematics.rightArmRotX, 0);
  assert.equal(idleKinematics.bounceY, 0);

  // Walking state at t = 0.5: limbs must rotate in opposite phase
  const walkKinematics = computeAvatarKinematics(true, 0.5, 4.0);
  assert.ok(walkKinematics.leftLegRotX !== 0, "Legs must move when walking");
  // Opposite phase for legs
  assert.ok(
    Math.sign(walkKinematics.leftLegRotX) === -Math.sign(walkKinematics.rightLegRotX),
    "Left and right legs must rotate in opposite directions"
  );
  // Arms move in opposition to legs (natural human biomechanics)
  assert.ok(
    Math.sign(walkKinematics.leftArmRotX) === Math.sign(walkKinematics.rightLegRotX),
    "Left arm must swing with right leg"
  );
  assert.ok(walkKinematics.bounceY >= 0, "Walking bounce should be positive or zero");
});

test("TDD [Multilingual Scaffolding]: Provides target language dialogue translated into learner's native tongue with phonetics", () => {
  // Spanish taught to a Japanese speaker
  const spanishInJapanese = getBilingualDialogue({
    targetLang: "es",
    nativeLang: "ja",
    zone: "cafe",
    stepIndex: 0,
  });

  assert.ok(spanishInJapanese, "Dialogue should be returned");
  assert.equal(spanishInJapanese.npcName, "Mateo");
  assert.ok(spanishInJapanese.npcTargetText.length > 0, "Must have Spanish target text");
  assert.ok(spanishInJapanese.npcPhonetics.length > 0, "Must have Romanized phonetics");
  assert.ok(spanishInJapanese.npcNativeTranslation.length > 0, "Must have Japanese translation");
  assert.ok(spanishInJapanese.userSuggestedTarget.length > 0, "Must have suggested user response in Spanish");
  assert.ok(spanishInJapanese.userSuggestedPhonetics.length > 0, "Must have phonetics for user");
  assert.ok(spanishInJapanese.userSuggestedNative.length > 0, "Must have native translation for user");

  // Telugu taught to an English speaker (matching the user's screenshot!)
  const teluguInEnglish = getBilingualDialogue({
    targetLang: "te",
    nativeLang: "en",
    zone: "bus_stop",
    stepIndex: 0,
  });

  assert.equal(teluguInEnglish.npcName, "Srinivas");
  assert.equal(teluguInEnglish.npcRole, "Conductor");
  assert.equal(teluguInEnglish.npcTargetText, "ఎక్కడికి?");
  assert.equal(teluguInEnglish.npcPhonetics, "Ekkadiki?");
  assert.equal(teluguInEnglish.npcNativeTranslation, "Where to?");
  assert.equal(teluguInEnglish.userSuggestedTarget, "Golconda");
  assert.ok(teluguInEnglish.objective.includes("Golconda"));
});

test("TDD [Unified Plaza]: getSpawnPositionForZone handles all variants and fallbacks", () => {
  assert.equal(getSpawnPositionForZone("airport").x, 14.0);
  assert.equal(getSpawnPositionForZone("aeropuerto").x, 14.0);
  assert.equal(getSpawnPositionForZone("bus").x, 0.0);
  assert.equal(getSpawnPositionForZone("cafe").x, -14.0);
  assert.equal(getSpawnPositionForZone(undefined).x, -14.0);
});
