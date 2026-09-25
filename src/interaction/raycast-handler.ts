import * as THREE from "three";
import type { Vector2D } from "../player/movement-controller";

export interface DestinationIndicator {
  mesh: THREE.Mesh;
  show(position: Vector2D): void;
  hide(): void;
  update(deltaSeconds: number): void;
  dispose(): void;
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
}

/**
 * Raycasting utility to project screen clicks into 3D world coordinates on the map.
 */
export function createRaycastHandler(): RaycastHandler {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

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
  };
}
