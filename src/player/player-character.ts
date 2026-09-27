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
// Scaled ~2.405x (30% bigger than 1.85x) for strong visual presence and clear visibility in 3D world
  group.scale.set(2.405, 2.405, 2.405);

// Materials matching the reference avatar
  const skinMaterial = new THREE.MeshLambertMaterial({ color: 0x8d5524 }); // Rich warm brown skin tone
  const clothingMaterial = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Vibrant sky-blue outfit
  const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x18181b }); // Black hair
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); // Dark pupils
  const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x9e5b2e }); // Nose highlight
  const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x7c4621 }); // Warm brown shoes

  // Geometries - Head & Face
  const headGeo = new THREE.BoxGeometry(0.34, 0.40, 0.32);
  const hairGeo = new THREE.BoxGeometry(0.36, 0.12, 0.34);
  const hairFringeGeo = new THREE.BoxGeometry(0.34, 0.05, 0.04);
  const earGeo = new THREE.BoxGeometry(0.04, 0.09, 0.07);
  const eyeGeo = new THREE.BoxGeometry(0.045, 0.045, 0.03);
  const noseGeo = new THREE.BoxGeometry(0.05, 0.07, 0.06);

  // Geometries - Neck & Torso
  const neckGeo = new THREE.CylinderGeometry(0.09, 0.10, 0.16, 12);
  const collarGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.05, 12);
  const torsoGeo = new THREE.BoxGeometry(0.58, 0.54, 0.32);
  const shoulderCapGeo = new THREE.SphereGeometry(0.11, 12, 10);
  const shirtHemGeo = new THREE.BoxGeometry(0.60, 0.07, 0.34);
  const pelvisGeo = new THREE.BoxGeometry(0.52, 0.18, 0.30);

  // Geometries - Arms (Short-sleeve shirt + bare forearms + hands)
  const sleeveGeo = new THREE.BoxGeometry(0.18, 0.28, 0.18);
  const cuffGeo = new THREE.BoxGeometry(0.19, 0.04, 0.19);
  const forearmGeo = new THREE.BoxGeometry(0.14, 0.30, 0.14);
  const handGeo = new THREE.BoxGeometry(0.13, 0.11, 0.14);

  // Geometries - Legs (Matching blue trousers + brown shoes)
  const thighGeo = new THREE.BoxGeometry(0.21, 0.42, 0.22);
  const calfGeo = new THREE.BoxGeometry(0.18, 0.42, 0.19);
  const shoeGeo = new THREE.BoxGeometry(0.20, 0.09, 0.28);

  // 1. Torso Assembly (Center at y = 1.34)
  const torso = new THREE.Mesh(torsoGeo, clothingMaterial);
  torso.position.y = 1.34;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  const shirtHem = new THREE.Mesh(shirtHemGeo, clothingMaterial);
  shirtHem.position.y = 1.05;
  shirtHem.castShadow = true;
  shirtHem.receiveShadow = true;
  group.add(shirtHem);

  const pelvis = new THREE.Mesh(pelvisGeo, clothingMaterial);
  pelvis.position.y = 0.98;
  pelvis.castShadow = true;
  pelvis.receiveShadow = true;
  group.add(pelvis);

  const collar = new THREE.Mesh(collarGeo, clothingMaterial);
  collar.position.y = 1.62;
  collar.castShadow = true;
  group.add(collar);

  const leftShoulderCap = new THREE.Mesh(shoulderCapGeo, clothingMaterial);
  leftShoulderCap.position.set(-0.34, 1.56, 0);
  leftShoulderCap.castShadow = true;
  group.add(leftShoulderCap);

  const rightShoulderCap = new THREE.Mesh(shoulderCapGeo, clothingMaterial);
  rightShoulderCap.position.set(0.34, 1.56, 0);
  rightShoulderCap.castShadow = true;
  group.add(rightShoulderCap);

  // 2. Neck
  const neck = new THREE.Mesh(neckGeo, skinMaterial);
  neck.position.y = 1.68;
  neck.castShadow = true;
  group.add(neck);

  // 3. Head & Facial Features Group
  const headGroup = new THREE.Group();
  headGroup.name = "headGroup";
  headGroup.position.y = 1.88;

  const head = new THREE.Mesh(headGeo, skinMaterial);
  head.castShadow = true;
  headGroup.add(head);

  const hair = new THREE.Mesh(hairGeo, hairMaterial);
  hair.position.set(0, 0.16, -0.01);
  hair.castShadow = true;
  headGroup.add(hair);

  const hairFringe = new THREE.Mesh(hairFringeGeo, hairMaterial);
  hairFringe.position.set(0, 0.10, 0.16);
  headGroup.add(hairFringe);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.185, 0, 0);
  leftEar.castShadow = true;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.185, 0, 0);
  rightEar.castShadow = true;
  headGroup.add(rightEar);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.08, 0.02, 0.165);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.08, 0.02, 0.165);
  headGroup.add(rightEye);

  const nose = new THREE.Mesh(noseGeo, noseMaterial);
  nose.position.set(0, -0.02, 0.18);
  nose.castShadow = true;
  headGroup.add(nose);

  group.add(headGroup);

  // 4. Left Arm (pivot at shoulder: y = 1.52, x = -0.38)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.name = "leftArmPivot";
  leftArmPivot.position.set(-0.38, 1.52, 0);

  const leftSleeve = new THREE.Mesh(sleeveGeo, clothingMaterial);
  leftSleeve.position.y = -0.14;
  leftSleeve.castShadow = true;
  leftArmPivot.add(leftSleeve);

  const leftCuff = new THREE.Mesh(cuffGeo, clothingMaterial);
  leftCuff.position.y = -0.27;
  leftCuff.castShadow = true;
  leftArmPivot.add(leftCuff);

  const leftForearm = new THREE.Mesh(forearmGeo, skinMaterial);
  leftForearm.position.y = -0.42;
  leftForearm.castShadow = true;
  leftArmPivot.add(leftForearm);

  const leftHand = new THREE.Mesh(handGeo, skinMaterial);
  leftHand.position.set(0, -0.59, 0.01);
  leftHand.castShadow = true;
  leftArmPivot.add(leftHand);

  group.add(leftArmPivot);

  // 5. Right Arm (pivot at shoulder: y = 1.52, x = 0.38)
  const rightArmPivot = new THREE.Group();
  rightArmPivot.name = "rightArmPivot";
  rightArmPivot.position.set(0.38, 1.52, 0);

  const rightSleeve = new THREE.Mesh(sleeveGeo, clothingMaterial);
  rightSleeve.position.y = -0.14;
  rightSleeve.castShadow = true;
  rightArmPivot.add(rightSleeve);

  const rightCuff = new THREE.Mesh(cuffGeo, clothingMaterial);
  rightCuff.position.y = -0.27;
  rightCuff.castShadow = true;
  rightArmPivot.add(rightCuff);

  const rightForearm = new THREE.Mesh(forearmGeo, skinMaterial);
  rightForearm.position.y = -0.42;
  rightForearm.castShadow = true;
  rightArmPivot.add(rightForearm);

  const rightHand = new THREE.Mesh(handGeo, skinMaterial);
  rightHand.position.set(0, -0.59, 0.01);
  rightHand.castShadow = true;
  rightArmPivot.add(rightHand);

  group.add(rightArmPivot);

  // 6. Left Leg (pivot at hip: y = 0.90, x = -0.16)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.name = "leftLegPivot";
  leftLegPivot.position.set(-0.16, 0.90, 0);

  const leftThigh = new THREE.Mesh(thighGeo, clothingMaterial);
  leftThigh.position.y = -0.21;
  leftThigh.castShadow = true;
  leftLegPivot.add(leftThigh);

  const leftKneePivot = new THREE.Group();
  leftKneePivot.name = "leftKneePivot";
  leftKneePivot.position.set(0, -0.42, 0);

  const leftCalf = new THREE.Mesh(calfGeo, clothingMaterial);
  leftCalf.position.y = -0.19;
  leftCalf.castShadow = true;
  leftKneePivot.add(leftCalf);

  const leftShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  leftShoe.position.set(0, -0.435, 0.035);
  leftShoe.castShadow = true;
  leftKneePivot.add(leftShoe);

  leftLegPivot.add(leftKneePivot);
  group.add(leftLegPivot);

  // 7. Right Leg (pivot at hip: y = 0.90, x = 0.16)
  const rightLegPivot = new THREE.Group();
  rightLegPivot.name = "rightLegPivot";
  rightLegPivot.position.set(0.16, 0.90, 0);

  const rightThigh = new THREE.Mesh(thighGeo, clothingMaterial);
  rightThigh.position.y = -0.21;
  rightThigh.castShadow = true;
  rightLegPivot.add(rightThigh);

  const rightKneePivot = new THREE.Group();
  rightKneePivot.name = "rightKneePivot";
  rightKneePivot.position.set(0, -0.42, 0);

  const rightCalf = new THREE.Mesh(calfGeo, clothingMaterial);
  rightCalf.position.y = -0.19;
  rightCalf.castShadow = true;
  rightKneePivot.add(rightCalf);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  rightShoe.position.set(0, -0.435, 0.035);
  rightShoe.castShadow = true;
  rightKneePivot.add(rightShoe);

  rightLegPivot.add(rightKneePivot);
  group.add(rightLegPivot);

  // 8. Subtle contact shadow disk beneath feet (at y = 0.02)
  const shadowGeo = new THREE.CircleGeometry(0.45, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  let walkCycleTime = 0;

  return {
    group,
    update(state: PlayerState, deltaSeconds: number) {
      // 1. Update 3D world position (X, Y with gravity, and Z)
      group.position.set(state.position.x, state.position.y ?? 0, state.position.z);

      // 2. Update rotation around Y axis
      group.rotation.y = state.rotation;

      // 3. Procedural limb swing when moving
      if (state.isMoving) {
        // Synchronized stepping frequency for brisk stride (14.11 units/s)
        walkCycleTime += deltaSeconds * 10.56;

        // Expressive leg stride amplitude (0.64 rad / ~36.6 degrees)
        const hipSwing = Math.sin(walkCycleTime) * 0.64;

        // Opposite hip swing for human bipedal gait
        leftLegPivot.rotation.x = hipSwing;
        rightLegPivot.rotation.x = -hipSwing;

        // Articulated knee bending: knee flexes backwards during rear push-off & recovery, straightens forward
        leftKneePivot.rotation.x = Math.max(0.04, hipSwing * 1.35);
        rightKneePivot.rotation.x = Math.max(0.04, -hipSwing * 1.35);

        // Counter-balanced arm swing matching energetic stride
        leftArmPivot.rotation.x = -hipSwing * 0.85;
        rightArmPivot.rotation.x = hipSwing * 0.85;

        // Dynamic vertical bounce with each step
        const bob = Math.abs(Math.sin(walkCycleTime)) * 0.038;
        torso.position.y = 1.34 + bob;
        shirtHem.position.y = 1.05 + bob;
        pelvis.position.y = 0.98 + bob * 0.5;
        collar.position.y = 1.62 + bob;
        leftShoulderCap.position.y = 1.56 + bob;
        rightShoulderCap.position.y = 1.56 + bob;
        neck.position.y = 1.68 + bob;
        headGroup.position.y = 1.88 + bob;
      } else {
        // Return limbs smoothly to resting position (frame-rate independent decay)
        const decay = Math.exp(-15.0 * deltaSeconds);
        leftLegPivot.rotation.x *= decay;
        rightLegPivot.rotation.x *= decay;
        leftKneePivot.rotation.x *= decay;
        rightKneePivot.rotation.x *= decay;
        leftArmPivot.rotation.x *= decay;
        rightArmPivot.rotation.x *= decay;
        torso.position.y = 1.34;
        shirtHem.position.y = 1.05;
        pelvis.position.y = 0.98;
        collar.position.y = 1.62;
        leftShoulderCap.position.y = 1.56;
        rightShoulderCap.position.y = 1.56;
        neck.position.y = 1.68;
        headGroup.position.y = 1.88;
      }
    },
    dispose() {
      headGeo.dispose();
      hairGeo.dispose();
      hairFringeGeo.dispose();
      earGeo.dispose();
      eyeGeo.dispose();
      noseGeo.dispose();
      neckGeo.dispose();
      collarGeo.dispose();
      torsoGeo.dispose();
      shoulderCapGeo.dispose();
      shirtHemGeo.dispose();
      pelvisGeo.dispose();
      sleeveGeo.dispose();
      cuffGeo.dispose();
      forearmGeo.dispose();
      handGeo.dispose();
      thighGeo.dispose();
      calfGeo.dispose();
      shoeGeo.dispose();
      shadowGeo.dispose();

      skinMaterial.dispose();
      clothingMaterial.dispose();
      hairMaterial.dispose();
      eyeMaterial.dispose();
      noseMaterial.dispose();
      shoeMaterial.dispose();
      shadowMat.dispose();
    },
  };
}
