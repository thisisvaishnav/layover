import { Position3D, AABB, InputState, Hotspot } from "./types";

/**
 * Computes 2D planar velocity vector from input keys with diagonal normalization.
 */
export function resolveVelocity(input: InputState): { x: number; z: number } {
  let dx = 0;
  let dz = 0;

  if (input.forward) dz -= 1;
  if (input.backward) dz += 1;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;

  if (dx !== 0 && dz !== 0) {
    const invSqrt2 = Math.SQRT1_2;
    return { x: dx * invSqrt2, z: dz * invSqrt2 };
  }

  return { x: dx, z: dz };
}

/**
 * Checks if a circular entity intersects an Axis-Aligned Bounding Box (AABB).
 */
export function checkAABBCollision(
  point: Position3D,
  box: AABB,
  radius: number = 0.4
): boolean {
  const closestX = Math.max(box.minX, Math.min(point.x, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(point.z, box.maxZ));

  const distX = point.x - closestX;
  const distZ = point.z - closestZ;

  return distX * distX + distZ * distZ < radius * radius;
}

/**
 * Resolves movement, sliding along obstacles and clamping within room boundaries.
 */
export function resolveMovement(
  current: Position3D,
  dir: { x: number; z: number },
  speed: number,
  delta: number,
  obstacles: AABB[],
  bounds: AABB,
  radius: number = 0.4
): Position3D {
  if (dir.x === 0 && dir.z === 0) {
    return { ...current };
  }

  const rawNextX = current.x + dir.x * speed * delta;
  const rawNextZ = current.z + dir.z * speed * delta;

  // 1. Clamp to boundary walls
  let finalX = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, rawNextX));
  let finalZ = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, rawNextZ));

  // 2. Obstacle collision with axis-sliding
  // Try X movement first
  const testPosX: Position3D = { x: finalX, y: current.y, z: current.z };
  let collidesX = false;
  for (const obs of obstacles) {
    if (checkAABBCollision(testPosX, obs, radius)) {
      collidesX = true;
      break;
    }
  }
  if (collidesX) {
    finalX = current.x;
  }

  // Try Z movement
  const testPosZ: Position3D = { x: finalX, y: current.y, z: finalZ };
  let collidesZ = false;
  for (const obs of obstacles) {
    if (checkAABBCollision(testPosZ, obs, radius)) {
      collidesZ = true;
      break;
    }
  }
  if (collidesZ) {
    finalZ = current.z;
  }

  return {
    x: finalX,
    y: current.y,
    z: finalZ,
  };
}

/**
 * Finds the closest interactive hotspot within interaction distance.
 */
export function findActiveHotspot(
  playerPos: Position3D,
  hotspots: Hotspot[]
): Hotspot | null {
  let closest: Hotspot | null = null;
  let minDistance = Infinity;

  for (const spot of hotspots) {
    const dist = Math.hypot(
      playerPos.x - spot.position.x,
      playerPos.z - spot.position.z
    );

    if (dist <= spot.interactionRadius && dist < minDistance) {
      minDistance = dist;
      closest = spot;
    }
  }

  return closest;
}
