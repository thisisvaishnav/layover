import * as THREE from "three";

export interface CoffeeShopNPC {
  group: THREE.Group;
  /** Update is called each animation frame (idle animation) */
  update(deltaSeconds: number, isConversationOpen: boolean): void;
  dispose(): void;
}

export interface CoffeeShopSystem {
  /** Root Three.js group — add this to the scene */
  group: THREE.Group;
  /** World position of the NPC (center of interaction) */
  npcWorldPosition: { x: number; z: number };
  /** Radius within which the interaction prompt should show */
  interactionRadius: number;
  /** Per-frame update (NPC idle animation) */
  update(deltaSeconds: number, isConversationOpen: boolean): void;
  dispose(): void;
}

/**
 * Creates a low-poly street-side chai/coffee stall with an NPC vendor.
 * Consistent with the existing terracotta+cream city aesthetic.
 *
 * @param worldX  X coordinate for the stall (Three.js world space)
 * @param worldZ  Z coordinate for the stall
 * @param rotationY  Y-axis rotation — the counter, sign and vendor sit on the
 *                   local +Z side, so rotate to face the side players arrive from
 */
export function createCoffeeShop(worldX: number, worldZ: number, rotationY = 0): CoffeeShopSystem {
  const group = new THREE.Group();
  group.position.set(worldX, 0, worldZ);
  group.rotation.y = rotationY;
  group.scale.set(2.0, 2.0, 2.0); // 2x size
  group.name = "CoffeeShopStall";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  function regGeo<T extends THREE.BufferGeometry>(g: T): T {
    geometries.push(g);
    return g;
  }
  function regMat<T extends THREE.Material>(m: T): T {
    materials.push(m);
    return m;
  }

  // ---- MATERIALS ----
  const counterMat   = regMat(new THREE.MeshLambertMaterial({ color: 0xb5651d })); // brown wood
  const roofMat      = regMat(new THREE.MeshLambertMaterial({ color: 0xc0392b })); // deep red canopy
  const poleMat      = regMat(new THREE.MeshLambertMaterial({ color: 0x795548 })); // dark wood poles
  const tableMat     = regMat(new THREE.MeshLambertMaterial({ color: 0xd4a76a })); // light wood table
  const chairMat     = regMat(new THREE.MeshLambertMaterial({ color: 0xa0522d })); // saddlebrown
  const cupMat       = regMat(new THREE.MeshLambertMaterial({ color: 0xfff8e7 })); // cream cup
  const cupLiqMat    = regMat(new THREE.MeshLambertMaterial({ color: 0x4e2400 })); // dark chai
  const signMat      = regMat(new THREE.MeshLambertMaterial({ color: 0xf5c518 })); // golden sign
  const shadowMat    = regMat(new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  }));

  // NPC materials
  const skinMat  = regMat(new THREE.MeshLambertMaterial({ color: 0xd4956b })); // warm skin
  const shirtMat = regMat(new THREE.MeshLambertMaterial({ color: 0xfff0d0 })); // cream kurta
  const dhotiMat = regMat(new THREE.MeshLambertMaterial({ color: 0xffffff })); // white dhoti

  // ---- COUNTER / STALL BASE ----
  // Main counter (rectangular block)
  const counterGeo = regGeo(new THREE.BoxGeometry(5, 1.0, 1.4));
  const counter = new THREE.Mesh(counterGeo, counterMat);
  counter.position.set(0, 0.5, 0);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Counter top (slightly lighter)
  const topMat = regMat(new THREE.MeshLambertMaterial({ color: 0xd4860d }));
  const topGeo = regGeo(new THREE.BoxGeometry(5.1, 0.08, 1.5));
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, 1.04, 0);
  top.castShadow = true;
  group.add(top);

  // ---- CANOPY / ROOF ----
  // Support poles
  const poleGeo = regGeo(new THREE.CylinderGeometry(0.07, 0.07, 2.8, 8));
  const polePositions = [
    [-2.4, 1.4, -0.9],
    [ 2.4, 1.4, -0.9],
    [-2.4, 1.4,  0.9],
    [ 2.4, 1.4,  0.9],
  ] as [number, number, number][];

  for (const [px, py, pz] of polePositions) {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(px, py, pz);
    pole.castShadow = true;
    group.add(pole);
  }

  // Canopy (slanted roof)
  const canopyGeo = regGeo(new THREE.BoxGeometry(5.6, 0.12, 2.8));
  const canopy = new THREE.Mesh(canopyGeo, roofMat);
  canopy.position.set(0, 2.85, -0.2);
  canopy.rotation.x = -0.08; // Slight forward tilt
  canopy.castShadow = true;
  group.add(canopy);

  // Canopy front valance (decorative strip)
  const valanceGeo = regGeo(new THREE.BoxGeometry(5.6, 0.35, 0.06));
  const valance = new THREE.Mesh(valanceGeo, roofMat);
  valance.position.set(0, 2.68, 1.37);
  group.add(valance);

  // ---- SIGN ----
  const signGeo = regGeo(new THREE.BoxGeometry(2.4, 0.5, 0.06));
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 2.42, 1.35);
  group.add(sign);

  // ---- SMALL TABLE (customer side) ----
  const tableTopGeo = regGeo(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 8));
  const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
  tableTop.position.set(-1.8, 0.75, 3.0);
  tableTop.castShadow = true;
  group.add(tableTop);

  const tableLegGeo = regGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.75, 6));
  const tableLeg = new THREE.Mesh(tableLegGeo, poleMat);
  tableLeg.position.set(-1.8, 0.375, 3.0);
  group.add(tableLeg);

  // ---- CUPS ON COUNTER ----
  const cupGeo = regGeo(new THREE.CylinderGeometry(0.13, 0.1, 0.28, 8));
  const liqGeo = regGeo(new THREE.CylinderGeometry(0.11, 0.09, 0.06, 8));
  const cupPositions = [[0.8, 1.1, -0.2], [1.2, 1.1, -0.2], [1.6, 1.1, -0.2]] as [number,number,number][];
  for (const [cx, cy, cz] of cupPositions) {
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(cx, cy, cz);
    cup.castShadow = true;
    group.add(cup);
    const liq = new THREE.Mesh(liqGeo, cupLiqMat);
    liq.position.set(cx, cy + 0.11, cz);
    group.add(liq);
  }

  // ---- STOOL / CHAIR (behind counter) ----
  const seatGeo = regGeo(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 8));
  const seat = new THREE.Mesh(seatGeo, chairMat);
  seat.position.set(-0.2, 0.55, -1.1);
  seat.castShadow = true;
  group.add(seat);

  const seatLegGeo = regGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6));
  const seatLeg = new THREE.Mesh(seatLegGeo, poleMat);
  seatLeg.position.set(-0.2, 0.275, -1.1);
  group.add(seatLeg);

  // ---- GROUND SHADOW ----
  const shadowGeo = regGeo(new THREE.PlaneGeometry(6, 4));
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  shadow.renderOrder = 1;
  group.add(shadow);

  // ---- NPC (Murugan the chai vendor) ----
  const npcGroup = new THREE.Group();
  npcGroup.position.set(-0.2, 0, -0.9);
  npcGroup.name = "MuruganNPC";
  // Proportional within 2x scaled stall group -> effective world scale 2.0x
  npcGroup.scale.set(1.0, 1.0, 1.0);

  // Torso (kurta)
  const torsoGeo = regGeo(new THREE.BoxGeometry(0.55, 0.7, 0.28));
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.28;
  torso.castShadow = true;
  npcGroup.add(torso);

  // Head
  const headGeo = regGeo(new THREE.SphereGeometry(0.27, 14, 12));
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.8;
  head.castShadow = true;
  npcGroup.add(head);

  // Arms — pivoted at shoulders for idle animation
  const armGeo = regGeo(new THREE.BoxGeometry(0.18, 0.58, 0.18));

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.38, 1.55, 0);
  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.y = -0.28;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  npcGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.38, 1.55, 0);
  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.y = -0.28;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  npcGroup.add(rightArmPivot);

  // Legs
  const legGeo = regGeo(new THREE.BoxGeometry(0.22, 0.75, 0.22));
  const leftLeg = new THREE.Mesh(legGeo, dhotiMat);
  leftLeg.position.set(-0.15, 0.5, 0);
  leftLeg.castShadow = true;
  npcGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, dhotiMat);
  rightLeg.position.set(0.15, 0.5, 0);
  rightLeg.castShadow = true;
  npcGroup.add(rightLeg);

  // NPC faces toward the counter/player side
  npcGroup.rotation.y = Math.PI; // Face toward +Z (where the player approaches)
  group.add(npcGroup);

  // ---- NPC HIGHLIGHT BEACON & INTERACTION AURA ----
  const highlightGroup = new THREE.Group();
  highlightGroup.name = "MuruganHighlight";
  highlightGroup.position.set(-0.2, 0, -0.9);

  // 1. Translucent Glowing Vertical Cylinder Beacon
  const beaconGeo = regGeo(new THREE.CylinderGeometry(1.15, 1.15, 4.0, 24, 1, true));
  const beaconMat = regMat(
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.y = 2.0;
  highlightGroup.add(beaconMesh);

  // 2. Ground Interaction Pulse Rings
  const groundRingGeo = regGeo(new THREE.RingGeometry(0.85, 1.25, 32));
  const groundRingMat = regMat(
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.04;
  highlightGroup.add(groundRing);

  // 3. Overhead Floating Diamond Interaction Badge
  const badgeGeo = regGeo(new THREE.OctahedronGeometry(0.28, 0));
  const badgeMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.75,
      metalness: 0.5,
      roughness: 0.3,
    })
  );
  const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
  badgeMesh.position.y = 4.2;
  highlightGroup.add(badgeMesh);

  group.add(highlightGroup);

  // ---- NPC WORLD POSITION ----
  // The player interacts with Murugan here: 2 units in front of the counter
  // (local +Z), rotated with the stall so it stays on the customer side.
  const npcWorldPosition = {
    x: worldX + Math.sin(rotationY) * 2.0,
    z: worldZ + Math.cos(rotationY) * 2.0,
  };

  // ---- ANIMATION STATE ----
  let idleTime = 0;

  function update(deltaSeconds: number, isConversationOpen: boolean): void {
    idleTime += deltaSeconds;

    // Animate glowing highlight beacon and floating badge
    beaconMat.opacity = 0.25 + Math.sin(idleTime * 3.2) * 0.09;
    beaconMesh.rotation.y += deltaSeconds * 0.4;
    groundRing.scale.setScalar(1.0 + Math.sin(idleTime * 2.8) * 0.08);
    badgeMesh.position.y = 4.2 + Math.sin(idleTime * 3.0) * 0.12;
    badgeMesh.rotation.y += deltaSeconds * 1.5;

    if (isConversationOpen) {
      // Animated "talking" — gentle arm sway
      const talkSwing = Math.sin(idleTime * 3.5) * 0.18;
      leftArmPivot.rotation.x  =  talkSwing * 0.7;
      rightArmPivot.rotation.x = -talkSwing;
      // Subtle body lean toward player
      npcGroup.rotation.y = Math.PI + Math.sin(idleTime * 0.6) * 0.05;
    } else {
      // Idle — very subtle breathing / weight shift
      const breathe = Math.sin(idleTime * 0.9) * 0.04;
      leftArmPivot.rotation.x  =  breathe * 0.5;
      rightArmPivot.rotation.x = -breathe * 0.5;
      torso.position.y = 1.28 + Math.sin(idleTime * 0.9) * 0.008;
    }
  }

  function dispose(): void {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
  }

  return {
    group,
    npcWorldPosition,
    interactionRadius: 12,
    update,
    dispose,
  };
}

/**
 * Pure function: returns true if the player is within interaction range of the NPC.
 * Intentionally exported separately so it can be unit-tested without Three.js.
 */
export function isWithinInteractionRange(
  playerX: number,
  playerZ: number,
  npcX: number,
  npcZ: number,
  radius: number
): boolean {
  const dx = playerX - npcX;
  const dz = playerZ - npcZ;
  return dx * dx + dz * dz <= radius * radius;
}
