import * as THREE from "three";
import type { MapBounds } from "../map/map-generator";

export interface Vector2D {
  x: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type MovementState = "IDLE" | "MOVING";
export type MovementMode = "FREE_ROAM" | "AIMING";

export const DEFAULT_PLAYER_SPEED = 6.0; // Responsive brisk walking pace
export const ARRIVAL_THRESHOLD = 0.05;   // Distance at which player stops for click-to-move

export interface MovementConfig {
  freeRoamSpeed: number;        // World units per second (default: 6.0)
  aimingSpeed: number;          // World units per second while aiming (default: 4.0)
  acceleration?: number;        // Units/s^2 acceleration (optional; responsive instant when undefined)
  deceleration?: number;        // Units/s^2 deceleration (optional; responsive instant when undefined)
  rotationSmoothTime: number;   // Angular easing speed in FREE_ROAM (default: 14.0 rad/s)
  aimRotationSmoothing: number; // Angular easing speed in AIMING (default: 22.0 rad/s)
  gravity: number;              // Downward acceleration (default: -19.6 units/s^2)
  groundCheckDistance: number;  // Distance to check below feet (default: 0.25 units)
  groundCheckRadius: number;    // Radius of ground check cylinder/sphere (default: 0.3 units)
  terminalVelocity: number;     // Maximum downward fall speed (default: -35.0 units/s)
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  freeRoamSpeed: 6.0,
  aimingSpeed: 4.0,
  rotationSmoothTime: 14.0,
  aimRotationSmoothing: 22.0,
  gravity: -19.6,
  groundCheckDistance: 0.25,
  groundCheckRadius: 0.3,
  terminalVelocity: -35.0,
};

export interface MovementAnimationData {
  speed: number;          // Current horizontal velocity magnitude
  movementSpeed: number;  // Target / normalized speed
  isMoving: boolean;
  isAiming: boolean;
  moveX: number;          // In AIMING: strafe input (-1 to 1). In FREE_ROAM: lateral magnitude
  moveY: number;          // In AIMING: forward/backward input (-1 to 1). In FREE_ROAM: forward magnitude
}

export interface KeyboardInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  aiming?: boolean;       // Right Mouse Button or aim toggle
}

export interface PlayerState {
  position: Vector3D;
  velocity: Vector3D;
  verticalVelocity: number;
  isGrounded: boolean;
  target: Vector2D | null;
  rotation: number;        // In radians around Y-axis
  movementState: MovementState;
  movementMode: MovementMode;
  isMoving: boolean;
  isAiming: boolean;
  speed: number;           // World units per second
  animation: MovementAnimationData;
}

/**
 * Creates initial player state at specified or default origin.
 */
export function createPlayerState(
  custom?: Omit<Partial<PlayerState>, "position"> & {
    position?: { x?: number; y?: number; z?: number };
    x?: number;
    y?: number;
    z?: number;
  }
): PlayerState {
  const x = custom?.position?.x ?? custom?.x ?? 0;
  const y = custom?.position?.y ?? custom?.y ?? 0;
  const z = custom?.position?.z ?? custom?.z ?? 0;
  const isMoving = custom?.isMoving ?? (custom?.movementState === "MOVING");
  const movementState: MovementState = custom?.movementState ?? (isMoving ? "MOVING" : "IDLE");
  const movementMode: MovementMode = custom?.movementMode ?? (custom?.isAiming ? "AIMING" : "FREE_ROAM");
  const isAiming = custom?.isAiming ?? (movementMode === "AIMING");
  const speed = custom?.speed ?? DEFAULT_PLAYER_SPEED;

  const animation: MovementAnimationData = custom?.animation ?? {
    speed: isMoving ? speed : 0,
    movementSpeed: speed,
    isMoving,
    isAiming,
    moveX: 0,
    moveY: isMoving ? 1 : 0,
  };

  return {
    position: { x, y, z },
    velocity: custom?.velocity ?? { x: 0, y: 0, z: 0 },
    verticalVelocity: custom?.verticalVelocity ?? -0.5,
    isGrounded: custom?.isGrounded ?? true,
    target: custom?.target ?? null,
    rotation: custom?.rotation ?? 0,
    movementState,
    movementMode,
    isMoving,
    isAiming,
    speed,
    animation,
  };
}

