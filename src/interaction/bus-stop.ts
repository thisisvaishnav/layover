import * as THREE from "three";

export interface BusStopNPC {
  group: THREE.Group;
  update(deltaSeconds: number, isConversationOpen: boolean): void;
  dispose(): void;
}

export interface BusStopSystem {
  group: THREE.Group;
  busStopWorldPosition: { x: number; z: number };
  conductorWorldPosition: { x: number; z: number };
  npcWorldPosition: { x: number; z: number };
  interactionRadius: number;
  update(deltaSeconds: number, isConversationOpen: boolean): void;
  dispose(): void;
}

/**
 * Creates a low-poly modern street-side bus stop shelter with an NPC conductor.
 * Located on the west terracotta footpath of Central Park, facing West towards the road.
 *
 * @param worldX  X coordinate for the bus stop (Three.js world space)
 * @param worldZ  Z coordinate for the bus stop
 * @param options Optional configuration including orientation rotation
 */
export function createBusStop(
  worldX: number,
  worldZ: number,
  options?: { rotation?: number }
): BusStopSystem {
  const rotationY = options?.rotation ?? -Math.PI / 2; // Orient shelter facing West (-X) towards the road
  // Shelter is 40% wider/deeper than before (2.0 -> 2.8); height reduced 30% from 4.2 -> 2.94
  const SHELTER_SCALE_X = 2.8;
  const SHELTER_SCALE_Y = 2.94;
  const SHELTER_SCALE_Z = 2.8;
  const NPC_WORLD_SCALE = 2.0; // Conductor keeps a natural 2x human scale inside the bigger shelter
  const group = new THREE.Group();
  group.position.set(worldX, 0, worldZ);
  group.rotation.y = rotationY;
  group.scale.set(SHELTER_SCALE_X, SHELTER_SCALE_Y, SHELTER_SCALE_Z);
  group.name = "BusStopShelter";

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
  const frameMat      = regMat(new THREE.MeshLambertMaterial({ color: 0x1e293b })); // dark steel frame
  const roofMat       = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // dark slate roof
  const glassMat      = regMat(new THREE.MeshLambertMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
  }));
  const benchWoodMat  = regMat(new THREE.MeshLambertMaterial({ color: 0xb45309 })); // amber teak
  const benchLegMat   = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // dark iron
  const signPoleMat   = regMat(new THREE.MeshLambertMaterial({ color: 0x334155 })); // gray pole
  const signYellowMat = regMat(new THREE.MeshLambertMaterial({ color: 0xfacc15 })); // transit yellow
  const signBlueMat   = regMat(new THREE.MeshLambertMaterial({ color: 0x1d4ed8 })); // route blue
  const signWhiteMat  = regMat(new THREE.MeshLambertMaterial({ color: 0xffffff })); // text white
  const shadowMat     = regMat(new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.20,
    depthWrite: false,
  }));

  // Conductor NPC materials
  const skinMat        = regMat(new THREE.MeshLambertMaterial({ color: 0xd4956b })); // warm skin
  const shirtMat       = regMat(new THREE.MeshLambertMaterial({ color: 0x0284c7 })); // sky blue transit shirt
  const pantsMat       = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // navy trousers
  const capMat         = regMat(new THREE.MeshLambertMaterial({ color: 0x0c1222 })); // navy peaked cap
  const badgeMat       = regMat(new THREE.MeshLambertMaterial({ color: 0xf59e0b })); // gold badge

  // ---- SHELTER CANOPY & POSTS ----
  // 4 steel support poles
  const poleGeo = regGeo(new THREE.CylinderGeometry(0.07, 0.07, 2.9, 8));
  const polePositions = [
    [-3.0, 1.45, -1.0],
    [ 3.0, 1.45, -1.0],
    [-3.0, 1.45,  1.0],
    [ 3.0, 1.45,  1.0],
  ] as [number, number, number][];

  for (const [px, py, pz] of polePositions) {
    const pole = new THREE.Mesh(poleGeo, frameMat);
    pole.position.set(px, py, pz);
    pole.castShadow = true;
    group.add(pole);
  }

  // Cantilevered Roof Canopy (angled slightly backward for water runoff)
  const canopyGeo = regGeo(new THREE.BoxGeometry(6.6, 0.12, 2.8));
  const canopy = new THREE.Mesh(canopyGeo, roofMat);
  canopy.position.set(0, 2.9, 0);
  canopy.rotation.x = 0.05;
  canopy.castShadow = true;
  group.add(canopy);

  // Roof front fascia strip
  const fasciaGeo = regGeo(new THREE.BoxGeometry(6.6, 0.25, 0.06));
  const fascia = new THREE.Mesh(fasciaGeo, frameMat);
  fascia.position.set(0, 2.8, 1.38);
  group.add(fascia);

  // ---- BACK GLASS WALL ----
  const backGlassGeo = regGeo(new THREE.BoxGeometry(5.9, 2.4, 0.06));
  const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
  backGlass.position.set(0, 1.35, -0.98);
  group.add(backGlass);

  // Back glass frame bottom/top horizontal rails
  const railGeo = regGeo(new THREE.BoxGeometry(6.0, 0.08, 0.08));
  const bottomRail = new THREE.Mesh(railGeo, frameMat);
  bottomRail.position.set(0, 0.16, -0.98);
  group.add(bottomRail);
  const midRail = new THREE.Mesh(railGeo, frameMat);
  midRail.position.set(0, 1.35, -0.98);
  group.add(midRail);

  // Side Glass Wall (Left / North side)
  const sideGlassGeo = regGeo(new THREE.BoxGeometry(0.06, 2.4, 1.9));
  const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
  sideGlass.position.set(-2.98, 1.35, 0);
  group.add(sideGlass);

  // ---- PASSENGER BENCH ----
  const benchSlatGeo = regGeo(new THREE.BoxGeometry(3.8, 0.06, 0.16));
  for (let s = 0; s < 3; s++) {
    const slat = new THREE.Mesh(benchSlatGeo, benchWoodMat);
    slat.position.set(0, 0.52, -0.75 + s * 0.18);
    slat.castShadow = true;
    group.add(slat);
  }

  // Bench Backrest
  const backrestGeo = regGeo(new THREE.BoxGeometry(3.8, 0.35, 0.06));
  const backrest = new THREE.Mesh(backrestGeo, benchWoodMat);
  backrest.position.set(0, 0.85, -0.85);
  backrest.castShadow = true;
  group.add(backrest);

  // Bench metal legs
  const benchLegGeo = regGeo(new THREE.BoxGeometry(0.08, 0.52, 0.45));
  const legL = new THREE.Mesh(benchLegGeo, benchLegMat);
  legL.position.set(-1.6, 0.26, -0.58);
  group.add(legL);
  const legR = new THREE.Mesh(benchLegGeo, benchLegMat);
  legR.position.set(1.6, 0.26, -0.58);
  group.add(legR);

  // ---- BUS STOP TOTEM SIGNPOST ----
  const totemPoleGeo = regGeo(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 8));
  const totemPole = new THREE.Mesh(totemPoleGeo, signPoleMat);
  totemPole.position.set(3.8, 1.8, 1.2);
  totemPole.castShadow = true;
  group.add(totemPole);

  // Round top bus roundel
  const roundelGeo = regGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16));
  const roundel = new THREE.Mesh(roundelGeo, signYellowMat);
  roundel.rotation.x = Math.PI / 2;
  roundel.position.set(3.8, 3.4, 1.2);
  roundel.castShadow = true;
  group.add(roundel);

  // Route Sign Plate ("23C T NAGAR")
  const signPlateGeo = regGeo(new THREE.BoxGeometry(1.4, 0.7, 0.08));
  const signPlate = new THREE.Mesh(signPlateGeo, signBlueMat);
  signPlate.position.set(3.8, 2.7, 1.2);
  signPlate.castShadow = true;
  group.add(signPlate);

  const signStripeGeo = regGeo(new THREE.BoxGeometry(1.3, 0.18, 0.09));
  const signStripe = new THREE.Mesh(signStripeGeo, signWhiteMat);
  signStripe.position.set(3.8, 2.7, 1.2);
  group.add(signStripe);

  // Timetable Schedule Display Box
  const timetableGeo = regGeo(new THREE.BoxGeometry(0.7, 1.0, 0.08));
  const timetable = new THREE.Mesh(timetableGeo, frameMat);
  timetable.position.set(3.8, 1.6, 1.2);
  group.add(timetable);

  const timetablePaperGeo = regGeo(new THREE.BoxGeometry(0.6, 0.88, 0.09));
  const timetablePaper = new THREE.Mesh(timetablePaperGeo, signWhiteMat);
  timetablePaper.position.set(3.8, 1.6, 1.2);
  group.add(timetablePaper);

  // ---- GROUND SHADOW ----
  const shadowGeo = regGeo(new THREE.PlaneGeometry(7.2, 3.6));
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  shadow.renderOrder = 1;
  group.add(shadow);

  // ---- NPC CONDUCTOR (Suresh the Bus Conductor) ----
  const npcGroup = new THREE.Group();
  npcGroup.position.set(2.4, 0, 0.2);
  npcGroup.name = "SureshConductorNPC";
  // Maintain natural human proportions (effective world scale 2.0x) inside the 40% larger shelter
  npcGroup.scale.set(
    NPC_WORLD_SCALE / SHELTER_SCALE_X,
    NPC_WORLD_SCALE / SHELTER_SCALE_Y,
    NPC_WORLD_SCALE / SHELTER_SCALE_Z
  );

  // Torso (blue uniform shirt)
  const torsoGeo = regGeo(new THREE.BoxGeometry(0.52, 0.7, 0.28));
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.28;
  torso.castShadow = true;
  npcGroup.add(torso);

  // Conductor Gold Badge on pocket
  const badgeGeo = regGeo(new THREE.BoxGeometry(0.08, 0.08, 0.02));
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0.14, 1.45, 0.15);
  npcGroup.add(badge);

  // Head
  const headGeo = regGeo(new THREE.SphereGeometry(0.26, 14, 12));
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.78;
  head.castShadow = true;
  npcGroup.add(head);

  // Peaked transit conductor cap
  const capCrownGeo = regGeo(new THREE.CylinderGeometry(0.28, 0.27, 0.16, 14));
  const capCrown = new THREE.Mesh(capCrownGeo, capMat);
  capCrown.position.y = 1.95;
  npcGroup.add(capCrown);

  const visorGeo = regGeo(new THREE.BoxGeometry(0.26, 0.03, 0.14));
  const visor = new THREE.Mesh(visorGeo, capMat);
  visor.position.set(0, 1.90, 0.22);
  visor.rotation.x = 0.25;
  npcGroup.add(visor);

  // Arms
  const armGeo = regGeo(new THREE.BoxGeometry(0.16, 0.58, 0.16));

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.36, 1.55, 0);
  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.y = -0.28;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  npcGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.36, 1.55, 0);
  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.y = -0.28;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);

  // Ticket dispenser machine in right hand
  const ticketMachineGeo = regGeo(new THREE.BoxGeometry(0.18, 0.22, 0.12));
  const ticketMachine = new THREE.Mesh(ticketMachineGeo, frameMat);
  ticketMachine.position.set(0, -0.48, 0.10);
  rightArmPivot.add(ticketMachine);

  npcGroup.add(rightArmPivot);

  // Legs (navy trousers)
  const legGeo = regGeo(new THREE.BoxGeometry(0.20, 0.75, 0.20));
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.14, 0.5, 0);
  leftLeg.castShadow = true;
  npcGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.14, 0.5, 0);
  rightLeg.castShadow = true;
  npcGroup.add(rightLeg);

  // Conductor faces toward the road in front of the shelter (local +Z -> world -X)
  npcGroup.rotation.y = 0;
  group.add(npcGroup);

  // ---- NPC HIGHLIGHT BEACON & INTERACTION AURA ----
  const highlightGroup = new THREE.Group();
  highlightGroup.name = "SureshHighlight";
  highlightGroup.position.set(2.4, 0, 0.2);

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
  const diamondGeo = regGeo(new THREE.OctahedronGeometry(0.28, 0));
  const diamondMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.75,
      metalness: 0.5,
      roughness: 0.3,
    })
  );
  const badgeMesh = new THREE.Mesh(diamondGeo, diamondMat);
  badgeMesh.position.y = 4.2;
  highlightGroup.add(badgeMesh);

  group.add(highlightGroup);

  // ---- WORLD POSITIONS ----
  const busStopWorldPosition = { x: worldX, z: worldZ };
  const localNpcX = 2.4 * SHELTER_SCALE_X;
  const localNpcZ = 0.2 * SHELTER_SCALE_Z;
  // Conductor world position accounting for shelter orientation
  const conductorWorldPosition = {
    x: Number((worldX + localNpcX * Math.cos(rotationY) + localNpcZ * Math.sin(rotationY)).toFixed(4)),
    z: Number((worldZ - localNpcX * Math.sin(rotationY) + localNpcZ * Math.cos(rotationY)).toFixed(4)),
  };
  const npcWorldPosition = conductorWorldPosition;

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
      // Conductor speaking animation — raising ticket machine and body gesture
      const talkWave = Math.sin(idleTime * 4.0) * 0.22;
      rightArmPivot.rotation.x = -0.5 + talkWave;
      leftArmPivot.rotation.x  =  0.2 + talkWave * 0.5;
      npcGroup.rotation.y = Math.sin(idleTime * 0.8) * 0.08;
    } else {
      // Idle — calm breathing and weight shift facing the road
      const breathe = Math.sin(idleTime * 1.0) * 0.05;
      leftArmPivot.rotation.x  =  breathe * 0.4;
      rightArmPivot.rotation.x = -breathe * 0.4;
      torso.position.y = 1.28 + Math.sin(idleTime * 1.0) * 0.007;
      npcGroup.rotation.y = 0;
    }
  }

  function dispose(): void {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
  }

  return {
    group,
    busStopWorldPosition,
    conductorWorldPosition,
    npcWorldPosition,
    interactionRadius: 12,
    update,
    dispose,
  };
}

/**
 * Pure function: returns true if the player is within interaction range of the bus stop.
 */
export function isWithinBusStopRange(
  playerX: number,
  playerZ: number,
  stopX: number,
  stopZ: number,
  radius: number
): boolean {
  const dx = playerX - stopX;
  const dz = playerZ - stopZ;
  return dx * dx + dz * dz <= radius * radius;
}
