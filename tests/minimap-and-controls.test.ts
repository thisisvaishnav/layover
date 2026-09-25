import test from "node:test";
import assert from "node:assert/strict";
import { generateMap } from "../src/map/map-generator";
import {
  createPlayerState,
  updatePlayerKeyboard,
  type KeyboardInput,
} from "../src/player/movement-controller";
import {
  worldToMinimap,
  minimapToWorld,
  playerRotationToMinimapHeading,
  isInsideMinimapCircle,
  clampToMinimapCircle,
} from "../src/map/minimap-math";
import {
  createCameraController,
  MIN_CAMERA_DISTANCE,
  MAX_CAMERA_DISTANCE,
  DEFAULT_CAMERA_DISTANCE,
} from "../src/camera/camera-controller";
import * as THREE from "three";

// ==========================================
// 1. PLAYER CONTROLS — RESPONSIVENESS & STATES
// ==========================================

test("TDD [Movement State]: Transitions from IDLE to MOVING on key press and back to IDLE on release", () => {
  const map = generateMap();
  const initial = createPlayerState({ position: { x: 0, z: 0 } });
  assert.equal(initial.movementState, "IDLE", "Initial state must be IDLE");
  assert.equal(initial.isMoving, false);

  // Press ArrowUp
  const inputActive: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  const movingState = updatePlayerKeyboard(initial, inputActive, 0.016, map.bounds);
  assert.equal(movingState.movementState, "MOVING", "Key pressed must transition to MOVING");
  assert.equal(movingState.isMoving, true);

  // Release all keys
  const inputReleased: KeyboardInput = { forward: false, backward: false, left: false, right: false };
  const stoppedState = updatePlayerKeyboard(movingState, inputReleased, 0.016, map.bounds);
  assert.equal(stoppedState.movementState, "IDLE", "Key release must transition to IDLE");
  assert.equal(stoppedState.isMoving, false);
});

test("TDD [Movement Stopping]: Player stops quickly with minimal deceleration and does not slide", () => {
  const map = generateMap();
  const initial = createPlayerState({ position: { x: 0, z: 0 } });
  const inputActive: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  // Move for 0.5s
  let state = initial;
  for (let i = 0; i < 30; i++) {
    state = updatePlayerKeyboard(state, inputActive, 0.016, map.bounds);
  }
  const posAtRelease = { ...state.position };

  // Release key and run a few frames
  const inputNone: KeyboardInput = { forward: false, backward: false, left: false, right: false };
  for (let i = 0; i < 10; i++) {
    state = updatePlayerKeyboard(state, inputNone, 0.016, map.bounds);
  }

  // Position change after release must be near-instant stop (less than 0.15 units)
  const slideDistance = Math.hypot(state.position.x - posAtRelease.x, state.position.z - posAtRelease.z);
  assert.ok(slideDistance < 0.15, `Player slid ${slideDistance} units after release, expected < 0.15 units (no slide)`);
  assert.equal(state.isMoving, false);
});

// ==========================================
// 2. CARDINAL & DIAGONAL MOVEMENT
// ==========================================

test("TDD [Cardinal Movement]: Arrow keys move in correct 3D world directions", () => {
  const map = generateMap();
  const origin = createPlayerState({ position: { x: 0, z: 0 } });

  // Up (Forward) -> +Z
  const up = updatePlayerKeyboard(origin, { forward: true, backward: false, left: false, right: false }, 0.1, map.bounds);
  assert.ok(up.position.z > 0, "Forward must increase Z");
  assert.equal(up.position.x, 0);

  // Down (Backward) -> -Z
  const down = updatePlayerKeyboard(origin, { forward: false, backward: true, left: false, right: false }, 0.1, map.bounds);
  assert.ok(down.position.z < 0, "Backward must decrease Z");
  assert.equal(down.position.x, 0);

  // Left -> -X
  const left = updatePlayerKeyboard(origin, { forward: false, backward: false, left: true, right: false }, 0.1, map.bounds);
  assert.ok(left.position.x < 0, "Left must decrease X");
  assert.equal(left.position.z, 0);

  // Right -> +X
  const right = updatePlayerKeyboard(origin, { forward: false, backward: false, left: false, right: true }, 0.1, map.bounds);
  assert.ok(right.position.x > 0, "Right must increase X");
  assert.equal(right.position.z, 0);
});

