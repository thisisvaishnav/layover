import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveVelocity,
  checkAABBCollision,
  resolveMovement,
  findActiveHotspot,
} from "../src/lib/world/math";
import { MADRID_CAFE_HOTSPOTS, CAFE_BOUNDS, CAFE_OBSTACLES } from "../src/lib/world/hotspots";

test("TDD: resolveVelocity accurately computes direction and normalizes diagonals", () => {
  // Test forward
  const vForward = resolveVelocity({ forward: true, backward: false, left: false, right: false });
  assert.equal(vForward.x, 0);
  assert.equal(vForward.z, -1);

  // Test backward
  const vBackward = resolveVelocity({ forward: false, backward: true, left: false, right: false });
  assert.equal(vBackward.x, 0);
  assert.equal(vBackward.z, 1);

  // Test strafe left
  const vLeft = resolveVelocity({ forward: false, backward: false, left: true, right: false });
  assert.equal(vLeft.x, -1);
  assert.equal(vLeft.z, 0);

  // Test diagonal (forward + right)
  const vDiag = resolveVelocity({ forward: true, backward: false, left: false, right: true });
  const magnitude = Math.hypot(vDiag.x, vDiag.z);
  assert.ok(Math.abs(magnitude - 1.0) < 0.0001, `Diagonal magnitude should be 1, got ${magnitude}`);
  assert.ok(vDiag.x > 0);
  assert.ok(vDiag.z < 0);

  // Opposing keys cancel out
  const vCancel = resolveVelocity({ forward: true, backward: true, left: true, right: true });
  assert.equal(vCancel.x, 0);
  assert.equal(vCancel.z, 0);
});

test("TDD: checkAABBCollision detects circle-AABB intersection", () => {
  const box = { minX: 1, maxX: 3, minZ: 1, maxZ: 3 };

  // Point clearly outside
  assert.equal(checkAABBCollision({ x: 0, y: 0, z: 0 }, box, 0.4), false);

  // Point touching/overlapping box edge
  assert.equal(checkAABBCollision({ x: 0.8, y: 0, z: 2 }, box, 0.4), true);

  // Point deep inside box
  assert.equal(checkAABBCollision({ x: 2, y: 0, z: 2 }, box, 0.4), true);
});

test("TDD: resolveMovement clamps player inside café walls", () => {
  const bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
  const current = { x: 4.8, y: 0, z: 0 };
  
  // Try to walk right past maxX = 5 with radius 0.4
  const next = resolveMovement(
    current,
    { x: 1, z: 0 },
    5, // speed 5 units/sec
    1, // 1 sec delta
    [],
    bounds,
    0.4
  );

  assert.ok(next.x <= bounds.maxX - 0.4, `Player x (${next.x}) should not exceed wall boundary`);
});

test("TDD: resolveMovement blocks movement into café counter obstacle", () => {
  const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  const obstacles = [{ minX: -2, maxX: 2, minZ: -3, maxZ: -1 }]; // Bar counter
  const current = { x: 0, y: 0, z: 0 }; // Standing in front of counter at z=0

  // Walking straight forward towards z = -2 (inside counter)
  const next = resolveMovement(
    current,
    { x: 0, z: -1 },
    3,
    0.5,
    obstacles,
    bounds,
    0.4
  );

  // Should be blocked in Z or slide along X
  assert.ok(
    next.z >= obstacles[0].maxZ + 0.39,
    `Player z (${next.z}) should not enter counter maxZ (${obstacles[0].maxZ})`
  );
});

test("TDD: findActiveHotspot returns nearby interactive café zones", () => {
  // Center of room far from all hotspots
  const centerPos = { x: 0, y: 0, z: 2 };
  const noHotspot = findActiveHotspot(centerPos, MADRID_CAFE_HOTSPOTS);
  assert.equal(noHotspot, null);

  // Walk up to Barista Mateo's counter (e.g. near position 0, 0, -1.8)
  const mateo = MADRID_CAFE_HOTSPOTS.find((h) => h.id === "barista_mateo");
  assert.ok(mateo, "Mateo hotspot must exist");

  const nearMateoPos = {
    x: mateo.position.x,
    y: 0,
    z: mateo.position.z + 0.8, // within interaction radius of 2.0
  };
  const activeHotspot = findActiveHotspot(nearMateoPos, MADRID_CAFE_HOTSPOTS);
  assert.ok(activeHotspot);
  assert.equal(activeHotspot.id, "barista_mateo");
  assert.equal(activeHotspot.npcName, "Mateo");
});

test("TDD: MADRID_CAFE_HOTSPOTS contains full language learning curricula", () => {
  const requiredHotspots = ["barista_mateo", "pastry_case", "coffee_board", "pos_register", "terrace_table"];
  
  for (const id of requiredHotspots) {
    const spot = MADRID_CAFE_HOTSPOTS.find((h) => h.id === id);
    assert.ok(spot, `Hotspot '${id}' must be configured in Madrid café`);
    assert.ok(spot.title.length > 0, `Hotspot '${id}' must have a title`);
    assert.ok(spot.spanishPhrases.length > 0, `Hotspot '${id}' must contain practice Spanish phrases`);
    assert.ok(spot.vocabulary.length > 0, `Hotspot '${id}' must have vocabulary items`);
  }
});