/**
 * Clamps position within map boundaries with an optional padding margin.
 */
export function clampPositionToBounds<T extends Vector2D | Vector3D>(
  pos: T,
  bounds: MapBounds,
  padding: number = 0.8
): T {
  const minX = bounds.minX + padding;
  const maxX = bounds.maxX - padding;
  const minZ = bounds.minZ + padding;
  const maxZ = bounds.maxZ - padding;

  const clampedX = Math.max(minX, Math.min(maxX, pos.x));
  const clampedZ = Math.max(minZ, Math.min(maxZ, pos.z));

  if ("y" in pos) {
    return { ...pos, x: clampedX, z: clampedZ };
  }
  return { x: clampedX, z: clampedZ } as T;
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

// Reusable vector for camera getWorldDirection to eliminate GC pressure
const _tempCameraDir = new THREE.Vector3();

/**
 * Extracts horizontal forward and right unit vectors from the camera on the XZ plane.
 * Vertical pitch is completely eliminated.
 */
export function getCameraHorizontalVectors(camera: THREE.Camera): {
  forward: Vector2D;
  right: Vector2D;
  yaw: number;
} {
  camera.getWorldDirection(_tempCameraDir);

  const fwdLen = Math.hypot(_tempCameraDir.x, _tempCameraDir.z);
  const fx = fwdLen > 1e-5 ? _tempCameraDir.x / fwdLen : 0;
  const fz = fwdLen > 1e-5 ? _tempCameraDir.z / fwdLen : 1;

  // Horizontal right vector: perpendicular to forward in XZ plane
  // Facing North (0, 1) -> Right is East (1, 0)
  const rx = fz;
  const rz = -fx;

  const yaw = Math.atan2(fx, fz);

  return {
    forward: { x: fx, z: fz },
    right: { x: rx, z: rz },
    yaw,
  };
}

/**
 * Converts keyboard/joystick input into a camera-relative world direction on the horizontal plane.
 * Diagonal input is normalized.
 */
export function getCameraRelativeDirection(
  input: KeyboardInput,
  camera: THREE.Camera
): Vector2D | null {
  const inputX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const inputY = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);

  if (inputX === 0 && inputY === 0) {
    return null;
  }

  const { forward, right } = getCameraHorizontalVectors(camera);

  // moveDirection = cameraRight * inputX + cameraForward * inputY
  const dirX = right.x * inputX + forward.x * inputY;
  const dirZ = right.z * inputX + forward.z * inputY;
  const mag = Math.hypot(dirX, dirZ);

  if (mag <= 1e-5) {
    return null;
  }

  return {
    x: dirX / mag,
    z: dirZ / mag,
  };
}

/**
 * Updates vertical physics, gravity, and ground detection.
 */
export function updateGravity(
  currentPos: Vector3D,
  currentVerticalVelocity: number,
  isCurrentlyGrounded: boolean,
  deltaSeconds: number,
  groundY: number = 0,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): {
  position: Vector3D;
  verticalVelocity: number;
  isGrounded: boolean;
} {
  let newY = currentPos.y;
  let newVertVel = currentVerticalVelocity;
  let grounded = isCurrentlyGrounded;

  // Snap to ground if already on/below surface
  if (newY <= groundY + 1e-3 && newVertVel <= 0) {
    newY = groundY;
    newVertVel = -0.5; // Small downward stick velocity to prevent floating
    grounded = true;
  } else {
    // Airborne: apply downward gravity
    newVertVel += config.gravity * deltaSeconds;
    newVertVel = Math.max(config.terminalVelocity, newVertVel);
    newY += newVertVel * deltaSeconds;

    if (newY <= groundY) {
      newY = groundY;
      newVertVel = -0.5;
      grounded = true;
    } else {
      grounded = false;
    }
  }

  return {
    position: { x: currentPos.x, y: newY, z: currentPos.z },
    verticalVelocity: newVertVel,
    isGrounded: grounded,
  };
}