test("TDD [Diagonal Normalization]: Diagonal movement is not faster than straight movement", () => {
  const map = generateMap();
  const origin = createPlayerState({ position: { x: 0, z: 0 }, speed: 6.0 });
  const dt = 0.1;

  // Straight: Up alone
  const straight = updatePlayerKeyboard(origin, { forward: true, backward: false, left: false, right: false }, dt, map.bounds);
  const straightDist = Math.hypot(straight.position.x, straight.position.z);

  // Diagonal: Up + Right
  const diagNE = updatePlayerKeyboard(origin, { forward: true, backward: false, left: false, right: true }, dt, map.bounds);
  const diagDistNE = Math.hypot(diagNE.position.x, diagNE.position.z);

  // Diagonal: Down + Left
  const diagSW = updatePlayerKeyboard(origin, { forward: false, backward: true, left: true, right: false }, dt, map.bounds);
  const diagDistSW = Math.hypot(diagSW.position.x, diagSW.position.z);

  assert.ok(Math.abs(diagDistNE - straightDist) < 0.01, `Diagonal NE distance (${diagDistNE}) must match straight (${straightDist})`);
  assert.ok(Math.abs(diagDistSW - straightDist) < 0.01, `Diagonal SW distance (${diagDistSW}) must match straight (${straightDist})`);
});

// ==========================================
// 3. PLAYER ROTATION & FACING DIRECTION
// ==========================================

test("TDD [Player Rotation]: Character smoothly faces the direction of movement for all directions", () => {
  const map = generateMap();
  const origin = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0 });

  // Moving forward (+Z): target angle is 0
  let state = origin;
  for (let i = 0; i < 20; i++) {
    state = updatePlayerKeyboard(state, { forward: true, backward: false, left: false, right: false }, 0.05, map.bounds);
  }
  assert.ok(Math.abs(state.rotation - 0) < 0.05, `Facing forward should be ~0 rad, got ${state.rotation}`);

  // Moving right (+X): target angle is π/2
  for (let i = 0; i < 20; i++) {
    state = updatePlayerKeyboard(state, { forward: false, backward: false, left: false, right: true }, 0.05, map.bounds);
  }
  assert.ok(Math.abs(state.rotation - Math.PI / 2) < 0.05, `Facing right should be ~π/2 rad, got ${state.rotation}`);

  // Moving backward (-Z): target angle is π or -π
  for (let i = 0; i < 20; i++) {
    state = updatePlayerKeyboard(state, { forward: false, backward: true, left: false, right: false }, 0.05, map.bounds);
  }
  assert.ok(Math.abs(Math.abs(state.rotation) - Math.PI) < 0.05, `Facing backward should be ~±π rad, got ${state.rotation}`);

  // Diagonal forward-left (+Z, -X): target angle is -π/4
  for (let i = 0; i < 20; i++) {
    state = updatePlayerKeyboard(state, { forward: true, backward: false, left: true, right: false }, 0.05, map.bounds);
  }
  assert.ok(Math.abs(state.rotation - (-Math.PI / 4)) < 0.05, `Facing forward-left should be ~-π/4 rad, got ${state.rotation}`);
});

// ==========================================
// 4. INPUT PRIORITY: ARROW KEYS VS CLICK-TO-MOVE
// ==========================================

