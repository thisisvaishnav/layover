import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import {
  createPlayerState,
  updatePlayerKeyboard,
  calculateAimDirection,
  calculateFacingVectors,
  updatePlayerMouseAim,
  type KeyboardInput,
  type PlayerState,
} from "../src/player/movement-controller";
import {
  createRaycastHandler,
} from "../src/interaction/raycast-handler";

// ==========================================
// 1. MOUSE POSITION → WORLD-SPACE DIRECTION & RAYCAST
// ==========================================

test("TDD [Mouse Aim Direction]: Calculates accurate world-space direction, distance, and angle toward cursor", () => {
  const playerPos = { x: 0, z: 0 };

  // Cursor straight ahead (+Z)
  const aimNorth = calculateAimDirection(playerPos, { x: 0, z: 10 });
  assert.ok(aimNorth !== null, "Must return valid aim object");
  assert.ok(Math.abs(aimNorth.direction.x - 0) < 1e-4);
  assert.ok(Math.abs(aimNorth.direction.z - 1) < 1e-4);
  assert.ok(Math.abs(aimNorth.angle - 0) < 1e-4, "Angle facing +Z should be 0 rad");
  assert.equal(aimNorth.distance, 10);

  // Cursor to the right (+X)
  const aimEast = calculateAimDirection(playerPos, { x: 15, z: 0 });
  assert.ok(aimEast !== null);
  assert.ok(Math.abs(aimEast.direction.x - 1) < 1e-4);
  assert.ok(Math.abs(aimEast.direction.z - 0) < 1e-4);
  assert.ok(Math.abs(aimEast.angle - Math.PI / 2) < 1e-4, "Angle facing +X should be π/2 rad");
  assert.equal(aimEast.distance, 15);

  // Cursor to upper-right (45 deg)
  const aimNE = calculateAimDirection(playerPos, { x: 10, z: 10 });
  assert.ok(aimNE !== null);
  const expectedNorm = Math.SQRT1_2;
  assert.ok(Math.abs(aimNE.direction.x - expectedNorm) < 1e-4);
  assert.ok(Math.abs(aimNE.direction.z - expectedNorm) < 1e-4);
  assert.ok(Math.abs(aimNE.angle - Math.PI / 4) < 1e-4, "Angle facing upper-right should be π/4 rad");
});

test("TDD [Ground Raycasting]: Raycasts screen cursor position onto the ground plane accurately", () => {
  const raycastHandler = createRaycastHandler();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 20, -20);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const rect: DOMRect = {
    left: 0,
    top: 0,
    width: 800,
    height: 800,
    right: 800,
    bottom: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };

  // Center of screen (400, 400) should project directly to the lookAt point (0, 0, 0)
  const centerHit = raycastHandler.getGroundIntersection(400, 400, rect, camera);
  assert.ok(centerHit !== null, "Center screen should intersect ground");
  assert.ok(Math.abs(centerHit.x) < 0.1, `Expected X ~ 0, got ${centerHit.x}`);
  assert.ok(Math.abs(centerHit.z) < 0.1, `Expected Z ~ 0, got ${centerHit.z}`);
});

// ==========================================
// 2. CURSOR TO RIGHT / LEFT → PLAYER FACING RIGHT / LEFT
// ==========================================

test("TDD [Cursor Facing Right]: Cursor to the right turns player smoothly to face right", () => {
  const initial = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0 });
  const cursorRight = { x: 20, z: 0 }; // +X East

  // Over multiple frames, player smoothly rotates toward π/2 (right)
  let state = initial;
  for (let i = 0; i < 20; i++) {
    state = updatePlayerMouseAim(state, cursorRight, 0.05);
  }

  assert.ok(
    Math.abs(state.rotation - Math.PI / 2) < 0.05,
    `Player rotation should be close to π/2 rad, got ${state.rotation}`
  );
  // Mouse aim alone does NOT move the player
  assert.equal(state.isMoving, false);
  assert.equal(state.position.x, 0);
  assert.equal(state.position.z, 0);
});

test("TDD [Cursor Facing Left]: Cursor to the left turns player smoothly to face left", () => {
  const initial = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0 });
  const cursorLeft = { x: -20, z: 0 }; // -X West

  let state = initial;
  for (let i = 0; i < 20; i++) {
    state = updatePlayerMouseAim(state, cursorLeft, 0.05);
  }

  assert.ok(
    Math.abs(state.rotation - (-Math.PI / 2)) < 0.05,
    `Player rotation should be close to -π/2 rad, got ${state.rotation}`
  );
  assert.equal(state.isMoving, false);
  assert.equal(state.position.x, 0);
  assert.equal(state.position.z, 0);
});

// ==========================================
// 3. UP ARROW = MOVE TOWARD CURSOR DIRECTION
// ==========================================

