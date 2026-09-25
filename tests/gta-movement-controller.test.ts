import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import {
  createPlayerState,
  updatePlayerMovementState,
  getCameraHorizontalVectors,
  getCameraRelativeDirection,
  updateGravity,
  getAnimationData,
  DEFAULT_MOVEMENT_CONFIG,
  type KeyboardInput,
  type PlayerState,
} from "../src/player/movement-controller";

// Helper to create camera oriented with given position and lookAt point
function createTestCamera(pos: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(target.x, target.y, target.z);
  camera.updateMatrixWorld();
  return camera;
}

// ==========================================
// 1. FREE-ROAM CAMERA-RELATIVE MOVEMENT
// ==========================================

test("TDD 1: W moves toward camera's horizontal forward direction", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  // Camera behind player looking North (+Z)
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  const next = updatePlayerMovementState(player, input, camera, 0.1, map.bounds);

  assert.ok(next.position.z > 0, "Pressing W must move forward in camera forward direction (+Z)");
  assert.ok(Math.abs(next.position.x) < 1e-4, "Should not drift horizontally on X");
});

test("TDD 2: S moves opposite camera forward", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  const input: KeyboardInput = { forward: false, backward: true, left: false, right: false };
  const next = updatePlayerMovementState(player, input, camera, 0.1, map.bounds);

  assert.ok(next.position.z < 0, "Pressing S must move backward (-Z)");
  assert.ok(Math.abs(next.position.x) < 1e-4, "Should not drift horizontally on X");
});

test("TDD 3: A moves camera-relative left", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  const input: KeyboardInput = { forward: false, backward: false, left: true, right: false };
  const next = updatePlayerMovementState(player, input, camera, 0.1, map.bounds);

  assert.ok(next.position.x < 0, "Pressing A must move camera-relative left (-X)");
  assert.ok(Math.abs(next.position.z) < 1e-4, "Should not drift on Z");
});

test("TDD 4: D moves camera-relative right", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  const input: KeyboardInput = { forward: false, backward: false, left: false, right: true };
  const next = updatePlayerMovementState(player, input, camera, 0.1, map.bounds);

  assert.ok(next.position.x > 0, "Pressing D must move camera-relative right (+X)");
  assert.ok(Math.abs(next.position.z) < 1e-4, "Should not drift on Z");
});

test("TDD 5: W+D produces normalized diagonal movement", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  const inputWD: KeyboardInput = { forward: true, backward: false, left: false, right: true };
  const nextWD = updatePlayerMovementState(player, inputWD, camera, 0.1, map.bounds);

  assert.ok(nextWD.position.x > 0, "X must increase on W+D");
  assert.ok(nextWD.position.z > 0, "Z must increase on W+D");
  assert.ok(Math.abs(nextWD.position.x - nextWD.position.z) < 1e-4, "W+D must be symmetric along diagonal");
});

// ==========================================
// 2. FREE-ROAM ROTATION & NO STRAFING
// ==========================================

test("TDD 6: Character rotates toward movement direction in FREE_ROAM", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  // Move right (+X East) -> character should rotate toward π/2 (East)
  const inputD: KeyboardInput = { forward: false, backward: false, left: false, right: true };
  let state = player;
  for (let i = 0; i < 20; i++) {
    state = updatePlayerMovementState(state, inputD, camera, 0.05, map.bounds);
  }

  assert.ok(
    Math.abs(state.rotation - Math.PI / 2) < 0.05,
    `Character must turn East (~π/2), got ${state.rotation}`
  );

  // Move left (-X West) -> character should turn toward -π/2 (West)
  const inputA: KeyboardInput = { forward: false, backward: false, left: true, right: false };
  for (let i = 0; i < 25; i++) {
    state = updatePlayerMovementState(state, inputA, camera, 0.05, map.bounds);
  }

  assert.ok(
    Math.abs(state.rotation - (-Math.PI / 2)) < 0.05,
    `Character must turn West (~-π/2), got ${state.rotation}`
  );
});

test("TDD 7: Character does not rotate while idle in FREE_ROAM", () => {
  const map = generateMap();
  const facingWest = -Math.PI / 2;
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: facingWest });
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });

  const inputIdle: KeyboardInput = { forward: false, backward: false, left: false, right: false };
  const next = updatePlayerMovementState(player, inputIdle, camera, 0.1, map.bounds);

  assert.equal(next.rotation, facingWest, "Character must retain last facing direction when standing still");
  assert.equal(next.isMoving, false);
});

test("TDD 8: Camera pitch does not affect movement Y", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  // Camera elevated steeply overhead (y = 40, looking down)
  const steepCamera = createTestCamera({ x: 0, y: 40, z: -10 }, { x: 0, y: 0, z: 0 });

  const inputW: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  const next = updatePlayerMovementState(player, inputW, steepCamera, 0.1, map.bounds);

  assert.equal(next.position.y, 0, "Horizontal movement must NOT affect vertical Y position");
  assert.ok(next.position.z > 0, "Horizontal movement must proceed along ground XZ");
});

