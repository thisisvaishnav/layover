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

export interface AimDirection {
  direction: Vector2D; // Normalized unit vector in world ground plane
  angle: number;       // Facing angle in radians towards target (0 = +Z, π/2 = +X)
  distance: number;    // Distance from player to target
}

/**
 * Calculates facing vectors (forward, backward, right, left) for a given rotation angle.
 */
export function calculateFacingVectors(rotation: number): {
  forward: Vector2D;
  backward: Vector2D;
  right: Vector2D;
  left: Vector2D;
} {
  const fx = Math.sin(rotation);
  const fz = Math.cos(rotation);
  return {
    forward: { x: fx, z: fz },
    backward: { x: -fx, z: -fz },
    right: { x: fz, z: -fx },
    left: { x: -fz, z: fx },
  };
}

/**
 * Calculates world-space aim direction from player to cursor.
 * Returns null if distance is within deadzone or invalid to prevent jitter and NaN.
 */
export function calculateAimDirection(
  playerPos: Vector2D,
  cursorWorldPos: Vector2D,
  deadzone: number = 0.2
): AimDirection | null {
  const dx = cursorWorldPos.x - playerPos.x;
  const dz = cursorWorldPos.z - playerPos.z;
  const dist = Math.hypot(dx, dz);

  if (Number.isNaN(dist) || dist <= deadzone) {
    return null;
  }

  const normX = dx / dist;
  const normZ = dz / dist;
  const angle = Math.atan2(dx, dz);

  return {
    direction: { x: normX, z: normZ },
    angle,
    distance: dist,
  };
}

/**
 * Smoothly updates player rotation to face towards the cursor world position.
 * Does not rotate if cursor is null or in deadzone.
 * Mouse aiming alone does NOT move the player.
 */
export function updatePlayerMouseAim(
  currentState: PlayerState,
  cursorWorldPos: Vector2D | null,
  deltaSeconds: number,
  smoothingSpeed: number = 18.0
): PlayerState {
  if (!cursorWorldPos) {
    return currentState;
  }

  const aim = calculateAimDirection(currentState.position, cursorWorldPos);
  if (!aim) {
    return currentState;
  }

  const angleDiff = shortestAngleDiff(currentState.rotation, aim.angle);
  const rotStep = angleDiff * (1 - Math.exp(-smoothingSpeed * Math.min(deltaSeconds, 0.1)));
  let newRotation = currentState.rotation + rotStep;
  newRotation = ((newRotation + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  return {
    ...currentState,
    rotation: newRotation,
  };
}

/**
 * Updates player movement from keyboard input (Arrow keys / WASD).
 *
 * In Mouse-Direction Mode (when cursorWorldPos is provided):
 * - Mouse cursor position on screen/ground determines the player's facing direction.
 * - Up Arrow (↑) / W: Moves forward in direction of cursor.
 * - Down Arrow (↓) / S: Moves backward relative to cursor direction while maintaining facing toward cursor.
 * - Left Arrow (←) / A: Strafes left relative to cursor direction.
 * - Right Arrow (→) / D: Strafes right relative to cursor direction.
 * - Combined inputs (diagonals): Normalized so diagonal speed is identical to straight.
 * - Smooth rotation to track cursor without sudden snapping.
 * - Priority: Keyboard immediately overrides and cancels any click-to-move destination.
 *
 * In Fallback/Legacy Mode (when cursorWorldPos is undefined):
 * - Arrow keys move in cardinal world axes with rotation facing the movement direction.
 */
export function updatePlayerKeyboard(
  currentState: PlayerState,
  input: KeyboardInput,
  deltaSeconds: number,
  bounds: MapBounds,
  padding: number = 0.8,
  cursorWorldPos?: Vector2D | null
): PlayerState {
  const uFwd = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const uStrafe = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const isInputActive = uFwd !== 0 || uStrafe !== 0;

  // Key release / no input active: stop immediately with IDLE state
  if (!isInputActive) {
    let idleRotation = currentState.rotation;
    if (cursorWorldPos) {
      const aim = calculateAimDirection(currentState.position, cursorWorldPos);
      if (aim) {
        const angleDiff = shortestAngleDiff(idleRotation, aim.angle);
        const rotStep = angleDiff * (1 - Math.exp(-18.0 * Math.min(deltaSeconds, 0.1)));
        idleRotation = ((idleRotation + rotStep + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      }
    }
    return {
      ...currentState,
      rotation: idleRotation,
      movementState: "IDLE",
      isMoving: false,
      target: null, // Do not resume old destination
    };
  }

  // 1. Mouse-Direction Locomotion Mode (cursorWorldPos is provided)
  if (cursorWorldPos !== undefined) {
    let currentRot = currentState.rotation;
    let forwardDir: Vector2D;
    let rightDir: Vector2D;

    if (cursorWorldPos) {
      const aim = calculateAimDirection(currentState.position, cursorWorldPos);
      if (aim) {
        // Smooth shortest-path rotation toward cursor
        const angleDiff = shortestAngleDiff(currentRot, aim.angle);
        const rotStep = angleDiff * (1 - Math.exp(-18.0 * Math.min(deltaSeconds, 0.1)));
        currentRot = ((currentRot + rotStep + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

        // Move forward along cursor aim direction
        forwardDir = aim.direction;
        rightDir = { x: aim.direction.z, z: -aim.direction.x };
      } else {
        // Inside deadzone: maintain current facing
        const vectors = calculateFacingVectors(currentRot);
        forwardDir = vectors.forward;
        rightDir = vectors.right;
      }
    } else {
      // cursorWorldPos was null (e.g. outside playable bounds or sky)
      const vectors = calculateFacingVectors(currentRot);
      forwardDir = vectors.forward;
      rightDir = vectors.right;
    }

    // Combined movement vector: forwardDir * uFwd + rightDir * uStrafe
    const moveX = forwardDir.x * uFwd + rightDir.x * uStrafe;
    const moveZ = forwardDir.z * uFwd + rightDir.z * uStrafe;
    const moveMag = Math.hypot(moveX, moveZ);
    let normX = 0;
    let normZ = 0;
    if (moveMag > 1e-5) {
      normX = moveX / moveMag;
      normZ = moveZ / moveMag;
    }

    const moveDist = currentState.speed * deltaSeconds;
    const posX = currentState.position.x + normX * moveDist;
    const posZ = currentState.position.z + normZ * moveDist;

    // Clamp safely inside map boundaries
    const clamped = clampPositionToBounds({ x: posX, z: posZ }, bounds, padding);

    return {
      ...currentState,
      position: clamped,
      rotation: currentRot,
      target: null, // Keyboard immediately cancels click-to-move target
      movementState: "MOVING",
      isMoving: true,
    };
  }

  // 2. Legacy / Fallback Mode (cursorWorldPos is omitted)
  let dirX = 0;
  let dirZ = 0;
  if (input.forward) dirZ += 1;
  if (input.backward) dirZ -= 1;
  if (input.left) dirX -= 1;
  if (input.right) dirX += 1;

  const inputMag = Math.hypot(dirX, dirZ);
  const normX = dirX / inputMag;
  const normZ = dirZ / inputMag;

  // Smooth rotation to face the exact movement direction
  const targetAngle = Math.atan2(normX, normZ);
  const angleDiff = shortestAngleDiff(currentState.rotation, targetAngle);
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
    target: null,
    movementState: "MOVING",
    isMoving: true,
  };
}