test("TDD [Up Arrow Move Toward Cursor]: Up arrow moves forward in cursor direction, NOT fixed world axis", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, z: 0 }, speed: 6.0 });
  const upInput: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  // Case 1: Cursor is to the upper-right (+X, +Z)
  const cursorUpperRight = { x: 15, z: 15 };
  const movedNE = updatePlayerKeyboard(player, upInput, 0.1, map.bounds, 0.8, cursorUpperRight);
  assert.equal(movedNE.isMoving, true);
  assert.ok(movedNE.position.x > 0, "Up arrow toward upper-right cursor must increase X");
  assert.ok(movedNE.position.z > 0, "Up arrow toward upper-right cursor must increase Z");
  assert.ok(Math.abs(movedNE.position.x - movedNE.position.z) < 1e-3, "Should move symmetrically along diagonal");

  // Case 2: Cursor is to the left (-X, 0)
  const cursorLeft = { x: -20, z: 0 };
  const movedW = updatePlayerKeyboard(player, upInput, 0.1, map.bounds, 0.8, cursorLeft);
  assert.equal(movedW.isMoving, true);
  assert.ok(movedW.position.x < 0, "Up arrow toward left cursor must move -X");
  assert.ok(Math.abs(movedW.position.z) < 1e-3, "Up arrow toward left cursor must not move Z");
});

// ==========================================
// 4. DOWN ARROW = MOVE OPPOSITE CURSOR DIRECTION & RETAIN FACING
// ==========================================

test("TDD [Down Arrow Move Backward]: Down arrow moves backward relative to cursor while keeping facing toward cursor", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, z: 0 }, speed: 6.0 });
  const downInput: KeyboardInput = { forward: false, backward: true, left: false, right: false };

  // Cursor is to upper-right (10, 10)
  const cursorNE = { x: 10, z: 10 };
  const movedBack = updatePlayerKeyboard(player, downInput, 0.1, map.bounds, 0.8, cursorNE);

  assert.equal(movedBack.isMoving, true);
  assert.ok(movedBack.position.x < 0, "Down arrow must move opposite cursor X");
  assert.ok(movedBack.position.z < 0, "Down arrow must move opposite cursor Z");

  // Crucially: Player should retain facing toward the cursor (approx π/4), NOT flip 180 degrees backward
  assert.ok(
    Math.abs(movedBack.rotation - Math.PI / 4) < 0.2,
    `Player should face cursor (~π/4 rad), got ${movedBack.rotation}`
  );
});

// ==========================================
// 5. LEFT / RIGHT ARROWS = STRAFE RELATIVE TO CURSOR
// ==========================================

test("TDD [Left Right Strafing]: Left and Right arrows strafe sideways relative to cursor direction", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, z: 0 }, speed: 6.0 });

  // Scenario A: Cursor is ahead (+Z)
  const cursorAhead = { x: 0, z: 20 };
  const strafeRightA = updatePlayerKeyboard(
    player,
    { forward: false, backward: false, left: false, right: true },
    0.1,
    map.bounds,
    0.8,
    cursorAhead
  );
  assert.ok(strafeRightA.position.x > 0, "Strafing right when facing North must move +X");
  assert.ok(Math.abs(strafeRightA.position.z) < 1e-3);

  const strafeLeftA = updatePlayerKeyboard(
    player,
    { forward: false, backward: false, left: true, right: false },
    0.1,
    map.bounds,
    0.8,
    cursorAhead
  );
  assert.ok(strafeLeftA.position.x < 0, "Strafing left when facing North must move -X");
  assert.ok(Math.abs(strafeLeftA.position.z) < 1e-3);

  // Scenario B: Cursor is to the East (+X)
  const cursorEast = { x: 20, z: 0 };
  // Facing East: right strafe is South (-Z), left strafe is North (+Z)
  const strafeRightB = updatePlayerKeyboard(
    player,
    { forward: false, backward: false, left: false, right: true },
    0.1,
    map.bounds,
    0.8,
    cursorEast
  );
  assert.ok(strafeRightB.position.z < 0, "Strafing right when facing East must move -Z (South)");
  assert.ok(Math.abs(strafeRightB.position.x) < 1e-3);

  const strafeLeftB = updatePlayerKeyboard(
    player,
    { forward: false, backward: false, left: true, right: false },
    0.1,
    map.bounds,
    0.8,
    cursorEast
  );
  assert.ok(strafeLeftB.position.z > 0, "Strafing left when facing East must move +Z (North)");
  assert.ok(Math.abs(strafeLeftB.position.x) < 1e-3);
});

// ==========================================
// 6. COMBINED INPUT & DIAGONAL NORMALIZATION
// ==========================================

