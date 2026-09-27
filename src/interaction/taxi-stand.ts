import * as THREE from "three";
import { buildRoadCarModel } from "../map/car-builder";

export interface TaxiStandSystem {
  group: THREE.Group;
  taxiStandWorldPosition: { x: number; z: number };
  driverWorldPosition: { x: number; z: number };
  npcWorldPosition: { x: number; z: number };
  interactionRadius: number;
  countryCode: string;
  update(deltaSeconds: number, isConversationOpen: boolean): void;
  dispose(): void;
}

export interface TaxiStandOptions {
  countryCode?: string;
  /** Y-axis rotation in radians. Default 0 keeps the bays running east-west. */
  rotation?: number;
}

/**
 * Creates a low-poly modern street-side taxi stand / cab stop with:
 * - Marked taxi boarding bays with yellow hazard striping
 * - Waiting passenger shelter with bench and canopy
 * - Illuminated "TAXI STAND" totem signpost
 * - Country-specific stationed famous local taxis (Spain, India, Japan, France, Italy, NYC)
 * - Friendly local Taxi Driver NPC with greeting beacon aura
 *
 * @param worldX  X coordinate for the taxi stand (Three.js world space)
 * @param worldZ  Z coordinate for the taxi stand
 * @param options Country code configuration (e.g. 'es', 'hi', 'ja', 'fr', 'it') and stand rotation
 */
