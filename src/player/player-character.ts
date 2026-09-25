import * as THREE from "three";
import type { PlayerState } from "./movement-controller";

export interface PlayerCharacter {
  group: THREE.Group;
  update(state: PlayerState, deltaSeconds: number): void;
  dispose(): void;
}

/**
 * Creates a simple procedural 3D human character.
 * Visibly features: head, torso/body, two arms, and two legs.
 * Stands directly on the ground (feet at y = 0).
 */
export function createPlayerCharacter(): PlayerCharacter {
  const group = new THREE.Group();
  group.name = "PlayerCharacter";

  // Materials
  const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xf5cba7 }); // Warm skin tone
  const shirtMaterial = new THREE.MeshLambertMaterial({ color: 0x2563eb }); // Vibrant blue shirt/jacket
  const pantsMaterial = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Slate dark pants
  const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Dark shoes

  // Geometries
  const headGeo = new THREE.SphereGeometry(0.3, 16, 14);
  const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.35);
  const armGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
  const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.24);
  const shoeGeo = new THREE.BoxGeometry(0.25, 0.12, 0.32);

  // 1. Torso / Body (y from ~0.9 to ~1.65, center at y = 1.3)
  const torso = new THREE.Mesh(torsoGeo, shirtMaterial);
  torso.position.y = 1.3;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // 2. Head (center at y = 1.85)
  const head = new THREE.Mesh(headGeo, skinMaterial);
  head.position.y = 1.85;
  head.castShadow = true;
  group.add(head);

  // Add subtle face direction marker (tiny low-poly nose/visor)
  const visorGeo = new THREE.BoxGeometry(0.18, 0.08, 0.12);
  const visorMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.85, 0.28);
  group.add(visor);

  // 3. Left Arm (pivot at shoulder: y = 1.55, x = -0.45)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.45, 1.55, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, shirtMaterial);
  leftArmMesh.position.y = -0.3; // Hang down from shoulder pivot
  leftArmMesh.castShadow = true;
  leftArmPivot.add(leftArmMesh);
  group.add(leftArmPivot);

  // 4. Right Arm (pivot at shoulder: y = 1.55, x = 0.45)
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.45, 1.55, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, shirtMaterial);
  rightArmMesh.position.y = -0.3;
  rightArmMesh.castShadow = true;
  rightArmPivot.add(rightArmMesh);
  group.add(rightArmPivot);

  // 5. Left Leg (pivot at hip: y = 0.9, x = -0.18)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, 0.9, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMaterial);
  leftLegMesh.position.y = -0.42; // Center of leg hanging from hip
  leftLegMesh.castShadow = true;
  leftLegPivot.add(leftLegMesh);

  // Left Shoe (at y = 0.06 relative to world, so y = -0.84 relative to hip)
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  leftShoe.position.set(0, -0.84, 0.04);
  leftShoe.castShadow = true;
  leftLegPivot.add(leftShoe);
  group.add(leftLegPivot);

  // 6. Right Leg (pivot at hip: y = 0.9, x = 0.18)
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, 0.9, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMaterial);
  rightLegMesh.position.y = -0.42;
  rightLegMesh.castShadow = true;
  rightLegPivot.add(rightLegMesh);

  // Right Shoe
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  rightShoe.position.set(0, -0.84, 0.04);
  rightShoe.castShadow = true;
  rightLegPivot.add(rightShoe);
  group.add(rightLegPivot);

  // Subtle contact shadow disk beneath feet
  const shadowGeo = new THREE.CircleGeometry(0.45, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02; // Just above ground
  group.add(shadowMesh);

  let walkCycleTime = 0;

  return {
    group,
    update(state: PlayerState, deltaSeconds: number) {
      // 1. Update 3D world position (X and Z on ground plane y = 0)
      group.position.set(state.position.x, 0, state.position.z);

      // 2. Update rotation around Y axis
      group.rotation.y = state.rotation;

      // 3. Procedural limb swing when moving
      if (state.isMoving) {
        walkCycleTime += deltaSeconds * 4.6; // Synchronized stepping frequency for 5.8 units/s walk
        const swing = Math.sin(walkCycleTime) * 0.34; // Natural human swing angle

        // Opposite swing for natural human gait
        leftLegPivot.rotation.x = swing;
        rightLegPivot.rotation.x = -swing;
        leftArmPivot.rotation.x = -swing * 0.85;
        rightArmPivot.rotation.x = swing * 0.85;

        // Subtle, smooth vertical bobbing (1 bob per step)
        const bob = Math.abs(Math.sin(walkCycleTime)) * 0.028;
        torso.position.y = 1.3 + bob;
        head.position.y = 1.85 + bob;
        visor.position.y = 1.85 + bob;
      } else {
        // Return limbs smoothly to resting position (frame-rate independent decay)
        const decay = Math.exp(-15.0 * deltaSeconds);
        leftLegPivot.rotation.x *= decay;
        rightLegPivot.rotation.x *= decay;
        leftArmPivot.rotation.x *= decay;
        rightArmPivot.rotation.x *= decay;
        torso.position.y = 1.3;
        head.position.y = 1.85;
        visor.position.y = 1.85;
      }
    },
    dispose() {
      headGeo.dispose();
      torsoGeo.dispose();
      armGeo.dispose();
      legGeo.dispose();
      shoeGeo.dispose();
      visorGeo.dispose();
      shadowGeo.dispose();

      skinMaterial.dispose();
      shirtMaterial.dispose();
      pantsMaterial.dispose();
      shoeMaterial.dispose();
      visorMat.dispose();
      shadowMat.dispose();
    },
  };
}
