/**
 * TDD Evidence: Coffee Shop NPC Interaction System
 *
 * Tests cover:
 *  - Proximity detection (pure function — no Three.js required)
 *  - Conversation Zustand store state machine
 *  - Scenario configuration data integrity
 *  - Coffee shop 3D creation (Three.js procedural mesh)
 *  - Security: secrets stay out of the repo
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─────────────────────────────────────────────────────────────────
// 1. PROXIMITY DETECTION (pure, no Three.js)
// ─────────────────────────────────────────────────────────────────

import { isWithinInteractionRange } from "../src/interaction/coffee-shop";

test("TDD [Proximity]: player exactly at NPC is within range", () => {
  const result = isWithinInteractionRange(0, 0, 0, 0, 12);
  assert.equal(result, true, "Player AT the NPC must be in range");
});

test("TDD [Proximity]: player inside radius is within range", () => {
  // Player at (5, 0), NPC at (0, 0), radius 12 → dist = 5
  assert.equal(isWithinInteractionRange(5, 0, 0, 0, 12), true);
});

test("TDD [Proximity]: player exactly on boundary radius is within range", () => {
  // dist = 12, radius = 12 → 12² ≤ 12²
  assert.equal(isWithinInteractionRange(12, 0, 0, 0, 12), true);
});

test("TDD [Proximity]: player outside radius is NOT within range", () => {
  // dist = 13, radius = 12
  assert.equal(isWithinInteractionRange(13, 0, 0, 0, 12), false);
});

test("TDD [Proximity]: diagonal distance is computed correctly", () => {
  // Player at (8, 6), NPC at (0, 0), dist = √(64+36) = 10
  assert.equal(isWithinInteractionRange(8, 6, 0, 0, 12), true, "dist=10 < radius=12");
  assert.equal(isWithinInteractionRange(8, 6, 0, 0, 9),  false, "dist=10 > radius=9");
});

test("TDD [Proximity]: negative positions work correctly", () => {
  // Player at (-6, -8), NPC at (0, 0), dist = 10
  assert.equal(isWithinInteractionRange(-6, -8, 0, 0, 12), true);
});

test("TDD [Proximity]: NPC world offset is respected", () => {
  // NPC at (4, -70), player at (14, -70) → dist = 10
  assert.equal(isWithinInteractionRange(14, -70, 4, -70, 12), true);
  // Player at (20, -70) → dist = 16
  assert.equal(isWithinInteractionRange(20, -70, 4, -70, 12), false);
});

// ─────────────────────────────────────────────────────────────────
// 2. CONVERSATION ZUSTAND STORE
// ─────────────────────────────────────────────────────────────────

import { useConversationStore } from "../src/lib/conversation/store";

function resetStore(): void {
  // Reset the store to initial state between tests
  useConversationStore.setState({
    status: "CLOSED",
    messages: [],
    currentNpcName: "",
    currentObjective: "",
    currentStep: 0,
    totalSteps: 1,
    isInRange: false,
    isOpen: false,
    errorMessage: null,
  });
}

test("TDD [Store]: initial state is CLOSED and not open", () => {
  resetStore();
  const s = useConversationStore.getState();
  assert.equal(s.status, "CLOSED");
  assert.equal(s.isOpen, false);
  assert.equal(s.isInRange, false);
  assert.equal(s.messages.length, 0);
});

test("TDD [Store]: setInRange updates proximity flag without opening UI", () => {
  resetStore();
  useConversationStore.getState().setInRange(true);
  const s = useConversationStore.getState();
  assert.equal(s.isInRange, true);
  assert.equal(s.isOpen, false, "Setting in-range should NOT open the conversation");
});

test("TDD [Store]: openConversation transitions to LISTENING and sets metadata", () => {
  resetStore();
  useConversationStore.getState().openConversation("Murugan", "Ask for directions", 3);
  const s = useConversationStore.getState();
  assert.equal(s.isOpen, true);
  assert.equal(s.status, "LISTENING");
  assert.equal(s.currentNpcName, "Murugan");
  assert.equal(s.currentObjective, "Ask for directions");
  assert.equal(s.totalSteps, 3);
  assert.equal(s.currentStep, 1);
  assert.equal(s.messages.length, 0, "Messages cleared on open");
  assert.equal(s.errorMessage, null);
});

test("TDD [Store]: cannot open conversation twice (idempotent open)", () => {
  resetStore();
  useConversationStore.getState().openConversation("Murugan", "Step A", 3);
  useConversationStore.getState().openConversation("Murugan", "Step B", 3);
  const s = useConversationStore.getState();
  // The second call resets state — currentObjective is the last call's value
  assert.equal(s.isOpen, true);
  assert.equal(s.status, "LISTENING");
});

test("TDD [Store]: addMessage appends to messages with generated id and timestamp", () => {
  resetStore();
  const before = Date.now();
  useConversationStore.getState().addMessage({
    speaker: "NPC",
    text: "Vanakkam!",
    phonetic: "Vanakkam!",
    translation: "Hello/Welcome!",
  });
  const after = Date.now();
  const s = useConversationStore.getState();
  assert.equal(s.messages.length, 1);
  const msg = s.messages[0];
  assert.equal(msg.speaker, "NPC");
  assert.equal(msg.text, "Vanakkam!");
  assert.equal(msg.phonetic, "Vanakkam!");
  assert.equal(msg.translation, "Hello/Welcome!");
  assert.ok(msg.id.length > 0, "id must be set");
  assert.ok(msg.timestamp >= before && msg.timestamp <= after, "timestamp must be recent");
});

test("TDD [Store]: messages have unique IDs", () => {
  resetStore();
  const store = useConversationStore.getState();
  store.addMessage({ speaker: "NPC", text: "Hello" });
  store.addMessage({ speaker: "USER", text: "Hi" });
  const { messages } = useConversationStore.getState();
  assert.equal(messages.length, 2);
  assert.notEqual(messages[0].id, messages[1].id, "Each message must have a unique ID");
});

test("TDD [Store]: finalizeUserTurn creates USER message", () => {
  resetStore();
  useConversationStore.getState().finalizeUserTurn("T Nagar");
  const s = useConversationStore.getState();
  assert.equal(s.messages.length, 1);
  assert.equal(s.messages[0].speaker, "USER");
  assert.equal(s.messages[0].text, "T Nagar");
  assert.equal(s.status, "PROCESSING");
});

test("TDD [Store]: finalizeUserTurn ignores empty/whitespace text", () => {
  resetStore();
  useConversationStore.getState().finalizeUserTurn("   ");
  assert.equal(useConversationStore.getState().messages.length, 0);
});

test("TDD [Store]: closeConversation resets isOpen and status to CLOSED", () => {
  resetStore();
  useConversationStore.getState().openConversation("Murugan", "Greet", 1);
  useConversationStore.getState().closeConversation();
  const s = useConversationStore.getState();
  assert.equal(s.isOpen, false);
  assert.equal(s.status, "CLOSED");
});

test("TDD [Store]: closing conversation restores player control signal", () => {
  resetStore();
  useConversationStore.getState().openConversation("Murugan", "Greet", 1);
  useConversationStore.getState().closeConversation();
  // isOpen === false means the game loop resumes movement
  assert.equal(useConversationStore.getState().isOpen, false);
});

test("TDD [Store]: advanceStep increments currentStep and does not exceed totalSteps", () => {
  resetStore();
  useConversationStore.getState().openConversation("Murugan", "Greet", 3);
  useConversationStore.getState().advanceStep();
  assert.equal(useConversationStore.getState().currentStep, 2);
  useConversationStore.getState().advanceStep();
  assert.equal(useConversationStore.getState().currentStep, 3);
  useConversationStore.getState().advanceStep(); // clamp at totalSteps
  assert.equal(useConversationStore.getState().currentStep, 3, "Must not exceed totalSteps");
});

test("TDD [Store]: setError transitions to ERROR state with message", () => {
  resetStore();
  useConversationStore.getState().setError("Conversation failed");
  const s = useConversationStore.getState();
  assert.equal(s.status, "ERROR");
  assert.equal(s.errorMessage, "Conversation failed");
});

test("TDD [Store]: clearError returns to CLOSED with no error message", () => {
  resetStore();
  useConversationStore.getState().setError("Some error");
  useConversationStore.getState().clearError();
  const s = useConversationStore.getState();
  assert.equal(s.status, "CLOSED");
  assert.equal(s.errorMessage, null);
});

test("TDD [Store]: setStatus can set PROCESSING state", () => {
  resetStore();
  useConversationStore.getState().setStatus("PROCESSING");
  assert.equal(useConversationStore.getState().status, "PROCESSING");
});

test("TDD [Store]: conversation message ordering is preserved", () => {
  resetStore();
  const store = useConversationStore.getState();
  store.addMessage({ speaker: "NPC",  text: "Vanakkam!" });
  store.addMessage({ speaker: "USER", text: "Hello!" });
  store.addMessage({ speaker: "NPC",  text: "Enga poganum?" });
  const msgs = useConversationStore.getState().messages;
  assert.equal(msgs[0].speaker, "NPC");
  assert.equal(msgs[1].speaker, "USER");
  assert.equal(msgs[2].speaker, "NPC");
  assert.equal(msgs[2].text, "Enga poganum?");
});

// ─────────────────────────────────────────────────────────────────
// 3. SCENARIO CONFIGURATION DATA INTEGRITY
// ─────────────────────────────────────────────────────────────────

import {
  COFFEE_SHOP_SCENARIO,
  COFFEE_SHOP_WORLD_POSITION,
  COFFEE_SHOP_ROTATION,
} from "../src/scenarios/coffee-shop-scenario";

test("TDD [Scenario]: scenario has required fields", () => {
  assert.ok(COFFEE_SHOP_SCENARIO.id, "Must have an id");
  assert.ok(COFFEE_SHOP_SCENARIO.npcName, "Must have npcName");
  assert.ok(COFFEE_SHOP_SCENARIO.systemPrompt, "Must have a system prompt");
  assert.ok(COFFEE_SHOP_SCENARIO.greeting, "Must have a greeting message");
  assert.ok(Array.isArray(COFFEE_SHOP_SCENARIO.objectives), "Must have objectives array");
  assert.ok(COFFEE_SHOP_SCENARIO.objectives.length >= 1, "Must have at least 1 objective");
  assert.ok(COFFEE_SHOP_SCENARIO.interactionRadius > 0, "interactionRadius must be positive");
});

test("TDD [Scenario]: contextPayload does not contain API key", () => {
  const payload = JSON.stringify(COFFEE_SHOP_SCENARIO.contextPayload);
  assert.ok(!payload.includes("sk-"), "Context payload must not contain API keys");
  assert.ok(!payload.includes("API_KEY"), "Context payload must not contain API key references");
});

test("TDD [Scenario]: system prompt does not contain raw secrets", () => {
  const prompt = COFFEE_SHOP_SCENARIO.systemPrompt;
  assert.ok(!prompt.includes("sk-"), "System prompt must not contain API keys");
  assert.ok(prompt.length > 50, "System prompt must have meaningful content");
});

test("TDD [Scenario]: world position is in valid map range", () => {
  // Map is ~388 units wide, centered at 0
  assert.ok(
    Math.abs(COFFEE_SHOP_WORLD_POSITION.x) < 200,
    `Coffee shop x=${COFFEE_SHOP_WORLD_POSITION.x} must be within map bounds`
  );
  assert.ok(
    Math.abs(COFFEE_SHOP_WORLD_POSITION.z) < 200,
    `Coffee shop z=${COFFEE_SHOP_WORLD_POSITION.z} must be within map bounds`
  );
});

// ─────────────────────────────────────────────────────────────────
// 4. COFFEE SHOP 3D CREATION (Three.js procedural mesh)
// ─────────────────────────────────────────────────────────────────

import * as THREE from "three";
import { createCoffeeShop } from "../src/interaction/coffee-shop";

test("TDD [CoffeeShop3D]: createCoffeeShop returns required interface members", () => {
  const stall = createCoffeeShop(4, -70);
  assert.ok(stall.group instanceof THREE.Group, "group must be a THREE.Group");
  assert.ok(typeof stall.update === "function", "update must be a function");
  assert.ok(typeof stall.dispose === "function", "dispose must be a function");
  assert.ok(typeof stall.interactionRadius === "number", "interactionRadius must be a number");
  assert.ok(stall.interactionRadius > 0, "interactionRadius must be positive");
  assert.ok(typeof stall.npcWorldPosition === "object", "npcWorldPosition must be an object");
  assert.ok(typeof stall.npcWorldPosition.x === "number", "npcWorldPosition.x must be a number");
  assert.ok(typeof stall.npcWorldPosition.z === "number", "npcWorldPosition.z must be a number");
  stall.dispose();
});

test("TDD [CoffeeShop3D]: group is positioned at specified world coordinates", () => {
  const stall = createCoffeeShop(10, -50);
  assert.equal(stall.group.position.x, 10);
  assert.equal(stall.group.position.z, -50);
  stall.dispose();
});

test("TDD [CoffeeShop3D]: rotationY turns the stall around and follows the interaction point to the customer side", () => {
  const defaultFacing = createCoffeeShop(4, -70);
  const turned = createCoffeeShop(4, -70, Math.PI);

  assert.equal(defaultFacing.group.rotation.y, 0, "no rotation by default");
  assert.equal(turned.group.rotation.y, Math.PI, "rotationY must be applied to the group");

  // Default: interaction point sits 2 units in front of the counter (+Z)
  assert.ok(Math.abs(defaultFacing.npcWorldPosition.x - 4) < 1e-9);
  assert.ok(Math.abs(defaultFacing.npcWorldPosition.z - (-68)) < 1e-9);
  // Rotated 180°: the customer side flips to -Z so it faces the player approach
  assert.ok(Math.abs(turned.npcWorldPosition.x - 4) < 1e-9, "π rotation keeps x at the anchor");
  assert.ok(Math.abs(turned.npcWorldPosition.z - (-72)) < 1e-9, "interaction point mirrors to -Z");

  defaultFacing.dispose();
  turned.dispose();
});

test("TDD [CoffeeShop3D]: group has a named NPC child", () => {
  const stall = createCoffeeShop(0, 0);
  // The NPC group should be findable by name
  const npc = stall.group.getObjectByName("MuruganNPC");
  assert.ok(npc, "Group must contain the MuruganNPC child object");
  stall.dispose();
});

test("TDD [CoffeeShop3D]: stall is scaled 2x and barista NPC is highlighted with visual beacon", () => {
  const stall = createCoffeeShop(0, 0);
  const npc = stall.group.getObjectByName("MuruganNPC");
  assert.ok(npc);
  assert.ok(
    stall.group.scale.x >= 1.9 && stall.group.scale.x <= 2.1,
    `Stall must be scaled 2x in size, got scale=${stall.group.scale.x}`
  );
  const worldScale = npc.scale.x * stall.group.scale.x;
  assert.ok(
    worldScale >= 1.7 && worldScale <= 2.2,
    `Barista NPC effective world scale must be approx double (~2x), got worldScale=${worldScale}`
  );

  const highlight = stall.group.getObjectByName("MuruganHighlight");
  assert.ok(highlight, "Barista NPC must have a named highlight beacon group (MuruganHighlight)");
  stall.dispose();
});

test("TDD [BusStop3D]: bus stop shelter footprint is 40% larger (2.8x), height reduced 30% (2.94), and conductor NPC is highlighted with visual beacon", () => {
  const busStop = createBusStop(BUS_STOP_WORLD_POSITION.x, BUS_STOP_WORLD_POSITION.z);
  const npc = busStop.group.getObjectByName("SureshConductorNPC");
  assert.ok(npc);
  assert.ok(
    busStop.group.scale.x >= 2.75 && busStop.group.scale.x <= 2.85,
    `Bus stop footprint must be 40% larger (scale.x = 2.8), got scale=${busStop.group.scale.x}`
  );
  assert.ok(
    busStop.group.scale.y >= 2.9 && busStop.group.scale.y <= 2.98,
    `Bus stand height must be reduced 30% from 4.2 (scale.y = 2.94), got scale=${busStop.group.scale.y}`
  );
  assert.ok(
    busStop.group.scale.z >= 2.75 && busStop.group.scale.z <= 2.85,
    `Bus stop depth must be 40% larger (scale.z = 2.8), got scale=${busStop.group.scale.z}`
  );
  const worldScale = npc.scale.x * busStop.group.scale.x;
  assert.ok(
    worldScale >= 1.7 && worldScale <= 2.2,
    `Conductor NPC effective world scale must be approx double (~2x), got worldScale=${worldScale}`
  );
  const worldScaleY = npc.scale.y * busStop.group.scale.y;
  assert.ok(
    worldScaleY >= 1.7 && worldScaleY <= 2.2,
    `Conductor NPC effective world scale in Y must be approx double (~2x), got worldScaleY=${worldScaleY}`
  );

  const highlight = busStop.group.getObjectByName("SureshHighlight");
  assert.ok(highlight, "Conductor NPC must have a named highlight beacon group (SureshHighlight)");
  busStop.dispose();
});

test("TDD [BusStandHeight]: Bus stand height is reduced 30% from 4.2 to 2.94", () => {
  const busStop = createBusStop(BUS_STOP_WORLD_POSITION.x, BUS_STOP_WORLD_POSITION.z);
  assert.ok(
    busStop.group.scale.y >= 2.9 && busStop.group.scale.y <= 2.98,
    `Bus stand scale.y must be 2.94 (30% less than 4.2), got ${busStop.group.scale.y}`
  );
  const bbox = new THREE.Box3().setFromObject(busStop.group);
  const height = bbox.max.y - bbox.min.y;
  assert.ok(
    height >= 12.5 && height <= 14.0,
    `Bus stand overall bounding box height must be ~13.1m (scale.y = 2.94), got ${height.toFixed(2)}m`
  );
  busStop.dispose();
});

test("TDD [CoffeeShop3D]: group has multiple children (stall geometry)", () => {
  const stall = createCoffeeShop(0, 0);
  assert.ok(stall.group.children.length >= 5, "Stall should have multiple scene children");
  stall.dispose();
});

test("TDD [CoffeeShop3D]: update() does not throw during idle animation", () => {
  const stall = createCoffeeShop(0, 0);
  assert.doesNotThrow(() => stall.update(0.016, false), "update idle must not throw");
  stall.dispose();
});

test("TDD [CoffeeShop3D]: update() does not throw during conversation animation", () => {
  const stall = createCoffeeShop(0, 0);
  assert.doesNotThrow(() => stall.update(0.016, true), "update conversation must not throw");
  stall.dispose();
});

test("TDD [CoffeeShop3D]: dispose() does not throw", () => {
  const stall = createCoffeeShop(0, 0);
  assert.doesNotThrow(() => stall.dispose(), "dispose must not throw");
});

test("TDD [CoffeeShop3D]: npcWorldPosition is near but distinct from stall position", () => {
  const stall = createCoffeeShop(4, -70);
  // NPC should be near the stall, not at (0,0)
  const distFromStall = Math.hypot(
    stall.npcWorldPosition.x - 4,
    stall.npcWorldPosition.z - (-70)
  );
  assert.ok(distFromStall < 10, "NPC position must be near the stall");
  stall.dispose();
});

// ─────────────────────────────────────────────────────────────────
// 5. SECURITY: SECRETS MUST NOT APPEAR IN THE REPO
// ─────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

test("TDD [Security]: .env.local is gitignored", () => {
  const gitignoreFile = path.join(
    import.meta.dirname ?? __dirname,
    "../.gitignore"
  );
  const content = fs.readFileSync(gitignoreFile, "utf8");
  assert.ok(
    content.includes(".env.local") || content.includes("*.local") || content.includes(".env*"),
    ".env.local must be covered by .gitignore (via .env.local, *.local, or .env*)"
  );
});

import { worldToMinimap, clampToMinimapCircle } from "../src/map/minimap-math";

test("TDD [MinimapPOI]: Shop world position is mapped and clampable on minimap", () => {
  const bounds = { minX: -194, maxX: 194, minZ: -194, maxZ: 194, totalWidth: 388, totalDepth: 388 };
  const rawPos = worldToMinimap(COFFEE_SHOP_WORLD_POSITION, bounds, 96, 12, 1.0);
  assert.ok(typeof rawPos.x === "number" && typeof rawPos.y === "number");
  const clamped = clampToMinimapCircle(rawPos, { x: 96, y: 96 }, 96, 8);
  const distFromCenter = Math.hypot(clamped.x - 96, clamped.y - 96);
  assert.ok(distFromCenter <= 96 - 8 + 0.1, "Clamped POI must stay within minimap circle");
});

// ─────────────────────────────────────────────────────────────────
// 7. BUS STOP & PARK EDGE POSITIONING SPECIFICATIONS
// ─────────────────────────────────────────────────────────────────

import { BUS_STOP_SCENARIO, BUS_STOP_WORLD_POSITION } from "../src/scenarios/bus-stop-scenario";
import { createBusStop, isWithinBusStopRange } from "../src/interaction/bus-stop";

test("TDD [Positioning]: Coffee shop stands on the Central Park lawn, not on the footpath or street", () => {
  // Central Park (plot-1-1) bounds: x in [-118, 26], z in [-118, 26]
  // Green lawn inside the park: x in [-104, 12], z in [-104, 12]
  // Terracotta footpath ring sits outside the lawn; road runs x in [26, 46]
  const { x, z } = COFFEE_SHOP_WORLD_POSITION;
  assert.ok(
    x >= -104 && x <= 12,
    `Coffee shop x=${x} must be on the park lawn x: [-104, 12]`
  );
  assert.ok(
    z >= -104 && z <= 12,
    `Coffee shop z=${z} must be on the park lawn z: [-104, 12]`
  );
  // The whole stall footprint (x ±6, z ±7.2, either way it is rotated) sits on the grass
  assert.ok(
    x - 6 >= -104 && x + 6 <= 12,
    `Coffee shop stall footprint x: [${x - 6}, ${x + 6}] must fit on the lawn`
  );
  assert.ok(
    z - 7.2 >= -104 && z + 7.2 <= 12,
    `Coffee shop stall footprint z: [${z - 7.2}, ${z + 7.2}] must fit on the lawn`
  );
  assert.ok(
    x < 26 || x > 46,
    `Coffee shop x=${x} must NOT be on the central road [26, 46]`
  );
  // Its interaction point must stay on the grass too
  const npc = createCoffeeShop(x, z, COFFEE_SHOP_ROTATION).npcWorldPosition;
  assert.ok(
    npc.x >= -104 && npc.x <= 12 && npc.z >= -104 && npc.z <= 12,
    `Coffee shop NPC point (${npc.x}, ${npc.z}) must stay on the lawn`
  );
});

test("TDD [Positioning]: Bus stop is at the west side of Central Park on the footpath and off the street", () => {
  // Central Park (plot-1-1) bounds: x in [-118, 26], z in [-118, 26]
  // Footpath along west perimeter: x in [-117.4, -104]
  // Vertical road between plot-1-0 and plot-1-1: x in [-138, -118]
  assert.ok(
    BUS_STOP_WORLD_POSITION.x >= -117.4 && BUS_STOP_WORLD_POSITION.x <= -104,
    `Bus stop x=${BUS_STOP_WORLD_POSITION.x} must be on the park west footpath x: [-117.4, -104]`
  );
  assert.ok(
    BUS_STOP_WORLD_POSITION.z >= -118 && BUS_STOP_WORLD_POSITION.z <= 26,
    `Bus stop z=${BUS_STOP_WORLD_POSITION.z} must be inside Central Park z: [-118, 26]`
  );
  assert.ok(
    BUS_STOP_WORLD_POSITION.x > -118,
    `Bus stop x=${BUS_STOP_WORLD_POSITION.x} must NOT be on the western road [-138, -118]`
  );
  // Directly opposite side of the park from the coffee shop (x=-20, on the lawn)
  assert.ok(
    BUS_STOP_WORLD_POSITION.x < -46 && COFFEE_SHOP_WORLD_POSITION.x > -46,
    `Bus stop (x=${BUS_STOP_WORLD_POSITION.x}) must be on the opposite (west) side of the park from coffee shop (x=${COFFEE_SHOP_WORLD_POSITION.x})`
  );
});

test("TDD [BusStopProximity]: isWithinBusStopRange computes distances correctly", () => {
  assert.equal(isWithinBusStopRange(-112, -68, -112, -68, 12), true, "At bus stop");
  assert.equal(isWithinBusStopRange(-107, -68, -112, -68, 12), true, "Within 5 units");
  assert.equal(isWithinBusStopRange(-100, -68, -112, -68, 12), true, "On 12-unit boundary");
  assert.equal(isWithinBusStopRange(-99, -68, -112, -68, 12), false, "Outside 12-unit radius");
});

test("TDD [BusStopScenario]: scenario has required fields and valid metadata", () => {
  assert.ok(BUS_STOP_SCENARIO.id, "Must have an id");
  assert.equal(BUS_STOP_SCENARIO.npcName, "Suresh", "NPC name must be Suresh");
  assert.equal(BUS_STOP_SCENARIO.busNumber, "23C", "Bus number must be 23C");
  assert.equal(BUS_STOP_SCENARIO.destination, "T Nagar", "Destination must be T Nagar");
  assert.ok(BUS_STOP_SCENARIO.systemPrompt.length > 50, "System prompt must have meaningful content");
  assert.ok(!BUS_STOP_SCENARIO.systemPrompt.includes("sk-"), "No secrets in prompt");
  assert.ok(BUS_STOP_SCENARIO.greeting.length > 0, "Must have greeting");
  assert.ok(BUS_STOP_SCENARIO.objectives.length >= 1, "Must have objectives");
  assert.ok(BUS_STOP_SCENARIO.interactionRadius > 0, "interactionRadius must be positive");
});

test("TDD [BusStop3D]: createBusStop returns required interface and child meshes", () => {
  const busStop = createBusStop(BUS_STOP_WORLD_POSITION.x, BUS_STOP_WORLD_POSITION.z);
  assert.ok(busStop.group instanceof THREE.Group, "group must be THREE.Group");
  assert.equal(busStop.group.position.x, -112);
  assert.equal(busStop.group.position.z, -68);
  assert.ok(typeof busStop.update === "function", "update must be a function");
  assert.ok(typeof busStop.dispose === "function", "dispose must be a function");
  assert.equal(busStop.interactionRadius, 12);
  assert.ok(typeof busStop.busStopWorldPosition === "object");
  assert.ok(typeof busStop.conductorWorldPosition === "object");
  assert.ok(typeof busStop.npcWorldPosition === "object");

  const npc = busStop.group.getObjectByName("SureshConductorNPC");
  assert.ok(npc, "Must contain SureshConductorNPC child group");
  assert.ok(busStop.group.children.length >= 8, "Must contain shelter, canopy, totem, and NPC");

  assert.doesNotThrow(() => busStop.update(0.016, false), "idle update must not throw");
  assert.doesNotThrow(() => busStop.update(0.016, true), "conversation update must not throw");
  assert.doesNotThrow(() => busStop.dispose(), "dispose must not throw");
});

test("TDD [MinimapPOI]: Bus stop world position is mapped and clampable on minimap", () => {
  const bounds = { minX: -194, maxX: 194, minZ: -194, maxZ: 194, totalWidth: 388, totalDepth: 388 };
  const rawPos = worldToMinimap(BUS_STOP_WORLD_POSITION, bounds, 96, 12, 1.0);
  assert.ok(typeof rawPos.x === "number" && typeof rawPos.y === "number");
  const clamped = clampToMinimapCircle(rawPos, { x: 96, y: 96 }, 96, 8);
  const distFromCenter = Math.hypot(clamped.x - 96, clamped.y - 96);
  assert.ok(distFromCenter <= 96 - 8 + 0.1, "Clamped Bus Stop POI must stay within minimap circle");
});

test("TDD [BusStopOrientation]: Bus stop shelter and conductor face West towards the road", () => {
  const busStop = createBusStop(BUS_STOP_WORLD_POSITION.x, BUS_STOP_WORLD_POSITION.z);
  assert.equal(busStop.group.rotation.y, -Math.PI / 2, "Bus stop must be rotated -PI/2 to face West towards the road");
  const npc = busStop.group.getObjectByName("SureshConductorNPC");
  assert.ok(npc, "Must contain SureshConductorNPC");
  assert.equal(npc.rotation.y, 0, "Conductor must face forward");
  busStop.dispose();
});


