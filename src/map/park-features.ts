import * as THREE from "three";
import type { PlotData } from "./map-generator";

export interface ParkFeaturesOptions {
  countryCode?: string;
  regGeo: <T extends THREE.BufferGeometry>(geo: T) => T;
  regMat: <T extends THREE.Material>(mat: T) => T;
  clickableObjects: THREE.Object3D[];
  obstacleObjects: THREE.Object3D[];
}

export type TreeType = "pine" | "oak" | "blossom" | "cypress";
export type TreeSize = "small" | "medium" | "large";

interface TreeConfig {
  x: number;
  z: number;
  type: TreeType;
  size: TreeSize;
}

/**
 * Builds diverse trees, park tables, benches, and country-specific memorial in the central park.
 */
export function buildParkFeatures(
  plot: PlotData,
  parent: THREE.Group,
  options: ParkFeaturesOptions
): void {
  const { countryCode = "es", regGeo, regMat, clickableObjects, obstacleObjects } = options;

  // ----------------------------------------------------
  // 1. Shared Materials for Park Features
  // ----------------------------------------------------
  // Bark & Wood
  const darkTrunkMat = regMat(new THREE.MeshLambertMaterial({ color: 0x5c3a1e })); // Warm walnut
  const warmTrunkMat = regMat(new THREE.MeshLambertMaterial({ color: 0x7d5732 })); // Light oak brown
  const tableWoodMat = regMat(new THREE.MeshLambertMaterial({ color: 0x9c6230 })); // Warm teak/cedar
  const ironMat = regMat(new THREE.MeshLambertMaterial({ color: 0x374151 })); // Slate iron

  // Foliage Materials
  const pineDarkMat = regMat(new THREE.MeshLambertMaterial({ color: 0x245842 })); // Deep evergreen
  const pineLightMat = regMat(new THREE.MeshLambertMaterial({ color: 0x387d5e })); // Bright pine
  const oakRichMat = regMat(new THREE.MeshLambertMaterial({ color: 0x488f28 })); // Bright leaf green
  const oakOliveMat = regMat(new THREE.MeshLambertMaterial({ color: 0x58a82d })); // Vibrant meadow green
  const blossomDeepMat = regMat(new THREE.MeshLambertMaterial({ color: 0xf472b6 })); // Sakura rose pink
  const blossomLightMat = regMat(new THREE.MeshLambertMaterial({ color: 0xfbcfe8 })); // Cherry blossom blush
  const cypressMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1c4725 })); // Crisp cypress

  // Park Bench & Stone Materials
  const benchSlatMat = regMat(new THREE.MeshLambertMaterial({ color: 0xb47312 })); // Varnished golden timber
  const memorialStoneMat = regMat(new THREE.MeshLambertMaterial({ color: 0xf1f5f9 })); // Bright polished limestone
  const memorialBaseMat = regMat(new THREE.MeshLambertMaterial({ color: 0xa4b3c6 })); // Slate granite
  const memorialGoldMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.65,
      roughness: 0.35,
    })
  );
  const bronzeMat = regMat(new THREE.MeshLambertMaterial({ color: 0x8a4515 })); // Warm cast bronze
  const waterPoolMat = regMat(
    new THREE.MeshLambertMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.88,
    })
  );

  // Flag and Heraldic Accent Materials
  const flagRedMat = regMat(new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
  const flagYellowMat = regMat(new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
  const flagBlueMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }));
  const flagGreenMat = regMat(new THREE.MeshLambertMaterial({ color: 0x15803d }));
  const flagSaffronMat = regMat(new THREE.MeshLambertMaterial({ color: 0xf97316 }));
  const flagWhiteMat = regMat(new THREE.MeshLambertMaterial({ color: 0xffffff }));
  const flagNavyMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a }));

  // Flower materials
  const flowerOrangeMat = regMat(new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
  const flowerPinkMat = regMat(new THREE.MeshLambertMaterial({ color: 0xec4899 }));

  // ----------------------------------------------------
  // 2. Procedural Tree Generator
  // ----------------------------------------------------
  function createTree(type: TreeType, size: TreeSize, index: number): THREE.Group {
    const treeGroup = new THREE.Group();
    treeGroup.name = `${plot.id}-park-tree-${index}`;
    treeGroup.userData = { treeType: type, treeSize: size };

    // Scale factors: trees are double in size (2x)
    const s = size === "small" ? 0.75 : size === "large" ? 1.35 : 1.0;
    const hScale = 2.5; // Doubled from 1.25
    const wScale = 1.7; // Doubled from 0.85

    if (type === "pine") {
      // 1. Conifer / Pine Tree (2.5x tall)
      const trunkH = 1.8 * s * hScale;
      const trunkR = 0.28 * s * wScale;
      const trunkGeo = regGeo(new THREE.CylinderGeometry(trunkR * 0.75, trunkR, trunkH, 6));
      const trunk = new THREE.Mesh(trunkGeo, darkTrunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // 3 tiered conical needles
      const tiers = [
        { r: 2.2 * s * wScale, h: 2.2 * s * hScale, y: trunkH + 0.6 * s * hScale, mat: pineDarkMat },
        { r: 1.7 * s * wScale, h: 2.0 * s * hScale, y: trunkH + 1.8 * s * hScale, mat: pineLightMat },
        { r: 1.2 * s * wScale, h: 1.7 * s * hScale, y: trunkH + 2.9 * s * hScale, mat: pineDarkMat },
      ];

      tiers.forEach((tier, tIdx) => {
        const coneGeo = regGeo(new THREE.ConeGeometry(tier.r, tier.h, 6));
        const coneMesh = new THREE.Mesh(coneGeo, tier.mat);
        coneMesh.name = `${plot.id}-park-tree-foliage-${tIdx}-${index}`;
        coneMesh.position.y = tier.y;
        coneMesh.castShadow = true;
        treeGroup.add(coneMesh);
      });
    } else if (type === "oak") {
      // 2. Broadleaf Deciduous Oak Tree (2.5x tall)
      const trunkH = 2.2 * s * hScale;
      const trunkR = 0.38 * s * wScale;
      const trunkGeo = regGeo(new THREE.CylinderGeometry(trunkR * 0.8, trunkR * 1.15, trunkH, 7));
      const trunk = new THREE.Mesh(trunkGeo, warmTrunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Main canopy rounded cluster
      const crownR = 2.0 * s * wScale;
      const crownGeo = regGeo(new THREE.DodecahedronGeometry(crownR, 1));
      const crownMesh = new THREE.Mesh(crownGeo, oakRichMat);
      crownMesh.name = `${plot.id}-park-tree-foliage-main-${index}`;
      crownMesh.scale.set(1.0, 1.25, 1.0);
      crownMesh.position.y = trunkH + crownR * 0.85;
      crownMesh.castShadow = true;
      treeGroup.add(crownMesh);

      // Flanking secondary foliage clumps
      const clump1Geo = regGeo(new THREE.DodecahedronGeometry(crownR * 0.65, 1));
      const clump1 = new THREE.Mesh(clump1Geo, oakOliveMat);
      clump1.name = `${plot.id}-park-tree-foliage-clump1-${index}`;
      clump1.scale.set(1.0, 1.2, 1.0);
      clump1.position.set(-0.7 * s * wScale, trunkH + crownR * 0.7, 0.4 * s * wScale);
      clump1.castShadow = true;
      treeGroup.add(clump1);

      const clump2Geo = regGeo(new THREE.DodecahedronGeometry(crownR * 0.6, 1));
      const clump2 = new THREE.Mesh(clump2Geo, oakOliveMat);
      clump2.name = `${plot.id}-park-tree-foliage-clump2-${index}`;
      clump2.scale.set(1.0, 1.2, 1.0);
      clump2.position.set(0.6 * s * wScale, trunkH + crownR * 0.95, -0.5 * s * wScale);
      clump2.castShadow = true;
      treeGroup.add(clump2);
    } else if (type === "blossom") {
      // 3. Flowering Cherry Blossom / Sakura Tree (2.5x tall)
      const trunkH = 1.9 * s * hScale;
      const trunkR = 0.3 * s * wScale;
      const trunkGeo = regGeo(new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 6));
      const trunk = new THREE.Mesh(trunkGeo, darkTrunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Puffy blossom foliage clusters
      const blossomR = 1.7 * s * wScale;
      const blossomMainGeo = regGeo(new THREE.DodecahedronGeometry(blossomR, 1));
      const blossomMain = new THREE.Mesh(blossomMainGeo, blossomDeepMat);
      blossomMain.name = `${plot.id}-park-tree-foliage-blossom-${index}`;
      blossomMain.scale.set(1.0, 1.2, 1.0);
      blossomMain.position.y = trunkH + blossomR * 0.8;
      blossomMain.castShadow = true;
      treeGroup.add(blossomMain);

      const blossomSubGeo = regGeo(new THREE.DodecahedronGeometry(blossomR * 0.7, 1));
      const blossomSub = new THREE.Mesh(blossomSubGeo, blossomLightMat);
      blossomSub.name = `${plot.id}-park-tree-foliage-sub-${index}`;
      blossomSub.scale.set(1.0, 1.2, 1.0);
      blossomSub.position.set(0.5 * s * wScale, trunkH + blossomR * 1.15, 0.3 * s * wScale);
      blossomSub.castShadow = true;
      treeGroup.add(blossomSub);
    } else {
      // 4. Slender Columnar Cypress / Poplar Tree (2.5x tall)
      const trunkH = 1.0 * s * hScale;
      const trunkR = 0.22 * s * wScale;
      const trunkGeo = regGeo(new THREE.CylinderGeometry(trunkR, trunkR * 1.1, trunkH, 6));
      const trunk = new THREE.Mesh(trunkGeo, warmTrunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Tall narrow spire foliage
      const cypressH = 4.2 * s * hScale;
      const cypressR = 0.85 * s * wScale;
      const cypressGeo = regGeo(new THREE.ConeGeometry(cypressR, cypressH, 8));
      const cypress = new THREE.Mesh(cypressGeo, cypressMat);
      cypress.name = `${plot.id}-park-tree-foliage-cypress-${index}`;
      cypress.position.y = trunkH + cypressH / 2;
      cypress.castShadow = true;
      treeGroup.add(cypress);
    }

    return treeGroup;
  }

  const scaleFactor = plot.width >= 120 ? 2 : 1;

  // Diverse tree distribution: 20 trees across the expanded lawn
  const baseTreeConfigs: TreeConfig[] = [
    // 4 Grand Oaks at the four corners of the lawn
    { x: -20, z: -20, type: "oak", size: "large" },
    { x: 20, z: -20, type: "oak", size: "large" },
    { x: -20, z: 20, type: "oak", size: "large" },
    { x: 20, z: 20, type: "oak", size: "large" },

    // 4 Cherry Blossom Trees flanking the cardinal approaches
    { x: -11, z: -17, type: "blossom", size: "medium" },
    { x: 11, z: -17, type: "blossom", size: "medium" },
    { x: -11, z: 17, type: "blossom", size: "medium" },
    { x: 11, z: 17, type: "blossom", size: "medium" },

    // 6 Conifer / Pines along outer lawn borders
    { x: -22, z: -6, type: "pine", size: "medium" },
    { x: -22, z: 6, type: "pine", size: "small" },
    { x: 22, z: -6, type: "pine", size: "medium" },
    { x: 22, z: 6, type: "pine", size: "large" },
    { x: -6, z: -22, type: "pine", size: "small" },
    { x: 6, z: -22, type: "pine", size: "medium" },

    // 6 Columnar Cypresses along perimeter walkways
    { x: -25, z: -13, type: "cypress", size: "large" },
    { x: -25, z: 13, type: "cypress", size: "medium" },
    { x: 25, z: -13, type: "cypress", size: "large" },
    { x: 25, z: 13, type: "cypress", size: "medium" },
    { x: -13, z: 25, type: "cypress", size: "medium" },
    { x: 13, z: 25, type: "cypress", size: "large" },
  ];

  const treeConfigs: TreeConfig[] = baseTreeConfigs.map((cfg) => ({
    ...cfg,
    x: cfg.x * scaleFactor,
    z: cfg.z * scaleFactor,
  }));

  treeConfigs.forEach((cfg, i) => {
    const tree = createTree(cfg.type, cfg.size, i);
    tree.position.set(cfg.x, 0.15, cfg.z);
    parent.add(tree);
  });

  // ----------------------------------------------------
  // 3. Park Amenities: Tables, Benches & Planters
  // ----------------------------------------------------
  // Furniture matches the player avatar scale so seat/table heights fit a person
  const PERSON_SCALE = 2.405;

  function createPicnicTable(index: number): THREE.Group {
    const tableGroup = new THREE.Group();
    tableGroup.name = `${plot.id}-park-table-${index}`;
    tableGroup.scale.set(PERSON_SCALE, PERSON_SCALE, PERSON_SCALE);

    // Tabletop
    const topGeo = regGeo(new THREE.BoxGeometry(2.4, 0.08, 1.2));
    const tabletop = new THREE.Mesh(topGeo, tableWoodMat);
    tabletop.position.y = 0.82;
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    tableGroup.add(tabletop);
    clickableObjects.push(tabletop);
    obstacleObjects.push(tabletop);

    // Bench seats (left and right)
    const benchGeo = regGeo(new THREE.BoxGeometry(2.4, 0.06, 0.42));
    const leftBench = new THREE.Mesh(benchGeo, tableWoodMat);
    leftBench.position.set(0, 0.46, -0.85);
    leftBench.castShadow = true;
    leftBench.receiveShadow = true;
    tableGroup.add(leftBench);
    clickableObjects.push(leftBench);
    obstacleObjects.push(leftBench);

    const rightBench = new THREE.Mesh(benchGeo, tableWoodMat);
    rightBench.position.set(0, 0.46, 0.85);
    rightBench.castShadow = true;
    rightBench.receiveShadow = true;
    tableGroup.add(rightBench);
    clickableObjects.push(rightBench);
    obstacleObjects.push(rightBench);

    // Leg supports (A-frame legs)
    const legGeo = regGeo(new THREE.BoxGeometry(0.12, 0.78, 1.9));
    const leg1 = new THREE.Mesh(legGeo, ironMat);
    leg1.position.set(-0.85, 0.40, 0);
    leg1.castShadow = true;
    tableGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, ironMat);
    leg2.position.set(0.85, 0.40, 0);
    leg2.castShadow = true;
    tableGroup.add(leg2);

    return tableGroup;
  }

  // 4 Picnic Tables under the shade of trees
  const baseTablePositions: [number, number, number][] = [
    [-18, -12, 0],
    [-18, 12, 0],
    [18, -12, 0],
    [18, 12, 0],
  ];

  const tablePositions: [number, number, number][] = baseTablePositions.map(([tx, tz, rotY]) => [
    tx * scaleFactor,
    tz * scaleFactor,
    rotY,
  ]);

  tablePositions.forEach(([tx, tz, rotY], i) => {
    const table = createPicnicTable(i);
    table.position.set(tx, 0.15, tz);
    table.rotation.y = rotY;
    parent.add(table);
  });

  // 4 Park Resting Benches along the terracotta footpath loops
  function createParkBench(index: number): THREE.Group {
    const benchGroup = new THREE.Group();
    benchGroup.name = `${plot.id}-park-bench-${index}`;
    benchGroup.scale.set(PERSON_SCALE, PERSON_SCALE, PERSON_SCALE);

    // Seat plank
    const seatGeo = regGeo(new THREE.BoxGeometry(1.8, 0.06, 0.52));
    const seat = new THREE.Mesh(seatGeo, benchSlatMat);
    seat.position.y = 0.48;
    seat.castShadow = true;
    benchGroup.add(seat);
    clickableObjects.push(seat);
    obstacleObjects.push(seat);

    // Backrest plank
    const backGeo = regGeo(new THREE.BoxGeometry(1.8, 0.40, 0.05));
    const back = new THREE.Mesh(backGeo, benchSlatMat);
    back.position.set(0, 0.78, -0.24);
    back.castShadow = true;
    benchGroup.add(back);

    // Metal legs and armrests
    const legGeo = regGeo(new THREE.BoxGeometry(0.08, 0.65, 0.56));
    const leftLeg = new THREE.Mesh(legGeo, ironMat);
    leftLeg.position.set(-0.82, 0.35, 0);
    benchGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, ironMat);
    rightLeg.position.set(0.82, 0.35, 0);
    benchGroup.add(rightLeg);

    return benchGroup;
  }

  const benchDistance = scaleFactor === 2 ? 64 : 30;
  const benchPositions: [number, number, number][] = [
    [0, -benchDistance, 0],               // South path facing North
    [0, benchDistance, Math.PI],          // North path facing South
    [-benchDistance, 0, Math.PI / 2],     // West path facing East
    [benchDistance, 0, -Math.PI / 2],    // East path facing West
  ];

  benchPositions.forEach(([bx, bz, rotY], i) => {
    const bench = createParkBench(i);
    bench.position.set(bx, 0.12, bz);
    bench.rotation.y = rotY;
    parent.add(bench);
  });

  // Flower Planter Boxes
  function createPlanterBox(index: number, colorMat: THREE.Material): THREE.Group {
    const planter = new THREE.Group();
    planter.name = `${plot.id}-park-planter-${index}`;

    const boxGeo = regGeo(new THREE.BoxGeometry(1.2, 0.45, 1.2));
    const box = new THREE.Mesh(boxGeo, memorialStoneMat);
    box.position.y = 0.225;
    box.castShadow = true;
    planter.add(box);

    const dirtGeo = regGeo(new THREE.BoxGeometry(1.05, 0.05, 1.05));
    const dirt = new THREE.Mesh(dirtGeo, darkTrunkMat);
    dirt.position.y = 0.43;
    planter.add(dirt);

    const flowerGeo = regGeo(new THREE.DodecahedronGeometry(0.38, 1));
    const flowers = new THREE.Mesh(flowerGeo, colorMat);
    flowers.position.y = 0.65;
    planter.add(flowers);

    return planter;
  }

  const basePlanterPositions: [number, number, THREE.Material][] = [
    [-8, -14, flowerOrangeMat],
    [8, -14, flowerPinkMat],
    [-8, 14, flowerPinkMat],
    [8, 14, flowerOrangeMat],
  ];

  const planterPositions: [number, number, THREE.Material][] = basePlanterPositions.map(
    ([px, pz, mat]) => [px * scaleFactor, pz * scaleFactor, mat]
  );

  planterPositions.forEach(([px, pz, mat], i) => {
    const planter = createPlanterBox(i, mat);
    planter.position.set(px, 0.15, pz);
    parent.add(planter);
  });

  // ----------------------------------------------------
  // 4. Country-Specific Memorial in Center of Park (0, 0)
  // ----------------------------------------------------
  const cCode = countryCode.toLowerCase();
  const memorialGroup = new THREE.Group();
  memorialGroup.name = `${plot.id}-park-memorial-${cCode}`;
  memorialGroup.position.set(0, 0.15, 0);

  // Stepped circular stone plinth base sized to support the 4x monument
  const plinthLowGeo = regGeo(new THREE.CylinderGeometry(12.5, 13.5, 0.45, 24));
  const plinthLow = new THREE.Mesh(plinthLowGeo, memorialBaseMat);
  plinthLow.position.y = 0.225;
  plinthLow.receiveShadow = true;
  memorialGroup.add(plinthLow);
  clickableObjects.push(plinthLow);

  const plinthHighGeo = regGeo(new THREE.CylinderGeometry(10.5, 11.5, 0.45, 24));
  const plinthHigh = new THREE.Mesh(plinthHighGeo, memorialStoneMat);
  plinthHigh.position.y = 0.675;
  plinthHigh.receiveShadow = true;
  memorialGroup.add(plinthHigh);
  clickableObjects.push(plinthHigh);

  // Top surface of the stepped plinth (0.675 centre + 0.45 height / 2)
  const PLINTH_TOP_Y = 0.9;

  // Bronze corner ceremonial urns/lanterns
  const urnGeo = regGeo(new THREE.CylinderGeometry(0.35, 0.25, 0.8, 8));
  const urnAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  urnAngles.forEach((ang, idx) => {
    const ux = Math.cos(ang) * 11.8;
    const uz = Math.sin(ang) * 11.8;
    const urn = new THREE.Mesh(urnGeo, bronzeMat);
    urn.name = `${plot.id}-park-memorial-urn-${idx}`;
    urn.position.set(ux, 0.95 + 0.4, uz);
    urn.castShadow = true;
    memorialGroup.add(urn);
  });

  // Memorial Dedication Plaque Facing South Walkway
  const plaqueBaseGeo = regGeo(new THREE.BoxGeometry(2.0, 1.2, 0.5));
  const plaqueBase = new THREE.Mesh(plaqueBaseGeo, memorialStoneMat);
  plaqueBase.name = `${plot.id}-park-memorial-plaque`;
  plaqueBase.position.set(0, 0.95, -12.2);
  plaqueBase.castShadow = true;
  memorialGroup.add(plaqueBase);

  const plaqueFaceGeo = regGeo(new THREE.PlaneGeometry(1.6, 0.9));
  const plaqueFace = new THREE.Mesh(plaqueFaceGeo, memorialGoldMat);
  plaqueFace.position.set(0, 1.05, -11.94);
  memorialGroup.add(plaqueFace);

  // ----------------------------------------------------
  // Country-Specific Memorial Monument (4x in size!)
  // ----------------------------------------------------
  const monument = new THREE.Group();
  monument.scale.set(4.0, 4.0, 4.0); // 4x in the size!
  monument.position.set(0, PLINTH_TOP_Y, 0);

  if (cCode === "es") {
    // --------------------------------------------------
    // SPAIN: Monumento a España & Plaza de España Fountain
    // --------------------------------------------------
    monument.name = `${plot.id}-park-memorial-es`;

    // Circular fountain basin
    const fountainPoolGeo = regGeo(new THREE.CylinderGeometry(3.0, 3.2, 0.22, 24));
    const fountainPool = new THREE.Mesh(fountainPoolGeo, waterPoolMat);
    fountainPool.position.y = 0.55;
    monument.add(fountainPool);

    // Central fountain tier pedestal
    const fountainPedGeo = regGeo(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 16));
    const fountainPed = new THREE.Mesh(fountainPedGeo, memorialStoneMat);
    fountainPed.position.y = 0.80;
    fountainPed.castShadow = true;
    monument.add(fountainPed);

    // Spanish Classical Obelisk
    const obeliskGeo = regGeo(new THREE.CylinderGeometry(0.35, 0.75, 5.2, 4));
    const obelisk = new THREE.Mesh(obeliskGeo, memorialStoneMat);
    obelisk.position.y = 3.7;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = true;
    monument.add(obelisk);
    obstacleObjects.push(obelisk);

    // Golden Pyramidion Cap & Crown
    const goldCapGeo = regGeo(new THREE.ConeGeometry(0.42, 0.8, 4));
    const goldCap = new THREE.Mesh(goldCapGeo, memorialGoldMat);
    goldCap.position.y = 6.7;
    goldCap.rotation.y = Math.PI / 4;
    monument.add(goldCap);

    // Spanish Flag Ribbon Bands (Red - Yellow - Red)
    const bandGeo = regGeo(new THREE.CylinderGeometry(0.82, 0.82, 0.12, 16));
    const redBand1 = new THREE.Mesh(bandGeo, flagRedMat);
    redBand1.position.y = 1.16;
    monument.add(redBand1);

    const yellowBand = new THREE.Mesh(bandGeo, flagYellowMat);
    yellowBand.position.y = 1.28;
    monument.add(yellowBand);

    const redBand2 = new THREE.Mesh(bandGeo, flagRedMat);
    redBand2.position.y = 1.40;
    monument.add(redBand2);
  } else if (cCode === "hi") {
    // --------------------------------------------------
    // INDIA: Ashoka Stambh (Lion Capital of Ashoka) & India Gate Memorial
    // --------------------------------------------------
    monument.name = `${plot.id}-park-memorial-hi`;

    // Carved inverted lotus bell base
    const lotusBaseGeo = regGeo(new THREE.CylinderGeometry(1.2, 1.8, 0.7, 16));
    const lotusBase = new THREE.Mesh(lotusBaseGeo, memorialStoneMat);
    lotusBase.position.y = 0.85;
    lotusBase.castShadow = true;
    monument.add(lotusBase);

    // Monolithic polished sandstone pillar
    const pillarGeo = regGeo(new THREE.CylinderGeometry(0.45, 0.58, 4.8, 16));
    const pillar = new THREE.Mesh(pillarGeo, memorialStoneMat);
    pillar.position.y = 3.6;
    pillar.castShadow = true;
    monument.add(pillar);
    obstacleObjects.push(pillar);

    // Circular drum abacus with Ashoka Chakra
    const abacusGeo = regGeo(new THREE.CylinderGeometry(0.85, 0.85, 0.45, 16));
    const abacus = new THREE.Mesh(abacusGeo, flagNavyMat);
    abacus.position.y = 6.2;
    monument.add(abacus);

    const chakraGoldGeo = regGeo(new THREE.TorusGeometry(0.72, 0.06, 8, 24));
    const chakraGold = new THREE.Mesh(chakraGoldGeo, memorialGoldMat);
    chakraGold.position.y = 6.2;
    chakraGold.rotation.x = Math.PI / 2;
    monument.add(chakraGold);

    // Four-Headed Lion Capital (Singha Stambh) top
    const lionHeadGeo = regGeo(new THREE.DodecahedronGeometry(0.68, 1));
    const lionCapital = new THREE.Mesh(lionHeadGeo, memorialGoldMat);
    lionCapital.position.y = 6.9;
    lionCapital.castShadow = true;
    monument.add(lionCapital);

    // Indian Tricolor Pedestal Bands (Saffron - White - Green)
    const bandGeo = regGeo(new THREE.CylinderGeometry(1.85, 1.85, 0.12, 16));
    const saffBand = new THREE.Mesh(bandGeo, flagSaffronMat);
    saffBand.position.y = 0.38;
    monument.add(saffBand);

    const whiteBand = new THREE.Mesh(bandGeo, flagWhiteMat);
    whiteBand.position.y = 0.50;
    monument.add(whiteBand);

    const greenBand = new THREE.Mesh(bandGeo, flagGreenMat);
    greenBand.position.y = 0.62;
    monument.add(greenBand);
  } else if (cCode === "ja") {
    // --------------------------------------------------
    // JAPAN: Heian Shinto Torii Gate & Peace Pagoda Memorial
    // --------------------------------------------------
    monument.name = `${plot.id}-park-memorial-ja`;

    // Vermilion Shinto Torii Gate Columns
    const toriiColGeo = regGeo(new THREE.CylinderGeometry(0.24, 0.28, 5.0, 12));
    const leftCol = new THREE.Mesh(toriiColGeo, flagRedMat);
    leftCol.position.set(-2.2, 2.8, 0);
    leftCol.castShadow = true;
    monument.add(leftCol);
    obstacleObjects.push(leftCol);

    const rightCol = new THREE.Mesh(toriiColGeo, flagRedMat);
    rightCol.position.set(2.2, 2.8, 0);
    rightCol.castShadow = true;
    monument.add(rightCol);
    obstacleObjects.push(rightCol);

    // Torii Upper Crossbeams (Kasagi and Shimaki)
    const upperBeamGeo = regGeo(new THREE.BoxGeometry(5.6, 0.35, 0.45));
    const upperBeam = new THREE.Mesh(upperBeamGeo, flagNavyMat);
    upperBeam.position.set(0, 5.35, 0);
    upperBeam.castShadow = true;
    monument.add(upperBeam);

    const lowerBeamGeo = regGeo(new THREE.BoxGeometry(4.8, 0.22, 0.35));
    const lowerBeam = new THREE.Mesh(lowerBeamGeo, flagRedMat);
    lowerBeam.position.set(0, 4.65, 0);
    monument.add(lowerBeam);

    // Centered 3-Tier Peace Pagoda / Kasuga Stone Lantern
    const lanternBaseGeo = regGeo(new THREE.BoxGeometry(1.2, 0.6, 1.2));
    const lanternBase = new THREE.Mesh(lanternBaseGeo, memorialStoneMat);
    lanternBase.position.y = 0.8;
    monument.add(lanternBase);

    // Pagoda Tier 1
    const tier1Geo = regGeo(new THREE.ConeGeometry(1.2, 0.45, 4));
    const tier1 = new THREE.Mesh(tier1Geo, darkTrunkMat);
    tier1.position.y = 1.45;
    tier1.rotation.y = Math.PI / 4;
    monument.add(tier1);

    // Pagoda Tier 2
    const tier2Geo = regGeo(new THREE.ConeGeometry(0.95, 0.4, 4));
    const tier2 = new THREE.Mesh(tier2Geo, darkTrunkMat);
    tier2.position.y = 2.15;
    tier2.rotation.y = Math.PI / 4;
    monument.add(tier2);

    // Pagoda Tier 3 + Golden Spire
    const tier3Geo = regGeo(new THREE.ConeGeometry(0.7, 0.35, 4));
    const tier3 = new THREE.Mesh(tier3Geo, darkTrunkMat);
    tier3.position.y = 2.75;
    tier3.rotation.y = Math.PI / 4;
    monument.add(tier3);

    const spireGeo = regGeo(new THREE.CylinderGeometry(0.06, 0.1, 1.2, 8));
    const spire = new THREE.Mesh(spireGeo, memorialGoldMat);
    spire.position.y = 3.6;
    monument.add(spire);

    // Japanese Hinomaru Emblem (Crimson Sun Disc on White Plinth)
    const discGeo = regGeo(new THREE.CircleGeometry(0.35, 16));
    const sunDisc = new THREE.Mesh(discGeo, flagRedMat);
    sunDisc.position.set(0, 1.8, -0.65);
    monument.add(sunDisc);
  } else if (cCode === "fr") {
    // --------------------------------------------------
    // FRANCE: Arc de Triomphe & Luxor Obelisk Memorial
    // --------------------------------------------------
    monument.name = `${plot.id}-park-memorial-fr`;

    // Neoclassical Triumphal Archway
    const leftPillarGeo = regGeo(new THREE.BoxGeometry(1.2, 4.4, 1.8));
    const leftPillar = new THREE.Mesh(leftPillarGeo, memorialStoneMat);
    leftPillar.position.set(-1.8, 2.5, 0);
    leftPillar.castShadow = true;
    monument.add(leftPillar);
    obstacleObjects.push(leftPillar);

    const rightPillarGeo = regGeo(new THREE.BoxGeometry(1.2, 4.4, 1.8));
    const rightPillar = new THREE.Mesh(rightPillarGeo, memorialStoneMat);
    rightPillar.position.set(1.8, 2.5, 0);
    rightPillar.castShadow = true;
    monument.add(rightPillar);
    obstacleObjects.push(rightPillar);

    // Arch Entablature / Attic lintel
    const atticGeo = regGeo(new THREE.BoxGeometry(5.0, 1.4, 2.0));
    const attic = new THREE.Mesh(atticGeo, memorialStoneMat);
    attic.position.set(0, 5.2, 0);
    attic.castShadow = true;
    monument.add(attic);

    // Luxor Obelisk rising proudly through the central plaza
    const obeliskGeo = regGeo(new THREE.CylinderGeometry(0.28, 0.55, 6.2, 4));
    const obelisk = new THREE.Mesh(obeliskGeo, memorialBaseMat);
    obelisk.position.y = 3.6;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = true;
    monument.add(obelisk);
    obstacleObjects.push(obelisk);

    const goldPyramidGeo = regGeo(new THREE.ConeGeometry(0.38, 0.7, 4));
    const goldPyramid = new THREE.Mesh(goldPyramidGeo, memorialGoldMat);
    goldPyramid.position.y = 7.0;
    goldPyramid.rotation.y = Math.PI / 4;
    monument.add(goldPyramid);

    // French Tricolor Roundel (Blue - White - Red)
    const cockadeRGeo = regGeo(new THREE.TorusGeometry(0.65, 0.08, 8, 24));
    const cockadeRed = new THREE.Mesh(cockadeRGeo, flagRedMat);
    cockadeRed.position.set(0, 5.2, -1.02);
    monument.add(cockadeRed);

    const cockadeBGeo = regGeo(new THREE.CircleGeometry(0.35, 16));
    const cockadeBlue = new THREE.Mesh(cockadeBGeo, flagBlueMat);
    cockadeBlue.position.set(0, 5.2, -1.01);
    monument.add(cockadeBlue);
  } else if (cCode === "it") {
    // --------------------------------------------------
    // ITALY: Colonna Traiana & Roman Classical Colonnade Memorial
    // --------------------------------------------------
    monument.name = `${plot.id}-park-memorial-it`;

    // Roman Marble Corinthian Column
    const colPedGeo = regGeo(new THREE.BoxGeometry(1.6, 1.0, 1.6));
    const colPed = new THREE.Mesh(colPedGeo, memorialStoneMat);
    colPed.position.y = 0.95;
    colPed.castShadow = true;
    monument.add(colPed);

    const columnGeo = regGeo(new THREE.CylinderGeometry(0.42, 0.52, 5.2, 16));
    const column = new THREE.Mesh(columnGeo, memorialStoneMat);
    column.position.y = 4.0;
    column.castShadow = true;
    monument.add(column);
    obstacleObjects.push(column);

    // Corinthian Capital & Golden Roman Aquila (Eagle)
    const capitalGeo = regGeo(new THREE.BoxGeometry(1.1, 0.5, 1.1));
    const capital = new THREE.Mesh(capitalGeo, memorialStoneMat);
    capital.position.y = 6.8;
    monument.add(capital);

    const eagleGeo = regGeo(new THREE.DodecahedronGeometry(0.55, 1));
    const eagle = new THREE.Mesh(eagleGeo, memorialGoldMat);
    eagle.position.y = 7.4;
    eagle.castShadow = true;
    monument.add(eagle);

    // Semi-circular Roman Portico Colonnade flanking the rear
    const porticoAngles = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];
    const pillarRGeo = regGeo(new THREE.CylinderGeometry(0.18, 0.22, 3.6, 8));
    porticoAngles.forEach((ang, pIdx) => {
      const px = Math.sin(ang) * 2.8;
      const pz = Math.cos(ang) * 2.8;
      const pil = new THREE.Mesh(pillarRGeo, memorialStoneMat);
      pil.name = `${plot.id}-park-memorial-portico-${pIdx}`;
      pil.position.set(px, 2.3, pz);
      pil.castShadow = true;
      monument.add(pil);
      obstacleObjects.push(pil);
    });

    // Italian Tricolor Ribbon (Green - White - Red)
    const bandGeo = regGeo(new THREE.CylinderGeometry(1.62, 1.62, 0.12, 16));
    const greenBand = new THREE.Mesh(bandGeo, flagGreenMat);
    greenBand.position.y = 0.48;
    monument.add(greenBand);

    const whiteBand = new THREE.Mesh(bandGeo, flagWhiteMat);
    whiteBand.position.y = 0.60;
    monument.add(whiteBand);

    const redBand = new THREE.Mesh(bandGeo, flagRedMat);
    redBand.position.y = 0.72;
    monument.add(redBand);
  } else {
    // --------------------------------------------------
    // Generic World Peace & Friendship Obelisk
    // --------------------------------------------------
    monument.name = `${plot.id}-park-memorial-${cCode}`;

    const obeliskGeo = regGeo(new THREE.CylinderGeometry(0.35, 0.75, 5.0, 4));
    const obelisk = new THREE.Mesh(obeliskGeo, memorialStoneMat);
    obelisk.position.y = 3.2;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = true;
    monument.add(obelisk);
    obstacleObjects.push(obelisk);

    const goldGlobeGeo = regGeo(new THREE.SphereGeometry(0.65, 12, 12));
    const goldGlobe = new THREE.Mesh(goldGlobeGeo, memorialGoldMat);
    goldGlobe.position.y = 6.2;
    monument.add(goldGlobe);
  }

  // Seat the monument flush on the plinth top. monument.scale (4x) multiplies every
  // child's local Y offset, so the lowest geometry would otherwise hang 1.2-2.8 units
  // above the plinth (worst case: the generic obelisk at 2.8).
  let lowestBottom = Infinity;
  for (const child of monument.children) {
    if (!(child instanceof THREE.Mesh)) continue;
    child.geometry.computeBoundingBox();
    const bounds = child.geometry.boundingBox;
    if (!bounds) continue;
    lowestBottom = Math.min(lowestBottom, child.position.y + bounds.min.y);
  }
  if (Number.isFinite(lowestBottom)) {
    monument.position.y = PLINTH_TOP_Y - lowestBottom * monument.scale.y;
  }

  memorialGroup.add(monument);
  parent.add(memorialGroup);
}