test("TDD [Input Priority]: Arrow keys immediately cancel click destination and release does not resume it", () => {
  const map = generateMap();
  const initial = createPlayerState({
    position: { x: 0, z: 0 },
    target: { x: 80, z: 80 },
    isMoving: true,
  });

  // 1. Press arrow key while click-to-move is active
  const movingWithKey = updatePlayerKeyboard(
    initial,
    { forward: true, backward: false, left: false, right: false },
    0.05,
    map.bounds
  );
  assert.equal(movingWithKey.target, null, "Active click destination must be cancelled immediately");
  assert.equal(movingWithKey.movementState, "MOVING");

  // 2. Release arrow keys: player must stop and NOT resume old click destination
  const stopped = updatePlayerKeyboard(
    movingWithKey,
    { forward: false, backward: false, left: false, right: false },
    0.05,
    map.bounds
  );
  assert.equal(stopped.target, null, "Target must remain null upon key release");
  assert.equal(stopped.movementState, "IDLE");
  assert.equal(stopped.isMoving, false);
});

// ==========================================
// 5. DELTA TIME & MAP BOUNDARIES
// ==========================================

test("TDD [Delta Time]: Movement distance scales linearly with delta time", () => {
  const map = generateMap();
  const origin = createPlayerState({ position: { x: 0, z: 0 }, speed: 10 });
  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  const res1 = updatePlayerKeyboard(origin, input, 0.1, map.bounds);
  const res2 = updatePlayerKeyboard(origin, input, 0.2, map.bounds);

  assert.ok(Math.abs(res1.position.z - 1.0) < 0.05, `10 units/s * 0.1s should be ~1.0 unit, got ${res1.position.z}`);
  assert.ok(Math.abs(res2.position.z - 2.0) < 0.05, `10 units/s * 0.2s should be ~2.0 units, got ${res2.position.z}`);
});

test("TDD [Map Boundary Constraints]: Clamps player strictly inside map boundaries", () => {
  const map = generateMap();
  const { minX, maxX, minZ, maxZ } = map.bounds;

  // Extreme movement beyond bounds
  let state = createPlayerState({ position: { x: maxX - 1, z: maxZ - 1 } });
  state = updatePlayerKeyboard(state, { forward: true, backward: false, left: false, right: true }, 5.0, map.bounds);

  assert.ok(state.position.x <= maxX, "Player X must not exceed maxX");
  assert.ok(state.position.z <= maxZ, "Player Z must not exceed maxZ");
  assert.ok(state.position.x >= minX, "Player X must not be below minX");
  assert.ok(state.position.z >= minZ, "Player Z must not be below minZ");
});

// ==========================================
// 6. MINIMAP COORDINATE MAPPING & ROTATION
// ==========================================

test("TDD [Minimap Coordinates]: Accurately maps world position to circular minimap coordinates", () => {
  const map = generateMap();
  const minimapRadius = 90; // 180px diameter circle
  const centerWorld = { x: 0, z: 0 };

  // World center maps to minimap center (90, 90)
  const centerMinimap = worldToMinimap(centerWorld, map.bounds, minimapRadius);
  assert.ok(Math.abs(centerMinimap.x - minimapRadius) < 1.0, `Center X should be ~90, got ${centerMinimap.x}`);
  assert.ok(Math.abs(centerMinimap.y - minimapRadius) < 1.0, `Center Y should be ~90, got ${centerMinimap.y}`);

  // North (+Z) in world maps upward (smaller Y) on minimap
  const northWorld = { x: 0, z: 50 };
  const northMinimap = worldToMinimap(northWorld, map.bounds, minimapRadius);
  assert.ok(northMinimap.y < centerMinimap.y, "North (+Z) in world must map toward top of minimap (smaller Y)");

  // East (+X) in world maps rightward (larger X) on minimap
  const eastWorld = { x: 50, z: 0 };
  const eastMinimap = worldToMinimap(eastWorld, map.bounds, minimapRadius);
  assert.ok(eastMinimap.x > centerMinimap.x, "East (+X) in world must map toward right of minimap (larger X)");
});

