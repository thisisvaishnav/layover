import * as THREE from "three";
import type { Vector2D } from "../player/movement-controller";

export const DEFAULT_CAMERA_DISTANCE = 34.0; // Comfortable zoomed-out third-person/isometric view
export const MIN_CAMERA_DISTANCE = 16.0;    // Close limit preventing awkward clipping or occlusion
export const MAX_CAMERA_DISTANCE = 65.0;    // Far limit preventing player from becoming a speck
export const DEFAULT_PITCH_ANGLE = 0.65;    // ~37.2°: stable elevated isometric/third-person perspective

export interface CameraController {
  camera: THREE.PerspectiveCamera;
  update(
    playerPosition: Vector2D,
    deltaSeconds: number,
    playerRotation?: number,
    collisionObjects?: THREE.Object3D[]
  ): void;
  handleResize(width: number, height: number): void;
  setZoom(factor: number): void;
  zoomBy(deltaDist: number): void;
  rotateOrbit(deltaYaw: number, deltaPitch: number): void;
  resetOrbit(): void;
  getTargetDistance(): number;
}

export interface CameraConfig {
  fov?: number;
  baseDistance?: number;
  basePitch?: number;
  baseYaw?: number;
}

/**
 * Stable elevated third-person / isometric camera controller.
 * - Elevated angle (~37°) providing clear view of player, roads, park, and buildings.
 * - Frame-rate independent smooth following without shaking, snapping, or whipping.
 * - Zero automatic walking zoom — camera distance stays completely stable during movement.
 * - Manual mouse-wheel zoom bounded strictly between MIN and MAX distance.
 * - Simple obstacle clearance test to avoid clipping through building meshes.
 */
export function createCameraController(
  width: number,
  height: number,
  initialPosition: Vector2D = { x: 0, z: 0 },
  config?: CameraConfig
): CameraController {
  const fov = config?.fov ?? 52;
  const aspect = width > 0 && height > 0 ? width / height : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.5, 900);

  const defaultDistance = config?.baseDistance ?? DEFAULT_CAMERA_DISTANCE;
  let targetDistance = defaultDistance;
  let currentDistance = defaultDistance;

  const basePitch = config?.basePitch ?? DEFAULT_PITCH_ANGLE;
  let orbitPitch = basePitch;
  let orbitYaw = config?.baseYaw ?? 0; // Fixed stable south-to-north view looking into the city

  // Target follows upper chest/shoulders
  const currentTarget = new THREE.Vector3(initialPosition.x, 1.4, initialPosition.z);
  const desiredTarget = new THREE.Vector3();

  // Raycaster for simple obstacle collision clearance
  const raycaster = new THREE.Raycaster();
  const rayDir = new THREE.Vector3();

  // Initial placement
  const initHoriz = currentDistance * Math.cos(orbitPitch);
  const initHeight = currentDistance * Math.sin(orbitPitch);
  camera.position.set(
    currentTarget.x - Math.sin(orbitYaw) * initHoriz,
    currentTarget.y + initHeight,
    currentTarget.z - Math.cos(orbitYaw) * initHoriz
  );
  camera.lookAt(currentTarget.x, currentTarget.y + 0.3, currentTarget.z);

  return {
    camera,
    update(
      playerPosition: Vector2D,
      deltaSeconds: number,
      _playerRotation?: number,
      collisionObjects?: THREE.Object3D[]
    ) {
      // 1. Smoothly follow player position (responsive 8.5/s damping without lag or shaking)
      desiredTarget.set(playerPosition.x, 1.4, playerPosition.z);
      const followRate = 1 - Math.exp(-8.5 * Math.min(deltaSeconds, 0.1));
      currentTarget.lerp(desiredTarget, followRate);

      // 2. Smoothly interpolate manual zoom distance (NO automatic walking zoom)
      const zoomRate = 1 - Math.exp(-8.0 * Math.min(deltaSeconds, 0.1));
      currentDistance += (targetDistance - currentDistance) * zoomRate;

      // 3. Compute spherical third-person camera position
      let effectiveDistance = currentDistance;

      // 4. Simple camera collision prevention against building meshes
      if (collisionObjects && collisionObjects.length > 0) {
        const horiz = effectiveDistance * Math.cos(orbitPitch);
        const vert = effectiveDistance * Math.sin(orbitPitch);
        const testPos = new THREE.Vector3(
          currentTarget.x - Math.sin(orbitYaw) * horiz,
          currentTarget.y + vert,
          currentTarget.z - Math.cos(orbitYaw) * horiz
        );

        rayDir.subVectors(testPos, currentTarget).normalize();
        raycaster.set(currentTarget, rayDir);
        raycaster.near = 1.0;
        raycaster.far = effectiveDistance + 0.5;

        const hits = raycaster.intersectObjects(collisionObjects, false);
        if (hits.length > 0 && hits[0].distance < effectiveDistance) {
          // Obstacle found: pull camera in front of obstacle
          effectiveDistance = Math.max(MIN_CAMERA_DISTANCE * 0.75, hits[0].distance - 1.2);
        }
      }

      const finalHoriz = effectiveDistance * Math.cos(orbitPitch);
      const finalVert = effectiveDistance * Math.sin(orbitPitch);

      camera.position.set(
        currentTarget.x - Math.sin(orbitYaw) * finalHoriz,
        currentTarget.y + finalVert,
        currentTarget.z - Math.cos(orbitYaw) * finalHoriz
      );

      // Look slightly above ground target for balanced vertical framing
      camera.lookAt(currentTarget.x, currentTarget.y + 0.3, currentTarget.z);
    },

    handleResize(newWidth: number, newHeight: number) {
      if (newWidth <= 0 || newHeight <= 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    },

    setZoom(factor: number) {
      // Scales relative to default distance: factor 1.0 = DEFAULT_CAMERA_DISTANCE
      const clampedFactor = Math.max(
        MIN_CAMERA_DISTANCE / DEFAULT_CAMERA_DISTANCE,
        Math.min(MAX_CAMERA_DISTANCE / DEFAULT_CAMERA_DISTANCE, factor)
      );
      targetDistance = Math.max(
        MIN_CAMERA_DISTANCE,
        Math.min(MAX_CAMERA_DISTANCE, defaultDistance * clampedFactor)
      );
    },

    zoomBy(deltaDist: number) {
      targetDistance = Math.max(
        MIN_CAMERA_DISTANCE,
        Math.min(MAX_CAMERA_DISTANCE, targetDistance + deltaDist)
      );
    },

    rotateOrbit(deltaYaw: number, deltaPitch: number) {
      orbitYaw += deltaYaw;
      orbitYaw = ((orbitYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      // Clamp pitch between ~23° (0.40 rad) and ~57° (1.00 rad) to maintain elevated perspective
      orbitPitch = Math.max(0.40, Math.min(1.00, orbitPitch + deltaPitch));
    },

    resetOrbit() {
      orbitPitch = basePitch;
      orbitYaw = 0;
      targetDistance = defaultDistance;
    },

    getTargetDistance() {
      return targetDistance;
    },
  };
}
