import type { MapBounds } from "./map-generator";
import type { Vector2D } from "../player/movement-controller";

export interface MinimapPoint2D {
  x: number;
  y: number;
}

export interface MinimapConfig {
  radius: number;          // Radius of the circular minimap in screen pixels (default 90 = 180px diameter)
  padding: number;         // Inner padding margin in pixels (default 8)
  scale: number;           // Zoom/scale factor (default 1.0)
  showBorder: boolean;     // Whether to render polished outer bezel/border (default true)
}

export const MINIMAP_DEFAULT_CONFIG: MinimapConfig = {
  radius: 90,
  padding: 8,
  scale: 1.0,
  showBorder: true,
};

/**
 * Maps a 3D world position (X, Z) to 2D circular minimap coordinates (x, y) in screen pixels.
 * Uses a FIXED NORTH-UP projection where:
 * - North (+Z) is Top (smaller Y)
 * - South (-Z) is Bottom (larger Y)
 * - West (-X) is Left (smaller X)
 * - East (+X) is Right (larger X)
 */
export function worldToMinimap(
  worldPos: Vector2D,
  bounds: MapBounds,
  radius: number = MINIMAP_DEFAULT_CONFIG.radius,
  padding: number = MINIMAP_DEFAULT_CONFIG.padding,
  scale: number = 1.0,
  centerWorld: Vector2D = { x: 0, z: 0 }
): MinimapPoint2D {
  const centerMinimap = radius;
  const usableRadius = (radius - padding) * scale;

  // Max dimension used to normalize so both axes scale equally
  const halfSpan = Math.max(bounds.totalWidth, bounds.totalDepth) / 2;
  const pixelsPerUnit = halfSpan > 0 ? usableRadius / halfSpan : 1;

  // World +X moves East -> +X on minimap (Right)
  const mx = centerMinimap + (worldPos.x - centerWorld.x) * pixelsPerUnit;

  // World +Z moves North -> -Y on minimap (Up, towards top of screen)
  const my = centerMinimap - (worldPos.z - centerWorld.z) * pixelsPerUnit;

  return { x: mx, y: my };
}

/**
 * Maps 2D minimap pixel coordinates back to 3D world coordinates (X, Z).
 */
export function minimapToWorld(
  minimapPos: MinimapPoint2D,
  bounds: MapBounds,
  radius: number = MINIMAP_DEFAULT_CONFIG.radius,
  padding: number = MINIMAP_DEFAULT_CONFIG.padding,
  scale: number = 1.0,
  centerWorld: Vector2D = { x: 0, z: 0 }
): Vector2D {
  const centerMinimap = radius;
  const usableRadius = (radius - padding) * scale;
  const halfSpan = Math.max(bounds.totalWidth, bounds.totalDepth) / 2;
  const pixelsPerUnit = halfSpan > 0 ? usableRadius / halfSpan : 1;

  const wx = centerWorld.x + (minimapPos.x - centerMinimap) / pixelsPerUnit;
  const wz = centerWorld.z - (minimapPos.y - centerMinimap) / pixelsPerUnit;

  return { x: wx, z: wz };
}

/**
 * Converts 3D player heading (rotation around Y-axis in radians) to 2D minimap marker angle.
 * In a fixed North-Up minimap:
 * - Rotation 0 (facing North / +Z) points straight UP (0 rad)
 * - Rotation π/2 (facing East / +X) points RIGHT (π/2 rad)
 * - Rotation π (facing South / -Z) points DOWN (π rad)
 * - Rotation -π/2 (facing West / -X) points LEFT (-π/2 rad)
 */
export function playerRotationToMinimapHeading(playerRotationRad: number): number {
  let angle = playerRotationRad % (Math.PI * 2);
  if (angle > Math.PI) angle -= Math.PI * 2;
  if (angle < -Math.PI) angle += Math.PI * 2;
  if (Math.abs(angle - -Math.PI) < 1e-6) angle = Math.PI;
  return angle;
}

/**
 * Checks whether a 2D point is inside the circular minimap radar boundary.
 */
export function isInsideMinimapCircle(
  pos: MinimapPoint2D,
  center: MinimapPoint2D = { x: MINIMAP_DEFAULT_CONFIG.radius, y: MINIMAP_DEFAULT_CONFIG.radius },
  radius: number = MINIMAP_DEFAULT_CONFIG.radius
): boolean {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Clamps a 2D point to lie strictly inside the circular minimap perimeter with an optional margin.
 */
export function clampToMinimapCircle(
  pos: MinimapPoint2D,
  center: MinimapPoint2D = { x: MINIMAP_DEFAULT_CONFIG.radius, y: MINIMAP_DEFAULT_CONFIG.radius },
  radius: number = MINIMAP_DEFAULT_CONFIG.radius,
  margin: number = 4.0
): MinimapPoint2D {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  const dist = Math.hypot(dx, dy);
  const maxRadius = Math.max(1, radius - margin);

  if (dist <= maxRadius) {
    return { x: pos.x, y: pos.y };
  }

  const ratio = maxRadius / dist;
  return {
    x: center.x + dx * ratio,
    y: center.y + dy * ratio,
  };
}