test("TDD [Diagonal Normalization]: Diagonal cursor-relative movement has identical speed to straight movement", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, z: 0 }, speed: 6.0 });
  const cursor = { x: 10, z: 15 };
  const dt = 0.1;

  // Straight Up
  const straight = updatePlayerKeyboard(
    player,
    { forward: true, backward: false, left: false, right: false },
    dt,
    map.bounds,
    0.8,
    cursor
  );
  const straightDist = Math.hypot(straight.position.x, straight.position.z);

  // Up + Right diagonal
  const diagNE = updatePlayerKeyboard(
    player,
    { forward: true, backward: false, left: false, right: true },
    dt,
    map.bounds,
    0.8,
    cursor
  );
  const diagDistNE = Math.hypot(diagNE.position.x, diagNE.position.z);

  // Down + Left diagonal
  const diagSW = updatePlayerKeyboard(
    player,
    { forward: false, backward: true, left: true, right: false },
    dt,
    map.bounds,
    0.8,
    cursor
  );
  const diagDistSW = Math.hypot(diagSW.position.x, diagSW.position.z);

  assert.ok(
    Math.abs(diagDistNE - straightDist) < 1e-3,
    `Diagonal NE distance (${diagDistNE}) must equal straight distance (${straightDist})`
  );
  assert.ok(
    Math.abs(diagDistSW - straightDist) < 1e-3,
    `Diagonal SW distance (${diagDistSW}) must equal straight distance (${straightDist})`
  );
});

// ==========================================
// 7. CAMERA INDEPENDENCE
// ==========================================

test("TDD [Camera Independence]: Ground intersection determines direction independent of camera forward vector", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, z: 0 } });
  const cursorGround = { x: 12, z: 5 };

  // Even if camera is elevated at steep angle or looking down, movement direction to cursor is in ground X/Z
  const moved = updatePlayerKeyboard(
    player,
    { forward: true, backward: false, left: false, right: false },
    0.1,
    map.bounds,
    0.8,
    cursorGround
  );

  const aim = calculateAimDirection(player.position, cursorGround);
  assert.ok(aim !== null);

  const moveDirX = moved.position.x / Math.hypot(moved.position.x, moved.position.z);
  const moveDirZ = moved.position.z / Math.hypot(moved.position.x, moved.position.z);

  assert.ok(
    Math.abs(moveDirX - aim.direction.x) < 1e-3,
    "Movement X direction must match ground-projected aim direction"
  );
  assert.ok(
    Math.abs(moveDirZ - aim.direction.z) < 1e-3,
    "Movement Z direction must match ground-projected aim direction"
  );
});

// ==========================================
// 8. CURSOR EDGE CASES & ROBUSTNESS
// ==========================================

test("TDD [Cursor Edge Cases]: Handles missing cursor, out-of-bounds, sky raycasts, and zero-distance gracefully", () => {
  const map = generateMap();
  const player = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0.5 });
  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  // 1. Null cursor (outside window / sky) -> uses current facing direction safely, no crash or NaN
  const movedNull = updatePlayerKeyboard(player, input, 0.1, map.bounds, 0.8, null);
  assert.ok(!Number.isNaN(movedNull.position.x));
  assert.ok(!Number.isNaN(movedNull.position.z));
  assert.ok(!Number.isNaN(movedNull.rotation));

  // 2. Cursor right on top of player (dist < deadzone) -> no NaN, no rotation jitter
  const movedZeroDist = updatePlayerKeyboard(player, input, 0.1, map.bounds, 0.8, { x: 0, z: 0 });
  assert.ok(!Number.isNaN(movedZeroDist.position.x));
  assert.ok(!Number.isNaN(movedZeroDist.rotation));

  // 3. calculateAimDirection on zero distance returns null (deadzone)
  const deadzoneAim = calculateAimDirection({ x: 5, z: 5 }, { x: 5, z: 5 });
  assert.equal(deadzoneAim, null, "Deadzone must safely return null without NaN");

  // 4. Sky raycast (pointing above horizon) returns null
  const raycastHandler = createRaycastHandler();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 5, 0);
  camera.lookAt(0, 100, 0); // Looking straight up into the sky!
  camera.updateMatrixWorld();

  const rect: DOMRect = { left: 0, top: 0, width: 800, height: 800, right: 800, bottom: 800, x: 0, y: 0, toJSON: () => ({}) };
  const skyHit = raycastHandler.getGroundIntersection(400, 400, rect, camera);
  assert.equal(skyHit, null, "Raycast pointing away from ground plane must return null");
});

// ==========================================
// 9. ARROW KEYS OVERRIDE CLICK-TO-MOVE
// ==========================================

test("TDD [Arrow Key Override]: Arrow keys immediately cancel click-to-move destination in mouse-direction mode", () => {
  const map = generateMap();
  const activeClickState = createPlayerState({
    position: { x: 0, z: 0 },
    target: { x: 50, z: 50 },
    isMoving: true,
  });

  const cursor = { x: -10, z: 20 };
  const movingWithArrow = updatePlayerKeyboard(
    activeClickState,
    { forward: true, backward: false, left: false, right: false },
    0.1,
    map.bounds,
    0.8,
    cursor
  );

  assert.equal(movingWithArrow.target, null, "Arrow key must cancel click destination target");
  assert.equal(movingWithArrow.movementState, "MOVING");
  assert.equal(movingWithArrow.isMoving, true);

  // Key release stops immediately and leaves target null
  const released = updatePlayerKeyboard(
    movingWithArrow,
    { forward: false, backward: false, left: false, right: false },
    0.1,
    map.bounds,
    0.8,
    cursor
  );
  assert.equal(released.target, null);
  assert.equal(released.movementState, "IDLE");
  assert.equal(released.isMoving, false);
});