test("TDD 9: Rotating the camera changes movement direction", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });

  // Camera looking East (+X)
  const cameraFacingEast = createTestCamera({ x: -20, y: 15, z: 0 }, { x: 0, y: 1.4, z: 0 });
  const inputW: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  const next = updatePlayerMovementState(player, inputW, cameraFacingEast, 0.1, map.bounds);
  assert.ok(next.position.x > 0, "W with camera facing East must move East (+X)");
  assert.ok(Math.abs(next.position.z) < 1e-4, "Should not move Z when camera faces purely East");
});

// ==========================================
// 3. AIMING STATE & STRAFING
// ==========================================

test("TDD 10: Character faces camera yaw when AIMING is active", () => {
  const map = generateMap();
  // Camera facing East (+X, yaw = π/2)
  const cameraEast = createTestCamera({ x: -20, y: 15, z: 0 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  const inputIdle: KeyboardInput = { forward: false, backward: false, left: false, right: false, aiming: true };
  let state = player;
  for (let i = 0; i < 20; i++) {
    state = updatePlayerMovementState(state, inputIdle, cameraEast, 0.05, map.bounds);
  }

  assert.ok(
    Math.abs(state.rotation - Math.PI / 2) < 0.05,
    `In AIMING, character must lock to camera yaw (~π/2), got ${state.rotation}`
  );
});

test("TDD 11: In AIMING: W moves forward while maintaining camera-facing rotation", () => {
  const map = generateMap();
  const cameraNorth = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  const inputW: KeyboardInput = { forward: true, backward: false, left: false, right: false, aiming: true };
  const next = updatePlayerMovementState(player, inputW, cameraNorth, 0.1, map.bounds);

  assert.ok(next.position.z > 0, "W moves North");
  assert.ok(Math.abs(next.rotation - 0) < 0.05, "Character must maintain camera-facing rotation");
});

test("TDD 12: In AIMING: S moves backward while maintaining camera-facing rotation", () => {
  const map = generateMap();
  const cameraNorth = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  const inputS: KeyboardInput = { forward: false, backward: true, left: false, right: false, aiming: true };
  const next = updatePlayerMovementState(player, inputS, cameraNorth, 0.1, map.bounds);

  assert.ok(next.position.z < 0, "S moves South (backward)");
  assert.ok(
    Math.abs(next.rotation - 0) < 0.05,
    `Character must NOT turn backward, should keep facing camera (0), got ${next.rotation}`
  );
});

test("TDD 13: In AIMING: A strafes left while maintaining camera-facing rotation", () => {
  const map = generateMap();
  const cameraNorth = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  const inputA: KeyboardInput = { forward: false, backward: false, left: true, right: false, aiming: true };
  const next = updatePlayerMovementState(player, inputA, cameraNorth, 0.1, map.bounds);

  assert.ok(next.position.x < 0, "A strafes left (-X)");
  assert.ok(Math.abs(next.rotation - 0) < 0.05, "Must keep facing camera North");
});

test("TDD 14: In AIMING: D strafes right while maintaining camera-facing rotation", () => {
  const map = generateMap();
  const cameraNorth = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  const inputD: KeyboardInput = { forward: false, backward: false, left: false, right: true, aiming: true };
  const next = updatePlayerMovementState(player, inputD, cameraNorth, 0.1, map.bounds);

  assert.ok(next.position.x > 0, "D strafes right (+X)");
  assert.ok(Math.abs(next.rotation - 0) < 0.05, "Must keep facing camera North");
});

test("TDD 15: In AIMING: W+A produces diagonal strafe movement while maintaining camera facing", () => {
  const map = generateMap();
  const cameraNorth = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  const inputWA: KeyboardInput = { forward: true, backward: false, left: true, right: false, aiming: true };
  const next = updatePlayerMovementState(player, inputWA, cameraNorth, 0.1, map.bounds);

  assert.ok(next.position.x < 0, "Diagonal strafe left (-X)");
  assert.ok(next.position.z > 0, "Diagonal move forward (+Z)");
  assert.ok(Math.abs(next.rotation - 0) < 0.05, "Character must keep facing camera");
});

test("TDD 16: Character does not rotate toward movement direction while aiming", () => {
  const map = generateMap();
  const cameraNorth = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  // Move purely right (D). In free-roam this would face East (π/2), but in AIMING it must face North (0)
  const inputD: KeyboardInput = { forward: false, backward: false, left: false, right: true, aiming: true };
  let state = player;
  for (let i = 0; i < 20; i++) {
    state = updatePlayerMovementState(state, inputD, cameraNorth, 0.05, map.bounds);
  }

  assert.ok(
    Math.abs(state.rotation - 0) < 0.05,
    `Character must remain facing camera (0), not movement direction, got ${state.rotation}`
  );
});

test("TDD 17: In AIMING: Rotating camera changes character facing", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, y: 0, z: 0 }, rotation: 0, movementMode: "AIMING" });

  // Camera rotated to face South (-Z, yaw = π)
  const cameraSouth = createTestCamera({ x: 0, y: 15, z: 20 }, { x: 0, y: 1.4, z: 0 });
  const input: KeyboardInput = { forward: false, backward: false, left: false, right: false, aiming: true };

  let state = player;
  for (let i = 0; i < 25; i++) {
    state = updatePlayerMovementState(state, input, cameraSouth, 0.05, map.bounds);
  }

  assert.ok(
    Math.abs(Math.abs(state.rotation) - Math.PI) < 0.05,
    `Character must align with South-facing camera (~±π), got ${state.rotation}`
  );
});