test("TDD [Minimap Heading]: Converts 3D player rotation to fixed North-up minimap marker rotation", () => {
  // Facing North (+Z, rotation 0): marker points straight Up (0 radians)
  const headingNorth = playerRotationToMinimapHeading(0);
  assert.ok(Math.abs(headingNorth - 0) < 0.001, `Facing North should be 0 rad, got ${headingNorth}`);

  // Facing East (+X, rotation π/2): marker points Right (π/2 radians)
  const headingEast = playerRotationToMinimapHeading(Math.PI / 2);
  assert.ok(Math.abs(headingEast - Math.PI / 2) < 0.001, `Facing East should be π/2 rad, got ${headingEast}`);

  // Facing South (-Z, rotation π): marker points Down (π radians)
  const headingSouth = playerRotationToMinimapHeading(Math.PI);
  assert.ok(Math.abs(headingSouth - Math.PI) < 0.001, `Facing South should be π rad, got ${headingSouth}`);

  // Facing West (-X, rotation -π/2): marker points Left (-π/2 radians)
  const headingWest = playerRotationToMinimapHeading(-Math.PI / 2);
  assert.ok(Math.abs(headingWest - (-Math.PI / 2)) < 0.001, `Facing West should be -π/2 rad, got ${headingWest}`);
});

test("TDD [Minimap Bounds]: Correctly tests and clamps coordinates to circular boundary", () => {
  const center = { x: 90, y: 90 };
  const radius = 90;

  // Inside
  assert.equal(isInsideMinimapCircle({ x: 90, y: 90 }, center, radius), true);
  assert.equal(isInsideMinimapCircle({ x: 100, y: 100 }, center, radius), true);

  // Outside
  assert.equal(isInsideMinimapCircle({ x: 200, y: 200 }, center, radius), false);

  // Clamping outside point to perimeter
  const outside = { x: 250, y: 90 }; // 160 units from center, radius is 90
  const clamped = clampToMinimapCircle(outside, center, radius, 4.0); // 4px margin
  const distFromCenter = Math.hypot(clamped.x - center.x, clamped.y - center.y);
  assert.ok(distFromCenter <= radius - 4.0 + 0.01, `Clamped distance (${distFromCenter}) must be within radius margin`);
});

// ==========================================
// 7. CAMERA POLISH — PERSPECTIVE, FOLLOW & ZOOM
// ==========================================

test("TDD [Camera Perspective]: Uses comfortable elevated perspective framing character in lower-middle third", () => {
  const controller = createCameraController(1280, 800, { x: 0, z: 0 });

  // Verify camera distance defaults to comfortable Medium preset (~22m)
  assert.ok(DEFAULT_CAMERA_DISTANCE >= 18 && DEFAULT_CAMERA_DISTANCE <= 30, `Default distance (${DEFAULT_CAMERA_DISTANCE}) should be Medium preset`);

  // Update camera at origin
  controller.update({ x: 0, z: 0 }, 0.1);

  // Check camera height and elevation angle
  const camPos = controller.camera.position;
  assert.ok(camPos.y >= 6.0 && camPos.y <= 12.0, `Medium preset camera height should be elevated, got ${camPos.y.toFixed(2)}m`);
});

test("TDD [On Foot Presets]: Sits at shoulder-to-head height (1.5-1.7m) for close preset and elevates dynamically", () => {
  const controller = createCameraController(1280, 800, { x: 0, z: 0 });

  assert.ok(MIN_CAMERA_DISTANCE >= 4.0 && MIN_CAMERA_DISTANCE <= 7.0, "MIN_CAMERA_DISTANCE corresponds to Close preset");
  assert.ok(MAX_CAMERA_DISTANCE >= 50 && MAX_CAMERA_DISTANCE <= 75, "MAX_CAMERA_DISTANCE must prevent extreme far view");

  // 1. Close Preset: zoom to minimum distance
  controller.zoomBy(-100); // Zoom in to minimum
  for (let i = 0; i < 30; i++) controller.update({ x: 0, z: 0 }, 0.1);

  const closeHeight = controller.camera.position.y;
  assert.ok(
    closeHeight >= 1.5 && closeHeight <= 1.75,
    `Close preset height must sit at shoulder-to-head height (~1.5m to 1.7m), got ${closeHeight.toFixed(2)}m`
  );

  // 2. Medium Preset: default zoom
  controller.resetOrbit();
  for (let i = 0; i < 30; i++) controller.update({ x: 0, z: 0 }, 0.1);
  const mediumHeight = controller.camera.position.y;
  assert.ok(
    mediumHeight > closeHeight + 4.0,
    `Medium preset height (${mediumHeight.toFixed(2)}m) must dynamically elevate from close (${closeHeight.toFixed(2)}m)`
  );

  // 3. Far Preset: zoom to maximum distance
  controller.zoomBy(100); // Zoom out to maximum
  for (let i = 0; i < 30; i++) controller.update({ x: 0, z: 0 }, 0.1);
  const farHeight = controller.camera.position.y;
  assert.ok(
    farHeight > mediumHeight + 10.0,
    `Far preset height (${farHeight.toFixed(2)}m) must dynamically elevate from medium (${mediumHeight.toFixed(2)}m)`
  );
});

