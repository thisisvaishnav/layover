import * as THREE from "three";
import {
  DEFAULT_MOVEMENT_CONFIG,
  resolveCollisions,
  type BoxCollider,
  type ObstacleCollider,
} from "./movement-controller";

/**
 * World-space obstacle registry for the player.
 *
 * Static obstacles (buildings, street lights, shops, park furniture) are built once.
 * Dynamic obstacles (traffic cars) are rebuilt from their world transforms each frame.
 */

/** Names that describe walkable ground, decals or non-blocking decorations. */
const NON_BLOCKING_NAME =
  /surface|curb|tactile|lawn|footpath|ground|floor|pavement|pad$|stripe|border|divider|porch|tile|rug|shadow|decal|npc|highlight/i;

/** Anything below this world height can simply be stepped over. */
const MIN_BLOCK_HEIGHT = 0.35;

function isNonBlockingName(name: string | undefined): boolean {
  return Boolean(name) && NON_BLOCKING_NAME.test(name!);
}

function toBoxCollider(box: THREE.Box3, name?: string): BoxCollider {
  return {
    type: "box",
    minX: box.min.x,
    maxX: box.max.x,
    minZ: box.min.z,
    maxZ: box.max.z,
    name,
  };
}

/** World-space AABB of a single object, or null when it cannot block the player. */
function boxOfObject(obj: THREE.Object3D): THREE.Box3 | null {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj, true);
  if (box.isEmpty()) return null;
  if (box.max.y < MIN_BLOCK_HEIGHT) return null;
  return box;
}

function collectMeshes(root: THREE.Object3D, out: THREE.Mesh[]): void {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) out.push(child);
  });
}

/** World-space union of every blocking mesh inside a subtree. */
function unionBoxOf(root: THREE.Object3D): THREE.Box3 | null {
  if (isNonBlockingName(root.name)) return null;
  const meshes: THREE.Mesh[] = [];
  collectMeshes(root, meshes);
  const union = new THREE.Box3().makeEmpty();
  for (const mesh of meshes) {
    if (isNonBlockingName(mesh.name)) continue;
    const box = boxOfObject(mesh);
    if (box) union.union(box);
  }
  return union.isEmpty() ? null : union;
}

/**
 * Builds 2D blocking boxes from world-space objects.
 *
 * - A loose mesh becomes its own box (building walls, lamp poles, bench seats, car parts).
 * - A child group becomes one merged box so a structure (shelter, building, taxi row)
 *   blocks as a single solid volume instead of leaving walk-through gaps.
 * - Ground plates, decals, NPCs and highlights are skipped.
 */
export function buildObstacleColliders(roots: THREE.Object3D[]): ObstacleCollider[] {
  const colliders: ObstacleCollider[] = [];

  for (const root of roots) {
    if (!root || isNonBlockingName(root.name)) continue;

    if (root instanceof THREE.Mesh) {
      const box = boxOfObject(root);
      if (box) colliders.push(toBoxCollider(box, root.name));
      continue;
    }

    if (root.children.length === 0) {
      const box = boxOfObject(root);
      if (box) colliders.push(toBoxCollider(box, root.name));
      continue;
    }

    for (const child of root.children) {
      if (isNonBlockingName(child.name)) continue;

      if (child instanceof THREE.Mesh) {
        const box = boxOfObject(child);
        if (box) colliders.push(toBoxCollider(box, child.name || root.name));
        continue;
      }

      const union = unionBoxOf(child);
      if (union) colliders.push(toBoxCollider(union, child.name || root.name));
    }
  }

  return colliders;
}

export class PlayerCollisionWorld {
  private staticRoots: THREE.Object3D[] = [];
  private dynamicRoots: THREE.Object3D[] = [];
  private staticColliders: ObstacleCollider[] = [];
  private dynamicColliders: ObstacleCollider[] = [];
  private allColliders: ObstacleCollider[] = [];

  /** Register static structure (map obstacle meshes, shop groups, street furniture). */
  addStatic(roots: THREE.Object3D | THREE.Object3D[]): this {
    this.staticRoots.push(...(Array.isArray(roots) ? roots : [roots]));
    this.staticColliders = buildObstacleColliders(this.staticRoots);
    this.rebuild();
    return this;
  }

  /** Register objects that move (traffic cars) — rebuilt on every refreshDynamic(). */
  addDynamic(roots: THREE.Object3D | THREE.Object3D[]): this {
    this.dynamicRoots.push(...(Array.isArray(roots) ? roots : [roots]));
    this.refreshDynamic();
    return this;
  }

  /** Re-reads world transforms of dynamic roots (call once per frame). */
  refreshDynamic(): this {
    this.dynamicColliders = buildObstacleColliders(this.dynamicRoots);
    this.rebuild();
    return this;
  }

  private rebuild(): void {
    this.allColliders = this.staticColliders.concat(this.dynamicColliders);
  }

  get colliders(): ObstacleCollider[] {
    return this.allColliders;
  }

  get staticCount(): number {
    return this.staticColliders.length;
  }

  get dynamicCount(): number {
    return this.dynamicColliders.length;
  }

  /** Pushes a position out of every overlapping obstacle. Returns true when a collision was resolved. */
  resolve(pos: { x: number; z: number }, playerRadius: number = DEFAULT_MOVEMENT_CONFIG.playerRadius ?? 0.7): boolean {
    if (this.allColliders.length === 0) return false;
    return resolveCollisions(pos, playerRadius, this.allColliders);
  }
}