// ==========================================
// 4. STATE TRANSITIONS & INPUT PRIORITY
// ==========================================

test("TDD 18: State transition: FREE_ROAM -> AIMING", () => {
  const map = generateMap();
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const freeRoam = createPlayerState({ movementMode: "FREE_ROAM" });

  const inputAim: KeyboardInput = { forward: false, backward: false, left: false, right: false, aiming: true };
  const aimingState = updatePlayerMovementState(freeRoam, inputAim, camera, 0.05, map.bounds);

  assert.equal(aimingState.movementMode, "AIMING");
  assert.equal(aimingState.isAiming, true);
});

test("TDD 19: State transition: AIMING -> FREE_ROAM", () => {
  const map = generateMap();
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const aimingPlayer = createPlayerState({ movementMode: "AIMING", isAiming: true });

  const inputNoAim: KeyboardInput = { forward: false, backward: false, left: false, right: false, aiming: false };
  const freeRoamState = updatePlayerMovementState(aimingPlayer, inputNoAim, camera, 0.05, map.bounds);

  assert.equal(freeRoamState.movementMode, "FREE_ROAM");
  assert.equal(freeRoamState.isAiming, false);
});

test("TDD 20: Keyboard movement overrides click-to-move", () => {
  const map = generateMap();
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const clickState = createPlayerState({
    position: { x: 0, y: 0, z: 0 },
    target: { x: 40, z: 40 },
    isMoving: true,
  });

  const inputW: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  const overridden = updatePlayerMovementState(clickState, inputW, camera, 0.05, map.bounds);

  assert.equal(overridden.target, null, "Keyboard input must cancel active click-to-move target");
  assert.equal(overridden.isMoving, true);
});

// ==========================================
// 5. NORMALIZATION, SPEED, & DELTA TIME
// ==========================================

test("TDD 21: Movement remains frame-rate independent", () => {
  const map = generateMap();
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const inputW: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  // 1 large step (0.1s) vs 2 small steps (0.05s x 2)
  const origin = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const stepLarge = updatePlayerMovementState(origin, inputW, camera, 0.1, map.bounds);

  let stepSmall = origin;
  stepSmall = updatePlayerMovementState(stepSmall, inputW, camera, 0.05, map.bounds);
  stepSmall = updatePlayerMovementState(stepSmall, inputW, camera, 0.05, map.bounds);

  assert.ok(
    Math.abs(stepLarge.position.z - stepSmall.position.z) < 0.05,
    `Distance should be consistent across frame rates (large: ${stepLarge.position.z}, small: ${stepSmall.position.z})`
  );
});

test("TDD 22: Diagonal movement is normalized (not faster than cardinal)", () => {
  const map = generateMap();
  const camera = createTestCamera({ x: 0, y: 15, z: -20 }, { x: 0, y: 1.4, z: 0 });
  const dt = 0.1;

  const origin = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const straightW = updatePlayerMovementState(
    origin,
    { forward: true, backward: false, left: false, right: false },
    camera,
    dt,
    map.bounds
  );
  const straightDist = Math.hypot(straightW.position.x, straightW.position.z);

  const diagWD = updatePlayerMovementState(
    origin,
    { forward: true, backward: false, left: false, right: true },
    camera,
    dt,
    map.bounds
  );
  const diagDist = Math.hypot(diagWD.position.x, diagWD.position.z);

  assert.ok(
    Math.abs(diagDist - straightDist) < 1e-3,
    `Diagonal speed (${diagDist}) must match straight speed (${straightDist})`
  );
});

// ==========================================
// 6. PHYSICS & GRAVITY
// ==========================================

test("TDD 23: Gravity works when airborne", () => {
  const initialPos = { x: 0, y: 10, z: 0 }; // Dropped from 10m height
  const dt = 0.1;

  const result = updateGravity(initialPos, 0, false, dt, 0, DEFAULT_MOVEMENT_CONFIG);

  assert.ok(result.position.y < 10, "Airborne player must fall downward");
  assert.ok(result.verticalVelocity < 0, "Vertical velocity must become negative");
  assert.equal(result.isGrounded, false, "Player at 10m is not grounded");
});

test("TDD 24: Ground detection works correctly and clamps to surface", () => {
  const nearGroundPos = { x: 0, y: 0.1, z: 0 };
  const dt = 0.1;

  const result = updateGravity(nearGroundPos, -2.0, false, dt, 0, DEFAULT_MOVEMENT_CONFIG);

  assert.equal(result.position.y, 0, "Player must land on ground y = 0");
  assert.equal(result.isGrounded, true, "Player should be grounded");
  assert.ok(result.verticalVelocity <= 0, "Vertical velocity remains small downward stick value");
});
