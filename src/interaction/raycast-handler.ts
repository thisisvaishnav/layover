import * as THREE from "three";
import type { Vector2D } from "../player/movement-controller";

import type { MapBounds } from "../map/map-generator";

export interface DestinationIndicator {
  mesh: THREE.Mesh;
  show(position: Vector2D): void;
  hide(): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}

export interface CursorAimIndicator {
  mesh: THREE.Group;
  show(position: Vector2D): void;
  hide(): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}

/**
 * Creates a subtle clean crosshair direction indicator at the ground intersection point.
 */
export function createCursorAimIndicator(): CursorAimIndicator {
  const group = new THREE.Group();
  group.renderOrder = 998;
  group.position.y = 0.17;
  group.visible = false;

  const ringGeo = new THREE.RingGeometry(0.3, 0.42, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Subtle crisp cyan
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  group.add(ringMesh);

  const dotGeo = new THREE.CircleGeometry(0.07, 16);
  const dotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });
  const dotMesh = new THREE.Mesh(dotGeo, dotMat);
  dotMesh.rotation.x = -Math.PI / 2;
  group.add(dotMesh);

  let animTime = 0;

  return {
    mesh: group,
    show(pos: Vector2D) {
      group.position.set(pos.x, 0.17, pos.z);
      group.visible = true;
    },
    hide() {
      group.visible = false;
    },
    update(deltaSeconds: number) {
      if (!group.visible) return;
      animTime += deltaSeconds * 3.0;
      const subtleScale = 1.0 + Math.sin(animTime) * 0.08;
      ringMesh.scale.set(subtleScale, subtleScale, 1);
    },
    dispose() {
      ringGeo.dispose();
      ringMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
    },
  };
}

/**
 * Creates a subtle pulsing visual feedback ring at the clicked destination.
 */
export function createDestinationIndicator(): DestinationIndicator {
  const ringGeo = new THREE.RingGeometry(0.35, 0.6, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Subtle crisp cyan/sky
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(ringGeo, ringMat);
  mesh.renderOrder = 999;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.16;
  mesh.visible = false;

  let animTime = 0;
  let isActive = false;

  return {
    mesh,
    show(pos: Vector2D) {
      mesh.position.set(pos.x, 0.16, pos.z);
      mesh.visible = true;
      ringMat.opacity = 0.9;
      animTime = 0;
      isActive = true;
    },
    hide() {
      mesh.visible = false;
      isActive = false;
    },
    update(deltaSeconds: number) {
      if (!isActive) return;
      animTime += deltaSeconds * 4.0;
      const scale = 1.0 + Math.sin(animTime) * 0.15;
      mesh.scale.set(scale, scale, 1);
    },
    dispose() {
      ringGeo.dispose();
      ringMat.dispose();
    },
  };
}

export interface RaycastHandler {
  getPointedWorldCoordinates(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    camera: THREE.Camera,
    clickableObjects: THREE.Object3D[]
  ): Vector2D | null;
  getGroundIntersection(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    camera: THREE.Camera,
    bounds?: MapBounds,
    groundY?: number
  ): Vector2D | null;
}

/**
 * Raycasting utility to project screen clicks and mouse position into 3D world coordinates on the map.
 */
export function createRaycastHandler(): RaycastHandler {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();

  return {
    getPointedWorldCoordinates(
      clientX: number,
      clientY: number,
      rect: DOMRect,
      camera: THREE.Camera,
      clickableObjects: THREE.Object3D[]
    ): Vector2D | null {
      if (rect.width <= 0 || rect.height <= 0) return null;

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        return {
          x: hit.point.x,
          z: hit.point.z,
        };
      }

      return null;
    },

    getGroundIntersection(
      clientX: number,
      clientY: number,
      rect: DOMRect,
      camera: THREE.Camera,
      bounds?: MapBounds,
      groundY: number = 0
    ): Vector2D | null {
      if (rect.width <= 0 || rect.height <= 0) return null;

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      // Cursor must be on or near the canvas
      if (pointer.x < -1.1 || pointer.x > 1.1 || pointer.y < -1.1 || pointer.y > 1.1) {
        return null;
      }

      raycaster.setFromCamera(pointer, camera);

      // Horizontal ground plane at groundY
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
      const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);

      if (!hit) {
        return null;
      }

      // Check map bounds if provided
      if (bounds) {
        if (
          hitPoint.x < bounds.minX ||
          hitPoint.x > bounds.maxX ||
          hitPoint.z < bounds.minZ ||
          hitPoint.z > bounds.maxZ
        ) {
          return null;
        }
      }

      return {
        x: hitPoint.x,
        z: hitPoint.z,
      };
    },
  };
}
