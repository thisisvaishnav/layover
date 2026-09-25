import * as THREE from "three";
import type { Vector2D } from "../player/movement-controller";

// GTA V On Foot Presets: Close (shoulder-to-head height), Medium, Far
export const MIN_CAMERA_DISTANCE = 5.0;       // Close preset: sits at shoulder-to-head height (1.5m to 1.7m)
export const DEFAULT_CAMERA_DISTANCE = 22.0;   // Medium preset: dynamically elevated framing character in lower-middle third
export const MAX_CAMERA_DISTANCE = 55.0;       // Far preset: elevated overview of city environment

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
 * Computes on-foot camera elevation and pitch.
 * - Sits at roughly shoulder-to-head height for closest preset (~1.62m, between 1.5m and 1.7m).
 * - Dynamically elevates as you zoom out to keep character framed in lower-middle third of screen.
 */
export function computeCameraElevation(
  dist: number,
  pitchOffset: number = 0
): { height: number; pitch: number; horizDist: number } {
  const minDist = MIN_CAMERA_DISTANCE;
  const maxDist = MAX_CAMERA_DISTANCE;
  const t = Math.max(0, Math.min(1, (dist - minDist) / (maxDist - minDist)));

  // Close sits at shoulder-to-head height (~1.62m) with slight downward look (~4.6°)
  // Dynamically elevates up to ~39° as distance expands
  const basePitch = 0.08 + Math.pow(t, 0.7) * 0.60;
  const effectivePitch = Math.max(0.04, Math.min(1.05, basePitch + pitchOffset));
  const height = 1.62 + (dist - minDist) * Math.sin(effectivePitch);
  const horizDist = dist * Math.cos(effectivePitch);

  return { height, pitch: effectivePitch, horizDist };
}

/**
 * GTA V-style third-person on-foot camera controller with dynamic elevation.
 * - Close preset: sits at shoulder-to-head height (1.5m - 1.7m).
 * - Medium / Far presets: dynamically elevates to frame character in lower-middle third.
 * - Frame-rate independent smooth following without shaking or lag.
 * - Zero automatic walking zoom — camera distance stays completely stable during movement.
 * - Manual mouse-wheel zoom bounded strictly between MIN (5.0m) and MAX (55.0m).
 * - Obstacle collision clearance preventing camera clipping through buildings.
 */
export function createCameraController(
  width: number,
  height: number,
  initialPosition: Vector2D = { x: 0, z: 0 },
  config?: CameraConfig
): CameraController {
  const fov = config?.fov ?? 54;
  const aspect = width > 0 && height > 0 ? width / height : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.4, 900);

  const defaultDistance = config?.baseDistance ?? DEFAULT_CAMERA_DISTANCE;
  let targetDistance = defaultDistance;
  let currentDistance = defaultDistance;

  let pitchOffset = 0;
  let orbitYaw = config?.baseYaw ?? 0; // Fixed stable south-to-north view looking into the city

  // Target follows upper chest/shoulders
  const currentTarget = new THREE.Vector3(initialPosition.x, 1.4, initialPosition.z);
  const desiredTarget = new THREE.Vector3();

  // Raycaster for simple obstacle collision clearance
  const raycaster = new THREE.Raycaster();
  const rayDir = new THREE.Vector3();

  // Initial placement
  const initialProfile = computeCameraElevation(currentDistance, pitchOffset);
  camera.position.set(
    currentTarget.x - Math.sin(orbitYaw) * initialProfile.horizDist,
    initialProfile.height,
    currentTarget.z - Math.cos(orbitYaw) * initialProfile.horizDist
  );
  camera.lookAt(
    currentTarget.x,
    currentTarget.y + (initialProfile.height - 1.62) * 0.08,
    currentTarget.z
  );

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

      // 3. Compute dynamic on-foot elevation
      let effectiveDistance = currentDistance;

      // 4. Simple camera collision prevention against building meshes
      if (collisionObjects && collisionObjects.length > 0) {
        const testProfile = computeCameraElevation(effectiveDistance, pitchOffset);
        const testPos = new THREE.Vector3(
          currentTarget.x - Math.sin(orbitYaw) * testProfile.horizDist,
          testProfile.height,
          currentTarget.z - Math.cos(orbitYaw) * testProfile.horizDist
        );

        rayDir.subVectors(testPos, currentTarget).normalize();
        raycaster.set(currentTarget, rayDir);
        raycaster.near = 0.5;
        raycaster.far = effectiveDistance + 0.5;

        const hits = raycaster.intersectObjects(collisionObjects, true);
        if (hits.length > 0 && hits[0].distance < effectiveDistance) {
          effectiveDistance = Math.max(MIN_CAMERA_DISTANCE, hits[0].distance - 1.0);
        }
      }

      const profile = computeCameraElevation(effectiveDistance, pitchOffset);

      camera.position.set(
        currentTarget.x - Math.sin(orbitYaw) * profile.horizDist,
        profile.height,
        currentTarget.z - Math.cos(orbitYaw) * profile.horizDist
      );

      // LookAt dynamically adjusts to keep character in lower-middle third
      const lookAtY = currentTarget.y + (profile.height - 1.62) * 0.08;
      camera.lookAt(currentTarget.x, lookAtY, currentTarget.z);
    },

    handleResize(newWidth: number, newHeight: number) {
      if (newWidth <= 0 || newHeight <= 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    },

    setZoom(factor: number) {
      // Maps zoom factor to distance: factor 0.23 -> MIN (5m), factor 1.0 -> DEFAULT (22m), factor 2.5 -> MAX (55m)
      const targetDist = defaultDistance * factor;
      targetDistance = Math.max(
        MIN_CAMERA_DISTANCE,
        Math.min(MAX_CAMERA_DISTANCE, targetDist)
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
      pitchOffset = Math.max(-0.25, Math.min(0.40, pitchOffset + deltaPitch));
    },

    resetOrbit() {
      pitchOffset = 0;
      orbitYaw = 0;
      targetDistance = defaultDistance;
    },

    getTargetDistance() {
      return targetDistance;
    },
  };
}
