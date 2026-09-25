import type { MapBounds } from "../map/map-generator";

export interface Vector2D {
  x: number;
  z: number;
}

export type MovementState = "IDLE" | "MOVING";

export interface PlayerState {
  position: Vector2D;
  target: Vector2D | null;
  rotation: number; // In radians (rotation around Y-axis)
  movementState: MovementState;
  isMoving: boolean;
  speed: number;    // World units per second
}

export const DEFAULT_PLAYER_SPEED = 6.0; // Responsive, brisk walking pace
export const ARRIVAL_THRESHOLD = 0.05;   // Distance at which player stops

export interface KeyboardInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Creates initial player state at specified or default origin.
 */
export function createPlayerState(
  custom?: Partial<PlayerState> & Partial<Vector2D>
): PlayerState {
  const x = custom?.position?.x ?? custom?.x ?? 0;
  const z = custom?.position?.z ?? custom?.z ?? 0;
  const isMoving = custom?.isMoving ?? (custom?.movementState === "MOVING");
  const movementState: MovementState = custom?.movementState ?? (isMoving ? "MOVING" : "IDLE");

  return {
    position: { x, z },
    target: custom?.target ?? null,
    rotation: custom?.rotation ?? 0,
    movementState,
    isMoving,
    speed: custom?.speed ?? DEFAULT_PLAYER_SPEED,
  };
}

/**
 * Clamps a 2D position within map boundaries with an optional boundary padding margin.
 */
export function clampPositionToBounds(
  pos: Vector2D,
  bounds: MapBounds,
  padding: number = 0.8
): Vector2D {
  const minX = bounds.minX + padding;
  const maxX = bounds.maxX - padding;
  const minZ = bounds.minZ + padding;
  const maxZ = bounds.maxZ - padding;

  return {
    x: Math.max(minX, Math.min(maxX, pos.x)),
    z: Math.max(minZ, Math.min(maxZ, pos.z)),
  };
}

/**
 * Computes shortest angle difference in [-PI, PI].
 */
export function shortestAngleDiff(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

/**
 * Calculates facing angle (in radians) towards a target.
 */
export function calculateRotation(current: Vector2D, target: Vector2D): number {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  return Math.atan2(dx, dz);
}

/**
 * Sets a new movement destination clamped safely within map boundaries.
 */
export function setPlayerDestination(
  currentState: PlayerState,
  rawTarget: Vector2D,
  bounds: MapBounds,
  padding: number = 0.8
): PlayerState {
  const clampedTarget = clampPositionToBounds(rawTarget, bounds, padding);
  const dx = clampedTarget.x - currentState.position.x;
  const dz = clampedTarget.z - currentState.position.z;
  const dist = Math.hypot(dx, dz);

  if (dist <= ARRIVAL_THRESHOLD) {
    return {
      ...currentState,
      target: null,
      movementState: "IDLE",
      isMoving: false,
    };
  }

  return {
    ...currentState,
    target: clampedTarget,
    movementState: "MOVING",
    isMoving: true,
  };
}

/**
 * Updates player position and rotation toward click target based on delta time.
 */
export function updatePlayerMovement(
  currentState: PlayerState,
  deltaSeconds: number,
  bounds: MapBounds,
  padding: number = 0.8
): PlayerState {
  if (!currentState.isMoving || !currentState.target) {
    return {
      ...currentState,
      movementState: "IDLE",
      isMoving: false,
      target: null,
    };
  }

  const { position, target, speed, rotation } = currentState;
  const dx = target.x - position.x;
  const dz = target.z - position.z;
  const dist = Math.hypot(dx, dz);

  const stepDistance = speed * deltaSeconds;

  // Reached destination
  if (dist <= stepDistance || dist <= ARRIVAL_THRESHOLD) {
    return {
      ...currentState,
      position: { x: target.x, z: target.z },
      target: null,
      movementState: "IDLE",
      isMoving: false,
    };
  }

  // Move along vector towards destination
  const ratio = stepDistance / dist;
  const unverifiedX = position.x + dx * ratio;
  const unverifiedZ = position.z + dz * ratio;

  // Clamp to bounds to ensure player can never escape the playable area
  const clampedPos = clampPositionToBounds({ x: unverifiedX, z: unverifiedZ }, bounds, padding);

  // Smooth rotation interpolation toward target
  const desiredRotation = calculateRotation(position, target);
  const angleDiff = shortestAngleDiff(rotation, desiredRotation);
  const rotStep = Math.min(Math.abs(angleDiff), 16.0 * deltaSeconds) * Math.sign(angleDiff);
  let newRotation = rotation + rotStep;
  newRotation = ((newRotation + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  return {
    ...currentState,
    position: clampedPos,
    rotation: newRotation,
    movementState: "MOVING",
    isMoving: true,
  };
}

/**
 * Updates player movement from keyboard input (Arrow keys / WASD) with smooth, responsive locomotion.
 * - ArrowUp (forward) -> +Z
 * - ArrowDown (backward) -> -Z
 * - ArrowLeft (left) -> -X
 * - ArrowRight (right) -> +X
 * - Diagonal vectors are normalized so diagonal movement is not faster than straight.
 * - Smooth rotation to face the direction of movement (cardinal & diagonal).
 * - Immediate response on key press: IDLE -> MOVING.
 * - Immediate stop on key release: MOVING -> IDLE with minimal deceleration (no sliding).
 * - Priority: Keyboard immediately overrides and cancels any click-to-move destination.
 *   Releasing keys does NOT resume the old destination.
 */
export function updatePlayerKeyboard(
  currentState: PlayerState,
  input: KeyboardInput,
  deltaSeconds: number,
  bounds: MapBounds,
  padding: number = 0.8
): PlayerState {
  let dirX = 0;
  let dirZ = 0;
  if (input.forward) dirZ += 1;
  if (input.backward) dirZ -= 1;
  if (input.left) dirX -= 1;
  if (input.right) dirX += 1;

  const isInputActive = dirX !== 0 || dirZ !== 0;

  // Key release / no input active: stop immediately with IDLE state
  if (!isInputActive) {
    return {
      ...currentState,
      movementState: "IDLE",
      isMoving: false,
      target: null, // Do not resume old destination
    };
  }

  // Normalize input vector so diagonals move at exactly the same speed
  const inputMag = Math.hypot(dirX, dirZ);
  const normX = dirX / inputMag;
  const normZ = dirZ / inputMag;

  // Smooth rotation to face the exact movement direction
  const targetAngle = Math.atan2(normX, normZ);
  const angleDiff = shortestAngleDiff(currentState.rotation, targetAngle);
  // Snappy yet smooth angular easing (16 rad/s)
  const rotStep = angleDiff * (1 - Math.exp(-18.0 * deltaSeconds));
  let newRotation = currentState.rotation + rotStep;
  newRotation = ((newRotation + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  const moveDist = currentState.speed * deltaSeconds;
  const posX = currentState.position.x + normX * moveDist;
  const posZ = currentState.position.z + normZ * moveDist;

  // Clamp safely inside map boundaries
  const clamped = clampPositionToBounds({ x: posX, z: posZ }, bounds, padding);

  return {
    ...currentState,
    position: clamped,
    rotation: newRotation,
    target: null, // Keyboard immediately cancels click-to-move target
    movementState: "MOVING",
    isMoving: true,
  };
}