export function createTaxiStand(
  worldX: number,
  worldZ: number,
  options?: TaxiStandOptions
): TaxiStandSystem {
  const countryCode = options?.countryCode || "es";
  const rotationY = options?.rotation ?? 0;
  const STAND_SCALE = 2.0; // 2x size of taxi stand
  const group = new THREE.Group();
  group.position.set(worldX, 0, worldZ);
  group.rotation.y = rotationY;
  group.scale.setScalar(STAND_SCALE);
  group.name = "TaxiStandSystem";

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

  // ----------------------------------------------------
  // 1. Shared Materials
  // ----------------------------------------------------
  const asphaltMat     = regMat(new THREE.MeshLambertMaterial({ color: 0x333d47 })); // Clean taxi bay tarmac
  const yellowLineMat  = regMat(new THREE.MeshBasicMaterial({ color: 0xfacc15 })); // Bright taxi yellow paint
  const whitePaintMat  = regMat(new THREE.MeshBasicMaterial({ color: 0xf1f5f9 })); // White stall markings
  const frameMat       = regMat(new THREE.MeshLambertMaterial({ color: 0x1e293b })); // Dark slate steel frame
  const shelterRoofMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // Dark canopy
  const glassMat       = regMat(
    new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
    })
  );
  const benchWoodMat   = regMat(new THREE.MeshLambertMaterial({ color: 0xb45309 })); // Amber teak slats
  const signPoleMat    = regMat(new THREE.MeshLambertMaterial({ color: 0x475569 })); // Steel pole
  const taxiYellowMat  = regMat(new THREE.MeshLambertMaterial({ color: 0xfacc15 })); // Canary yellow
  const taxiGlowMat    = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff085,
      emissive: 0xfacc15,
      emissiveIntensity: 0.95,
    })
  );

  const chromeMat     = regMat(new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));

  // ----------------------------------------------------
  // 2. Taxi Bay Pavement & Ground Markings
  // ----------------------------------------------------
  // Tarmac pad for 2 parked cabs (length 32m, width 10m)
  const tarmacGeo = regGeo(new THREE.PlaneGeometry(32, 10));
  const tarmac = new THREE.Mesh(tarmacGeo, asphaltMat);
  tarmac.name = "TaxiBay-Pad";
  tarmac.rotation.x = -Math.PI / 2;
  tarmac.position.set(0, 0.02, 0);
  tarmac.receiveShadow = true;
  group.add(tarmac);

  // Yellow Taxi Bay Border Box
  const borderHGeo = regGeo(new THREE.PlaneGeometry(31.6, 0.22));
  const borderVGeo = regGeo(new THREE.PlaneGeometry(0.22, 9.6));

  const borderN = new THREE.Mesh(borderHGeo, yellowLineMat);
  borderN.name = "TaxiBay-Border-N";
  borderN.rotation.x = -Math.PI / 2;
  borderN.position.set(0, 0.03, 4.8);
  group.add(borderN);

  const borderS = new THREE.Mesh(borderHGeo, yellowLineMat);
  borderS.name = "TaxiBay-Border-S";
  borderS.rotation.x = -Math.PI / 2;
  borderS.position.set(0, 0.03, -4.8);
  group.add(borderS);

  const borderW = new THREE.Mesh(borderVGeo, yellowLineMat);
  borderW.name = "TaxiBay-Border-W";
  borderW.rotation.x = -Math.PI / 2;
  borderW.position.set(-15.8, 0.03, 0);
  group.add(borderW);

  const borderE = new THREE.Mesh(borderVGeo, yellowLineMat);
  borderE.name = "TaxiBay-Border-E";
  borderE.rotation.x = -Math.PI / 2;
  borderE.position.set(15.8, 0.03, 0);
  group.add(borderE);

  // Bay divider between Cab 1 and Cab 2
  const divider = new THREE.Mesh(borderVGeo, whitePaintMat);
  divider.name = "TaxiBay-Divider";
  divider.rotation.x = -Math.PI / 2;
  divider.position.set(0, 0.03, 0);
  group.add(divider);

  // Painted "TAXI" lettering stripes in each bay
  let sIndex = 0;
  const stripeGeo = regGeo(new THREE.PlaneGeometry(3.6, 0.35));
  [-7.5, 7.5].forEach((bx) => {
    [-2.2, 0, 2.2].forEach((bz) => {
      const stripe = new THREE.Mesh(stripeGeo, yellowLineMat);
      stripe.name = `TaxiBay-Stripe-${sIndex++}`;
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(bx, 0.035, bz);
      group.add(stripe);
    });
  });

  // ----------------------------------------------------
  // 3. Waiting Shelter & Canopy
  // ----------------------------------------------------
  const shelterGroup = new THREE.Group();
  shelterGroup.name = "TaxiStandShelter";
  shelterGroup.position.set(-5.0, 0, 5.8); // Along pedestrian side of bay

  // Upright steel posts
  const postGeo = regGeo(new THREE.BoxGeometry(0.14, 3.2, 0.14));
  [-3.0, 0, 3.0].forEach((px) => {
    const post = new THREE.Mesh(postGeo, frameMat);
    post.position.set(px, 1.6, 0);
    post.castShadow = true;
    shelterGroup.add(post);
  });

  // Curved glass windbreak back wall
  const backGlassGeo = regGeo(new THREE.BoxGeometry(6.4, 2.3, 0.06));
  const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
  backGlass.name = "TaxiShelterGlass";
  backGlass.position.set(0, 1.7, 0);
  shelterGroup.add(backGlass);

  // Cantilevered Roof Canopy
  const roofCanopyGeo = regGeo(new THREE.BoxGeometry(7.2, 0.16, 2.4));
  const roofCanopy = new THREE.Mesh(roofCanopyGeo, shelterRoofMat);
  roofCanopy.name = "TaxiShelterCanopy";
  roofCanopy.position.set(0, 3.2, -0.6);
  roofCanopy.castShadow = true;
  shelterGroup.add(roofCanopy);

  // Passenger Bench inside shelter
  const benchSlatGeo = regGeo(new THREE.BoxGeometry(4.8, 0.06, 0.42));
  const benchSeat = new THREE.Mesh(benchSlatGeo, benchWoodMat);
  benchSeat.name = "TaxiShelterBench";
  benchSeat.position.set(0, 0.52, -0.3);
  benchSeat.castShadow = true;
  shelterGroup.add(benchSeat);

  const benchLegGeo = regGeo(new THREE.BoxGeometry(0.08, 0.52, 0.38));
  [-1.8, 1.8].forEach((lx) => {
    const leg = new THREE.Mesh(benchLegGeo, frameMat);
    leg.position.set(lx, 0.26, -0.3);
    shelterGroup.add(leg);
  });

  group.add(shelterGroup);

  // ----------------------------------------------------
  // 4. Illuminated "TAXI STAND" Totem Signpost
  // ----------------------------------------------------
  const totemGroup = new THREE.Group();
  totemGroup.name = "TaxiStandTotem";
  totemGroup.position.set(8.5, 0, 5.6);

  const totemPoleGeo = regGeo(new THREE.CylinderGeometry(0.09, 0.09, 4.4, 10));
  const totemPole = new THREE.Mesh(totemPoleGeo, signPoleMat);
  totemPole.position.y = 2.2;
  totemPole.castShadow = true;
  totemGroup.add(totemPole);

  // Rectangular Taxi Sign Board
  const signBoardGeo = regGeo(new THREE.BoxGeometry(1.6, 0.9, 0.14));
  const signBoard = new THREE.Mesh(signBoardGeo, taxiYellowMat);
  signBoard.position.y = 3.6;
  signBoard.castShadow = true;
  totemGroup.add(signBoard);

  // Black TAXI emblem strip
  const signInnerGeo = regGeo(new THREE.BoxGeometry(1.4, 0.65, 0.16));
  const signInnerMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a }));
  const signInner = new THREE.Mesh(signInnerGeo, signInnerMat);
  signInner.position.y = 3.6;
  totemGroup.add(signInner);

  // Glowing Taxi Globe Beacon on top
  const globeGeo = regGeo(new THREE.SphereGeometry(0.32, 16, 12));
  const globe = new THREE.Mesh(globeGeo, taxiGlowMat);
  globe.position.y = 4.45;
  totemGroup.add(globe);

  group.add(totemGroup);

  // Safety queue bollards separating sidewalk and road
  const bollardGeo = regGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8));
  [-14.0, -10.0, 10.0, 14.0].forEach((bx) => {
    const bollard = new THREE.Mesh(bollardGeo, chromeMat);
    bollard.position.set(bx, 0.45, 5.0);
    bollard.castShadow = true;
    group.add(bollard);
  });

  // ----------------------------------------------------
  // 5. Stationed Taxi Cabs (Identical to Cars Moving on the Road)
  // ----------------------------------------------------
  const taxiTGroup = new THREE.Group();
  taxiTGroup.name = "StationedTaxis";

  // Determine cab names and styling based on country code
  let leadName = "NYCTaxi-1";
  let leadColor = 0xfacc15; // Canary yellow taxi matching road car
  let secondName = "NYCTaxi-2";
  let secondColor = 0xfacc15;

  if (countryCode === "es") {
    leadName = "BarcelonaTaxi";
    leadColor = 0xfacc15;
    secondName = "MadridTaxi";
    secondColor = 0xf8fafc;
  } else if (countryCode === "hi") {
    leadName = "KaaliPeeliTaxi";
    leadColor = 0xfacc15;
    secondName = "AutoRickshaw";
    secondColor = 0x059669;
  } else if (countryCode === "ja") {
    leadName = "TokyoCrownTaxi";
    leadColor = 0xfacc15;
    secondName = "NihonKotsuTaxi";
    secondColor = 0x064e3b;
  } else if (countryCode === "fr") {
    leadName = "ParisTaxi-1";
    leadColor = 0x2563eb;
    secondName = "ParisTaxi-2";
    secondColor = 0xfacc15;
  } else if (countryCode === "it") {
    leadName = "RomeTaxi-1";
    leadColor = 0xf8fafc;
    secondName = "RomeTaxi-2";
    secondColor = 0xfacc15;
  }

  // Lead Cab in Bay 1 (x = 7.5, facing East along road: rotation.y = Math.PI / 2)
  // Scaled 1.0 within 2.0x taxi stand -> exact 2.0x world scale matching cars moving on the road
  const leadCab = buildRoadCarModel({
    color: leadColor,
    isTaxi: true,
    scale: 1.0,
    name: leadName,
    regGeo,
    regMat,
  });
  leadCab.group.position.set(7.5, 0, -1.0);
  leadCab.group.rotation.y = Math.PI / 2;
  taxiTGroup.add(leadCab.group);

  // Second Cab in Bay 2 (x = -7.5, facing East along road: rotation.y = Math.PI / 2)
  // Scaled 1.0 within 2.0x taxi stand -> exact 2.0x world scale matching cars moving on the road
  const secondCab = buildRoadCarModel({
    color: secondColor,
    isTaxi: true,
    scale: 1.0,
    name: secondName,
    regGeo,
    regMat,
  });
  secondCab.group.position.set(-7.5, 0, -1.0);
  secondCab.group.rotation.y = Math.PI / 2;
  taxiTGroup.add(secondCab.group);

  group.add(taxiTGroup);

  // ----------------------------------------------------
  // 6. Friendly Taxi Driver NPC with Beacon Aura
  // ----------------------------------------------------
  const npcGroup = new THREE.Group();
  npcGroup.name = "TaxiDriverNPC";
  // Positioned by the driver's door of the lead cab
  npcGroup.position.set(2.4, 0, 2.2);
  // Proportional within 2x scaled taxi stand -> effective world scale 2.0x
  npcGroup.scale.set(1.0, 1.0, 1.0);

  const skinMat    = regMat(new THREE.MeshLambertMaterial({ color: 0xd4956b })); // Natural warm skin
  const shirtMat   = regMat(new THREE.MeshLambertMaterial({ color: 0x2563eb })); // Royal blue driver jacket
  const pantsMat   = regMat(new THREE.MeshLambertMaterial({ color: 0x1e293b })); // Navy trousers
  const capMat     = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // Peaked driver cap
  const badgeMat   = regMat(new THREE.MeshBasicMaterial({ color: 0xfacc15 })); // Gold badge

  // Torso
  const torso = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.52, 0.70, 0.28)), shirtMat);
  torso.position.y = 1.28;
  torso.castShadow = true;
  npcGroup.add(torso);

  // Gold driver ID badge on chest
  const badge = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.08, 0.08, 0.02)), badgeMat);
  badge.position.set(0.14, 1.45, 0.15);
  npcGroup.add(badge);

  // Head
  const head = new THREE.Mesh(regGeo(new THREE.SphereGeometry(0.26, 14, 12)), skinMat);
  head.position.y = 1.78;
  head.castShadow = true;
  npcGroup.add(head);

  // Peaked Driver Cap
  const capCrown = new THREE.Mesh(regGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 12)), capMat);
  capCrown.position.y = 1.95;
  npcGroup.add(capCrown);

  const capPeak = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.26, 0.04, 0.16)), capMat);
  capPeak.position.set(0, 1.91, 0.25);
  npcGroup.add(capPeak);

  // Arms with clipboard/manifest
  const armGeo = regGeo(new THREE.BoxGeometry(0.18, 0.65, 0.18));

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

  // Driver route manifest / map in right hand
  const clipboard = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.16, 0.24, 0.04)), benchWoodMat);
  clipboard.position.set(0, -0.48, 0.10);
  rightArmPivot.add(clipboard);

  npcGroup.add(rightArmPivot);

  // Legs
  const legGeo = regGeo(new THREE.BoxGeometry(0.20, 0.75, 0.20));
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.14, 0.5, 0);
  leftLeg.castShadow = true;
  npcGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.14, 0.5, 0);
  rightLeg.castShadow = true;
  npcGroup.add(rightLeg);

  group.add(npcGroup);

  // ---- NPC HIGHLIGHT BEACON AURA ----
  const highlightGroup = new THREE.Group();
  highlightGroup.name = "TaxiDriverHighlight";
  highlightGroup.position.set(2.4, 0, 2.2);

  // 1. Translucent Glowing Vertical Cylinder Beacon
  const beaconGeo = regGeo(new THREE.CylinderGeometry(1.25, 1.25, 4.2, 24, 1, true));
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
  beaconMesh.position.y = 2.1;
  highlightGroup.add(beaconMesh);

  // 2. Ground Interaction Pulse Rings
  const groundRingGeo = regGeo(new THREE.RingGeometry(0.9, 1.35, 32));
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

  // 3. Floating Overhead Diamond Badge
  const badgeGeo = regGeo(new THREE.OctahedronGeometry(0.30, 0));
  const badgeDiamondMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
    })
  );
  const badgeMesh = new THREE.Mesh(badgeGeo, badgeDiamondMat);
  badgeMesh.position.y = 4.4;
  highlightGroup.add(badgeMesh);

  group.add(highlightGroup);

  // World coordinates of interaction point
  const taxiStandWorldPosition = { x: worldX, z: worldZ };
  // Driver NPC local offset (2.4, 2.2) scaled by the stand scale and rotated with the stand
  const driverLocalX = 2.4 * STAND_SCALE;
  const driverLocalZ = 2.2 * STAND_SCALE;
  const driverWorldPosition = {
    x: Number((worldX + driverLocalX * Math.cos(rotationY) + driverLocalZ * Math.sin(rotationY)).toFixed(4)),
    z: Number((worldZ - driverLocalX * Math.sin(rotationY) + driverLocalZ * Math.cos(rotationY)).toFixed(4)),
  };
  const npcWorldPosition = driverWorldPosition;

  let idleTime = 0;

  function update(deltaSeconds: number, isConversationOpen: boolean): void {
    idleTime += deltaSeconds;

    // Pulse beacon aura
    const pulse = Math.sin(idleTime * 2.8) * 0.5 + 0.5;
    beaconMat.opacity = 0.18 + pulse * 0.16;
    groundRing.scale.setScalar(1.0 + pulse * 0.18);
    badgeMesh.rotation.y += deltaSeconds * 1.8;
    badgeMesh.position.y = 4.4 + Math.sin(idleTime * 2.2) * 0.14;

    if (isConversationOpen) {
      // Driver talking gesture
      const talkWave = Math.sin(idleTime * 4.0) * 0.22;
      rightArmPivot.rotation.x = -0.55 + talkWave;
      leftArmPivot.rotation.x  =  0.20 + talkWave * 0.4;
      npcGroup.rotation.y = Math.sin(idleTime * 0.8) * 0.10;
    } else {
      // Subtle idle breathing
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
    taxiStandWorldPosition,
    driverWorldPosition,
    npcWorldPosition,
    interactionRadius: 12,
    countryCode,
    update,
    dispose,
  };
}

/**
 * Pure function: returns true if the player is within interaction range of the taxi stand.
 */
export function isWithinTaxiStandRange(
  playerX: number,
  playerZ: number,
  standX: number,
  standZ: number,
  radius: number = 12
): boolean {
  const dx = playerX - standX;
  const dz = playerZ - standZ;
  return dx * dx + dz * dz <= radius * radius;
}