/**
 * Exposes animation data for blend trees or procedural character animators.
 */
export function getAnimationData(
  playerState: PlayerState,
  input?: KeyboardInput
): MovementAnimationData {
  const currentSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z);
  const isMoving = currentSpeed > 0.05 || playerState.isMoving;
  const isAiming = playerState.isAiming;

  let moveX = 0;
  let moveY = 0;

  if (input) {
    moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    moveY = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
      moveX /= mag;
      moveY /= mag;
    }
  } else if (isMoving) {
    moveY = 1.0;
  }

  return {
    speed: currentSpeed,
    movementSpeed: playerState.speed,
    isMoving,
    isAiming,
    moveX,
    moveY,
  };
}

/**
 * Sets a new movement destination clamped safely within map boundaries (Click-to-Move).
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
      position: { x: target.x, y: position.y, z: target.z },
      velocity: { x: 0, y: 0, z: 0 },
      target: null,
      movementState: "IDLE",
      isMoving: false,
      animation: {
        speed: 0,
        movementSpeed: speed,
        isMoving: false,
        isAiming: currentState.isAiming,
        moveX: 0,
        moveY: 0,
      },
    };
  }

  // Move along vector towards destination
  const ratio = stepDistance / dist;
  const unverifiedX = position.x + dx * ratio;
  const unverifiedZ = position.z + dz * ratio;

  const clampedPos = clampPositionToBounds(
    { x: unverifiedX, y: position.y, z: unverifiedZ },
    bounds,
    padding
  );

  // Smooth rotation toward destination
  const desiredRotation = calculateRotation(position, target);
  const angleDiff = shortestAngleDiff(rotation, desiredRotation);
  const rotStep = Math.min(Math.abs(angleDiff), 16.0 * deltaSeconds) * Math.sign(angleDiff);
  let newRotation = rotation + rotStep;
  newRotation = ((newRotation + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  return {
    ...currentState,
    position: clampedPos,
    velocity: { x: (dx / dist) * speed, y: 0, z: (dz / dist) * speed },
    rotation: newRotation,
    movementState: "MOVING",
    isMoving: true,
    animation: {
      speed,
      movementSpeed: speed,
      isMoving: true,
      isAiming: currentState.isAiming,
      moveX: 0,
      moveY: 1,
    },
  };
}

export type MovementUpdateMode = "KEYBOARD" | "CLICK_TO_MOVE" | "IDLE";

/**
 * Decides which movement updater runs for a frame.
 *
 * Click-to-move writes a full-speed horizontal velocity (e.g. 14.11 u/s) into the
 * player state, so a speed-based trigger alone would route the *next* frame through
 * the keyboard updater, which zeroes velocity and clears `target` when no key is
 * pressed. An active destination therefore always takes the click-to-move path.
 *
 * The residual-speed arm only coasts keyboard inertia (deceleration configs) and is
 * skipped while a destination target is active.
 */
export function selectMovementUpdate(
  state: PlayerState,
  input: KeyboardInput,
  horizontalSpeed: number
): MovementUpdateMode {
  const hasKeyboardActive =
    input.forward || input.backward || input.left || input.right;

  if (hasKeyboardActive || input.aiming) {
    return "KEYBOARD";
  }
  if (horizontalSpeed > 0.05 && !state.target) {
    return "KEYBOARD";
  }
  if (state.isMoving && state.target) {
    return "CLICK_TO_MOVE";
  }
  return "IDLE";
}

// Fallback camera looking North (+Z) when none is provided
let _defaultNorthCamera: THREE.PerspectiveCamera | null = null;
function getDefaultCamera(): THREE.PerspectiveCamera {
  if (!_defaultNorthCamera) {
    _defaultNorthCamera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    _defaultNorthCamera.position.set(0, 15, -20);
    _defaultNorthCamera.lookAt(0, 1.4, 0);
    _defaultNorthCamera.updateMatrixWorld();
  }
  return _defaultNorthCamera;
}