test("TDD [Camera Stability]: Walking does NOT automatically zoom the camera in or out", () => {
  const controller = createCameraController(1280, 800, { x: 0, z: 0 });
  controller.update({ x: 0, z: 0 }, 0.1);
  const distIdle = Math.hypot(controller.camera.position.x, controller.camera.position.z);

  // Simulate walking across 40 frames
  for (let i = 1; i <= 40; i++) {
    controller.update({ x: i * 0.2, z: i * 0.2 }, 0.05);
  }

  // Camera relative offset to player should remain constant (no automatic speed-based zoom)
  const playerPos = { x: 40 * 0.2, z: 40 * 0.2 };
  const distWalking = Math.hypot(
    controller.camera.position.x - playerPos.x,
    controller.camera.position.z - playerPos.z
  );

  assert.ok(
    Math.abs(distWalking - distIdle) < 1.0,
    `Relative camera distance while walking (${distWalking.toFixed(2)}) must match idle distance (${distIdle.toFixed(2)})`
  );
});

test("TDD [Minimap Inversion]: Correctly maps minimap pixel coordinates back to 3D world coordinates", () => {
  const map = generateMap();
  const originalWorld = { x: 35.5, z: -28.0 };
  const minimapPt = worldToMinimap(originalWorld, map.bounds, 90, 8, 1.0);
  const reconstructedWorld = minimapToWorld(minimapPt, map.bounds, 90, 8, 1.0);

  assert.ok(
    Math.abs(reconstructedWorld.x - originalWorld.x) < 0.1,
    `Reconstructed X (${reconstructedWorld.x}) should match original (${originalWorld.x})`
  );
  assert.ok(
    Math.abs(reconstructedWorld.z - originalWorld.z) < 0.1,
    `Reconstructed Z (${reconstructedWorld.z}) should match original (${originalWorld.z})`
  );
});

test("TDD [Camera Obstacle Clearance]: Pulls camera closer when obstacle is between camera and player", () => {
  const controller = createCameraController(1280, 800, { x: 0, z: 0 });

  // Update without obstacles first
  for (let i = 0; i < 30; i++) controller.update({ x: 0, z: 0 }, 0.1);
  const unobstructedDistance = Math.hypot(
    controller.camera.position.x,
    controller.camera.position.y - 1.62,
    controller.camera.position.z
  );

  // Place a tall obstacle directly behind the player where the camera sits
  // At default orbitYaw=0, camera is at -Z (South) looking North towards (0, 0, 0)
  const obstacleGeo = new THREE.BoxGeometry(10, 20, 4);
  const obstacleMat = new THREE.MeshBasicMaterial();
  const obstacleMesh = new THREE.Mesh(obstacleGeo, obstacleMat);
  obstacleMesh.position.set(0, 10, -8);
  obstacleMesh.updateMatrixWorld(true);

  // Update with obstacle in collisionObjects
  controller.update({ x: 0, z: 0 }, 0.1, 0, [obstacleMesh]);
  const obstructedDistance = Math.hypot(
    controller.camera.position.x,
    controller.camera.position.y - 1.62,
    controller.camera.position.z
  );

  assert.ok(
    obstructedDistance < unobstructedDistance - 2.0,
    `Obstructed camera distance (${obstructedDistance.toFixed(2)}) must be closer than unobstructed (${unobstructedDistance.toFixed(2)}) to avoid clipping`
  );
});

