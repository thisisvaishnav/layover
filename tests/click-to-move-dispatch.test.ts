import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import {
  createPlayerState,
  setPlayerDestination,
  updatePlayerMovement,
  updatePlayerMovementState,
  selectMovementUpdate,
  DEFAULT_MOVEMENT_CONFIG,
  DEFAULT_PLAYER_SPEED,
  ARRIVAL_THRESHOLD,
  type KeyboardInput,
  type PlayerState,
} from "../src/player/movement-controller";

const IDLE_INPUT: KeyboardInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

// Mirrors the WorldCanvas frame dispatch (keyboard / click-to-move / idle).
function stepFrame(
  player: PlayerState,
  input: KeyboardInput,
  map: ReturnType<typeof generateMap>,
  camera: THREE.PerspectiveCamera,
  dt: number
): PlayerState {
  const horizontalSpeed = Math.hypot(player.velocity.x, player.velocity.z);
  const mode = selectMovementUpdate(player, input, horizontalSpeed);

  if (mode === "KEYBOARD") {
    return updatePlayerMovementState(
      player,
      input,
      camera,
      dt,
      map.bounds,
      0.8,
      DEFAULT_MOVEMENT_CONFIG
    );
  }
  if (mode === "CLICK_TO_MOVE") {
    return updatePlayerMovement(player, dt, map.bounds, 0.8);
  }
  if (player.isMoving && !player.target) {
    return {
      ...player,
      movementState: "IDLE",
      isMoving: false,
      velocity: { x: 0, y: player.verticalVelocity, z: 0 },
    };
  }
  return player;
}

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
  camera.position.set(0, 15, -20);
  camera.lookAt(0, 1.4, 0);
  camera.updateMatrixWorld();
  return camera;
}

test("TDD 28: Selector keeps click-to-move travel off the keyboard updater", () => {
  const travelling = createPlayerState({
    position: { x: 0, y: 0, z: 0 },
    target: { x: 40, z: 40 },
    isMoving: true,
    velocity: { x: 10, y: 0, z: 10 },
  });

  // Regression: click-to-move writes ~14.11 u/s, which must not route back
  // into updatePlayerMovementState (it zeroes velocity and clears target).
  assert.equal(selectMovementUpdate(travelling, IDLE_INPUT, 14.11), "CLICK_TO_MOVE");
  assert.equal(selectMovementUpdate(travelling, IDLE_INPUT, 0), "CLICK_TO_MOVE");
  assert.equal(selectMovementUpdate(travelling, IDLE_INPUT, 0.06), "CLICK_TO_MOVE");
});

test("TDD 29: Selector routes keyboard, aiming, coasting and idle frames correctly", () => {
  const idle = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  const pressingW: KeyboardInput = { ...IDLE_INPUT, forward: true };
  const aiming: KeyboardInput = { ...IDLE_INPUT, aiming: true };

  assert.equal(selectMovementUpdate(idle, pressingW, 0), "KEYBOARD");
  assert.equal(selectMovementUpdate(idle, aiming, 0), "KEYBOARD");
  // Residual keyboard velocity with no destination still coasts through the keyboard updater
  const coasting = { ...idle, velocity: { x: 3, y: 0, z: 0 }, isMoving: true };
  assert.equal(selectMovementUpdate(coasting, IDLE_INPUT, 0.4), "KEYBOARD");
  assert.equal(selectMovementUpdate(idle, IDLE_INPUT, 0), "IDLE");
});

test("TDD 30: Click-to-move survives the frame after the click and keeps travelling", () => {
  const map = generateMap();
  const camera = createCamera();
  const dt = 1 / 60;

  let player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  player = setPlayerDestination(player, { x: 40, z: 40 }, map.bounds);
  assert.ok(player.target, "Destination must be set by the click");

  const frames = 30;
  const expectedDistance = player.speed * dt * frames;
  for (let frame = 0; frame < frames; frame++) {
    player = stepFrame(player, IDLE_INPUT, map, camera, dt);
  }

  const travelled = Math.hypot(player.position.x, player.position.z);
  assert.ok(
    travelled > expectedDistance * 0.9,
    `Player must keep moving after the click (travelled ${travelled.toFixed(2)} units of ${expectedDistance.toFixed(2)}, target ${player.target ? "alive" : "wiped"})`
  );
  assert.ok(player.target, "Destination target must survive while travelling");
  assert.ok(player.isMoving);
  assert.ok(
    Math.abs(player.velocity.x) + Math.abs(player.velocity.z) > 1,
    "Click-to-move velocity must not be zeroed by the keyboard updater"
  );
});

test("TDD 31: Click-to-move reaches its destination", () => {
  const map = generateMap();
  const camera = createCamera();
  const dt = 1 / 60;

  let player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  player = setPlayerDestination(player, { x: 40, z: 40 }, map.bounds);
  const target = player.target!;

  let frames = 0;
  while (player.target && frames < 1200) {
    player = stepFrame(player, IDLE_INPUT, map, camera, dt);
    frames++;
  }

  assert.equal(player.target, null, "Player must arrive at the destination");
  assert.equal(player.isMoving, false);
  const remaining = Math.hypot(player.position.x - target.x, player.position.z - target.z);
  assert.ok(remaining <= ARRIVAL_THRESHOLD + 1e-6, `Arrival within threshold (left ${remaining})`);
});

test("TDD 32: Keyboard input still cancels an active click-to-move at dispatch time", () => {
  const map = generateMap();
  const camera = createCamera();
  const pressingW: KeyboardInput = { ...IDLE_INPUT, forward: true };

  let player = createPlayerState({ position: { x: 0, y: 0, z: 0 } });
  player = setPlayerDestination(player, { x: 40, z: 40 }, map.bounds);
  assert.ok(player.target);

  player = stepFrame(player, pressingW, map, camera, 1 / 60);

  assert.equal(player.target, null, "Keyboard input must cancel click-to-move");
  assert.equal(selectMovementUpdate(player, pressingW, DEFAULT_PLAYER_SPEED), "KEYBOARD");
});