/**
 * Production-quality third-person movement controller inspired by GTA San Andreas.
 *
 * State Machine:
 * - FREE_ROAM (default):
 *   - Camera-relative direction: W = camera forward, S = opposite, A = camera left, D = camera right.
 *   - No strafing: Character turns to face the direction of movement.
 *   - When standing still: Character maintains last facing direction (no rotation when idle).
 *
 * - AIMING:
 *   - Character rotation locks to camera horizontal yaw (ignores camera pitch).
 *   - Strafe movement: W = forward, S = backward, A = left, D = right relative to camera.
 *   - Character continues facing camera direction while moving in any direction.
 *
 * Physics & Input:
 * - Normalized diagonal vectors (no diagonal speed boost).
 * - Smooth, responsive acceleration and deceleration (no sliding).
 * - Full vertical gravity and ground detection.
 * - Frame-rate independent delta-time integration.
 * - Keyboard input immediately overrides click-to-move.
 */
export function updatePlayerMovementState(
  currentState: PlayerState,
  input: KeyboardInput,
  camera: THREE.Camera,
  deltaSeconds: number,
  bounds: MapBounds,
  padding: number = 0.8,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): PlayerState {
  const isAiming = Boolean(input.aiming);
  const movementMode: MovementMode = isAiming ? "AIMING" : "FREE_ROAM";

  const inputX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const inputY = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const isInputActive = inputX !== 0 || inputY !== 0;

  // 1. Camera Horizontal Vectors
  const { forward: camFwd, right: camRight, yaw: camYaw } = getCameraHorizontalVectors(camera);

  // 2. Camera-Relative Movement Direction
  let moveDir: Vector2D | null = null;
  if (isInputActive) {
    const rawDirX = camRight.x * inputX + camFwd.x * inputY;
    const rawDirZ = camRight.z * inputX + camFwd.z * inputY;
    const mag = Math.hypot(rawDirX, rawDirZ);
    if (mag > 1e-5) {
      moveDir = { x: rawDirX / mag, z: rawDirZ / mag };
    }
  }

  // 3. Target Speed and Velocity
  const baseSpeed = currentState.speed !== undefined && currentState.speed > 0
    ? currentState.speed
    : config.freeRoamSpeed;
  const targetSpeed = isInputActive
    ? (isAiming ? config.aimingSpeed : baseSpeed)
    : 0;
  const targetVelX = moveDir ? moveDir.x * targetSpeed : 0;
  const targetVelZ = moveDir ? moveDir.z * targetSpeed : 0;

  // 4. Kinematics Integration (responsive by default, with optional configurable acceleration/deceleration)
  const currentVelX = currentState.velocity.x;
  const currentVelZ = currentState.velocity.z;

  const hasAcceleration = config.acceleration !== undefined && Number.isFinite(config.acceleration);
  const hasDeceleration = config.deceleration !== undefined && Number.isFinite(config.deceleration);

  let newVelX: number;
  let newVelZ: number;

  if (isInputActive) {
    if (hasAcceleration) {
      const maxDeltaVel = config.acceleration! * deltaSeconds;
      const diffX = targetVelX - currentVelX;
      const diffZ = targetVelZ - currentVelZ;
      const diffMag = Math.hypot(diffX, diffZ);
      if (diffMag <= maxDeltaVel || diffMag <= 1e-5) {
        newVelX = targetVelX;
        newVelZ = targetVelZ;
      } else {
        newVelX = currentVelX + (diffX / diffMag) * maxDeltaVel;
        newVelZ = currentVelZ + (diffZ / diffMag) * maxDeltaVel;
      }
    } else {
      newVelX = targetVelX;
      newVelZ = targetVelZ;
    }
  } else {
    if (hasDeceleration) {
      const maxDeltaVel = config.deceleration! * deltaSeconds;
      const currentSpeed = Math.hypot(currentVelX, currentVelZ);
      if (currentSpeed <= maxDeltaVel || currentSpeed <= 1e-5) {
        newVelX = 0;
        newVelZ = 0;
      } else {
        newVelX = currentVelX - (currentVelX / currentSpeed) * maxDeltaVel;
        newVelZ = currentVelZ - (currentVelZ / currentSpeed) * maxDeltaVel;
      }
    } else {
      newVelX = 0;
      newVelZ = 0;
    }
  }

  // Frame-rate independent velocity integration:
  // If gradual acceleration or deceleration is active, use trapezoidal integration ((v0 + v1) / 2) * dt.
  // Otherwise, use direct velocity displacement newVel * dt for instant zero-latency response.
  const usesTrapezoidal = (hasAcceleration && isInputActive) || (hasDeceleration && !isInputActive);
  const stepVelX = usesTrapezoidal ? (currentVelX + newVelX) * 0.5 : newVelX;
  const stepVelZ = usesTrapezoidal ? (currentVelZ + newVelZ) * 0.5 : newVelZ;

  const posX = currentState.position.x + stepVelX * deltaSeconds;
  const posZ = currentState.position.z + stepVelZ * deltaSeconds;

  const clamped = clampPositionToBounds(
    { x: posX, y: currentState.position.y, z: posZ },
    bounds,
    padding
  );

  // 5. Rotation System
  let newRotation = currentState.rotation;

  if (isAiming) {
    // In AIMING: character rotation smoothly/snappily locks to camera horizontal yaw
    const angleDiff = shortestAngleDiff(currentState.rotation, camYaw);
    const rotStep = angleDiff * (1 - Math.exp(-config.aimRotationSmoothing * deltaSeconds));
    newRotation = currentState.rotation + rotStep;
  } else if (moveDir) {
    // In FREE_ROAM: character smoothly turns toward the direction of movement
    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    const angleDiff = shortestAngleDiff(currentState.rotation, targetAngle);
    const rotStep = angleDiff * (1 - Math.exp(-config.rotationSmoothTime * deltaSeconds));
    newRotation = currentState.rotation + rotStep;
  }
  // When standing still in FREE_ROAM (no moveDir): character remains facing last direction!

  newRotation = ((newRotation + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  // 6. Vertical Physics & Gravity
  const gravityResult = updateGravity(
    clamped,
    currentState.verticalVelocity,
    currentState.isGrounded,
    deltaSeconds,
    0,
    config
  );

  const horizontalSpeed = Math.hypot(newVelX, newVelZ);
  const isMoving = isInputActive || horizontalSpeed > 0.08;

  const animation = getAnimationData(
    {
      ...currentState,
      velocity: { x: newVelX, y: gravityResult.verticalVelocity, z: newVelZ },
      isMoving,
      isAiming,
      speed: isAiming ? config.aimingSpeed : config.freeRoamSpeed,
    },
    input
  );

  return {
    ...currentState,
    position: gravityResult.position,
    velocity: { x: newVelX, y: gravityResult.verticalVelocity, z: newVelZ },
    verticalVelocity: gravityResult.verticalVelocity,
    isGrounded: gravityResult.isGrounded,
    rotation: newRotation,
    // Keyboard input (or aiming) immediately cancels click-to-move; when neither is
    // active the updater must not destroy a destination it was only asked to coast past
    target: isInputActive || isAiming ? null : currentState.target,
    movementState: isMoving ? "MOVING" : "IDLE",
    movementMode,
    isMoving,
    isAiming,
    speed: isAiming ? config.aimingSpeed : config.freeRoamSpeed,
    animation,
  };
}

/**
 * Universal keyboard controller entrypoint supporting camera-relative GTA movement,
 * aiming, and backwards compatibility.
 */
export function updatePlayerKeyboard(
  currentState: PlayerState,
  input: KeyboardInput,
  deltaSeconds: number,
  bounds: MapBounds,
  padding: number = 0.8,
  cameraOrAimTarget?: THREE.Camera | Vector2D | null,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): PlayerState {
  const camera = cameraOrAimTarget instanceof THREE.Camera
    ? cameraOrAimTarget
    : getDefaultCamera();

  return updatePlayerMovementState(
    currentState,
    input,
    camera,
    deltaSeconds,
    bounds,
    padding,
    config
  );
}
