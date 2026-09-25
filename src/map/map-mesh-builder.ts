import * as THREE from "three";
import type { GeneratedMap, PlotData } from "./map-generator";

export interface MapMeshSystem {
  group: THREE.Group;
  clickableObjects: THREE.Object3D[];
  dispose(): void;
}

/**
 * Builds the 3D mesh representation of the data-driven map.
 * - Center Landmark: Central Park (green lawn, perimeter footpath, 4 road connection paths, trees, lamps)
 * - Surrounding Plots: Tall procedural buildings framing the park
 * - Outer Edge: Port / Dock with maritime boardwalk and mooring posts
 * - Roads: 3D boulevard roads with dashed lane markings
 */
export function buildMapMeshes(mapData: GeneratedMap): MapMeshSystem {
  const group = new THREE.Group();
  group.name = "MapGridSystem";

  const clickableObjects: THREE.Object3D[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Helper to register disposable assets
  function regGeo<T extends THREE.BufferGeometry>(geo: T): T {
    geometries.push(geo);
    return geo;
  }
  function regMat<T extends THREE.Material>(mat: T): T {
    materials.push(mat);
    return mat;
  }

  const { plots, roads, bounds } = mapData;

  // ----------------------------------------------------
  // 1. Shared Materials & Geometries
  // ----------------------------------------------------
  // Bedrock Foundation
  const baseMargin = 12;
  const baseWidth = bounds.totalWidth + baseMargin * 2;
  const baseDepth = bounds.totalDepth + baseMargin * 2;
  const baseGeo = regGeo(new THREE.BoxGeometry(baseWidth, 1.2, baseDepth));
  const baseMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1a2026 })); // Deep bedrock

  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, -0.6, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Roads
  const roadMat = regMat(new THREE.MeshLambertMaterial({ color: 0x272b30 })); // Dark boulevard asphalt
  const dashMat = regMat(new THREE.MeshBasicMaterial({ color: 0x94a3b8 })); // Slate white markings
  const vDashGeo = regGeo(new THREE.PlaneGeometry(0.3, 2.5));
  const hDashGeo = regGeo(new THREE.PlaneGeometry(2.5, 0.3));

  // Common Plot Materials
  const curbMat = regMat(new THREE.MeshLambertMaterial({ color: 0xd1d5db })); // Concrete curb
  const plazaMat = regMat(new THREE.MeshLambertMaterial({ color: 0x334155 })); // Urban slate plaza
  const parkLawnMat = regMat(new THREE.MeshLambertMaterial({ color: 0x3a7d44 })); // Rich lawn green
  const parkPathMat = regMat(new THREE.MeshLambertMaterial({ color: 0xd9b88f })); // Warm sandstone / light tan pedestrian paving
  const treeTrunkMat = regMat(new THREE.MeshLambertMaterial({ color: 0x4a2e18 })); // Dark wood bark
  const treeLeafDarkMat = regMat(new THREE.MeshLambertMaterial({ color: 0x2d6a4f })); // Forest green
  const treeLeafLightMat = regMat(new THREE.MeshLambertMaterial({ color: 0x40916c })); // Fresh emerald
  const lampPoleMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1f2937 })); // Cast iron
  const lampGlowMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffd166,
      emissiveIntensity: 0.85,
    })
  );

  // Building Materials
  const bldBodyMat1 = regMat(new THREE.MeshLambertMaterial({ color: 0x1e293b })); // Titanium dark slate
  const bldBodyMat2 = regMat(new THREE.MeshLambertMaterial({ color: 0x334155 })); // Medium graphite
  const bldBodyMat3 = regMat(new THREE.MeshLambertMaterial({ color: 0x475569 })); // Steel blue
  const bldGlassMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0284c7 })); // Cyan architectural glass
  const bldAccentMat = regMat(new THREE.MeshLambertMaterial({ color: 0x64748b })); // Architectural trim
  const bldRoofMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // Deep roof mechanical

  // Port Materials
  const portPlankMat = regMat(new THREE.MeshLambertMaterial({ color: 0x78350f })); // Weathered wood dock
  const portWaterMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0369a1 })); // Deep harbor water
  const portBollardMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1c1917 })); // Heavy iron bollard

  // Reusable plot-level curb geometry
  const plotWidth = plots[0]?.width ?? 72;
  const plotDepth = plots[0]?.depth ?? 72;
  const curbGeo = regGeo(new THREE.BoxGeometry(plotWidth, 0.12, plotDepth));
  const sharedPlazaGeo = regGeo(new THREE.BoxGeometry(plotWidth - 1.2, 0.06, plotDepth - 1.2));
  const sharedSpireGeo = regGeo(new THREE.CylinderGeometry(0.15, 0.35, 6, 6));

  // ----------------------------------------------------
  // 2. Render Boulevard Roads
  // ----------------------------------------------------
  const horizontalRoads = roads.filter((r) => r.type === "horizontal");
  const verticalRoads = roads.filter((r) => r.type === "vertical");

  for (const road of roads) {
    const roadGeo = regGeo(new THREE.BoxGeometry(road.width, 0.04, road.depth));
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.name = road.id;
    roadMesh.position.set(road.x, 0.02, road.z);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);
    clickableObjects.push(roadMesh);

    if (road.type === "vertical") {
      const numDashes = Math.floor(road.depth / 6);
      for (let d = -numDashes / 2; d <= numDashes / 2; d++) {
        const dashZ = d * 5;
        // Skip dashes inside horizontal road intersections to prevent overlapping crosses
        const insideIntersection = horizontalRoads.some(
          (hr) => Math.abs(dashZ - hr.z) < hr.depth / 2 + 1.0
        );
        if (insideIntersection) continue;

        const dashMesh = new THREE.Mesh(vDashGeo, dashMat);
        dashMesh.rotation.x = -Math.PI / 2;
        dashMesh.position.set(road.x, 0.045, dashZ);
        group.add(dashMesh);
      }
    } else {
      const numDashes = Math.floor(road.width / 6);
      for (let d = -numDashes / 2; d <= numDashes / 2; d++) {
        const dashX = d * 5;
        // Skip dashes inside vertical road intersections to prevent overlapping crosses
        const insideIntersection = verticalRoads.some(
          (vr) => Math.abs(dashX - vr.x) < vr.width / 2 + 1.0
        );
        if (insideIntersection) continue;

        const dashMesh = new THREE.Mesh(hDashGeo, dashMat);
        dashMesh.rotation.x = -Math.PI / 2;
        dashMesh.position.set(dashX, 0.045, road.z);
        group.add(dashMesh);
      }
    }
  }

  // ----------------------------------------------------
  // 3. Render Plots: Central Park, Framing Buildings, Port
  // ----------------------------------------------------
  for (const plot of plots) {
    const plotGroup = new THREE.Group();
    plotGroup.name = plot.id;
    plotGroup.position.set(plot.x, 0, plot.z);

    // Curb base for the plot
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    curbMesh.name = `${plot.id}-curb`;
    curbMesh.position.y = 0.06;
    curbMesh.receiveShadow = true;
    plotGroup.add(curbMesh);
    clickableObjects.push(curbMesh);

    if (plot.type === "park") {
      buildParkPlot(plot, plotGroup);
    } else if (plot.type === "port") {
      buildPortPlot(plot, plotGroup);
    } else {
      buildBuildingPlot(plot, plotGroup);
    }

    group.add(plotGroup);
  }

  // ----------------------------------------------------
  // Sub-builder: Central Park Landmark
  // ----------------------------------------------------
  function buildParkPlot(plot: PlotData, parent: THREE.Group) {
    const pW = plot.width; // 72

    // 1. Walkable Footpath Loop around the lawn (inner: 42x42, outer: 62x62)
    // Walkway surface width 10 units, height 0.13
    const pathWidth = 10;
    const lawnSize = 42;
    const pathOuterSize = lawnSize + pathWidth * 2; // 62
    const pathGeo = regGeo(new THREE.BoxGeometry(pathOuterSize, 0.06, pathOuterSize));
    const pathMesh = new THREE.Mesh(pathGeo, parkPathMat);
    pathMesh.name = `${plot.id}-park-footpath`;
    pathMesh.position.y = 0.12;
    pathMesh.receiveShadow = true;
    parent.add(pathMesh);
    clickableObjects.push(pathMesh);

    // 2. Central Green Lawn (42x42)
    const lawnGeo = regGeo(new THREE.BoxGeometry(lawnSize, 0.08, lawnSize));
    const lawnMesh = new THREE.Mesh(lawnGeo, parkLawnMat);
    lawnMesh.name = `${plot.id}-park-lawn`;
    lawnMesh.position.y = 0.15;
    lawnMesh.receiveShadow = true;
    parent.add(lawnMesh);
    clickableObjects.push(lawnMesh);

    // Primary plot surface for 16-plot raycast contract
    const surfaceMesh = lawnMesh.clone();
    surfaceMesh.name = `${plot.id}-surface`;
    surfaceMesh.visible = false;
    parent.add(surfaceMesh);
    clickableObjects.push(surfaceMesh);

    // 3. 4 Road Connector Footpaths (North, South, East, West)
    // Connecting perimeter footpath (radius 31) directly and flush to curb boundary (radius 36)
    // Span: 30.8 to 36.0 -> length = 5.2, center offset = 33.4
    // Zero bleed into roads (max bound = 33.4 + 2.6 = 36.00)
    const connectorWidth = 8;
    const connectorLength = (pW - pathOuterSize) / 2 + 0.2; // 5.2 units
    const connectorOffset = (pathOuterSize / 2 - 0.2) + connectorLength / 2; // 33.4 units

    // North connector (+Z)
    const northGeo = regGeo(new THREE.BoxGeometry(connectorWidth, 0.08, connectorLength));
    const northPath = new THREE.Mesh(northGeo, parkPathMat);
    northPath.name = `${plot.id}-park-connector-n`;
    northPath.position.set(0, 0.12, connectorOffset);
    northPath.receiveShadow = true;
    parent.add(northPath);
    clickableObjects.push(northPath);

    // South connector (-Z)
    const southGeo = regGeo(new THREE.BoxGeometry(connectorWidth, 0.08, connectorLength));
    const southPath = new THREE.Mesh(southGeo, parkPathMat);
    southPath.name = `${plot.id}-park-connector-s`;
    southPath.position.set(0, 0.12, -connectorOffset);
    southPath.receiveShadow = true;
    parent.add(southPath);
    clickableObjects.push(southPath);

    // East connector (+X)
    const eastGeo = regGeo(new THREE.BoxGeometry(connectorLength, 0.08, connectorWidth));
    const eastPath = new THREE.Mesh(eastGeo, parkPathMat);
    eastPath.name = `${plot.id}-park-connector-e`;
    eastPath.position.set(connectorOffset, 0.12, 0);
    eastPath.receiveShadow = true;
    parent.add(eastPath);
    clickableObjects.push(eastPath);

    // West connector (-X)
    const westGeo = regGeo(new THREE.BoxGeometry(connectorLength, 0.08, connectorWidth));
    const westPath = new THREE.Mesh(westGeo, parkPathMat);
    westPath.name = `${plot.id}-park-connector-w`;
    westPath.position.set(-connectorOffset, 0.12, 0);
    westPath.receiveShadow = true;
    parent.add(westPath);
    clickableObjects.push(westPath);

    // 4. Procedural 3D Trees (Shared Geometries)
    const trunkGeo = regGeo(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 6));
    const leafLowerGeo = regGeo(new THREE.ConeGeometry(2.2, 3.4, 6));
    const leafUpperGeo = regGeo(new THREE.ConeGeometry(1.6, 2.6, 6));

    // Strategically placed trees around lawn corners and perimeter (inward margins >= 8 units)
    const treePositions: [number, number][] = [
      [-16, -16],
      [16, -16],
      [-16, 16],
      [16, 16],
      [-24, -10],
      [-24, 10],
      [24, -10],
      [24, 10],
      [-10, -24],
      [10, -24],
      [-10, 24],
      [10, 24],
    ];

    treePositions.forEach(([tx, tz], i) => {
      const treeGroup = new THREE.Group();
      treeGroup.name = `${plot.id}-park-tree-${i}`;
      treeGroup.position.set(tx, 0.15, tz);

      // Trunk
      const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
      trunk.position.y = 1.2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Foliage layers
      const isAlt = i % 2 === 0;
      const lowerFoliage = new THREE.Mesh(leafLowerGeo, isAlt ? treeLeafDarkMat : treeLeafLightMat);
      lowerFoliage.name = `${plot.id}-park-tree-foliage-lower-${i}`;
      lowerFoliage.position.y = 3.2;
      lowerFoliage.castShadow = true;
      treeGroup.add(lowerFoliage);

      const upperFoliage = new THREE.Mesh(leafUpperGeo, isAlt ? treeLeafLightMat : treeLeafDarkMat);
      upperFoliage.name = `${plot.id}-park-tree-foliage-upper-${i}`;
      upperFoliage.position.y = 4.8;
      upperFoliage.castShadow = true;
      treeGroup.add(upperFoliage);

      parent.add(treeGroup);
    });

    // 5. Procedural 3D Park Lamps (Warm Street/Park Illumination)
    const lampPoleGeo = regGeo(new THREE.CylinderGeometry(0.08, 0.1, 3.0, 6));
    const lampHeadGeo = regGeo(new THREE.BoxGeometry(0.5, 0.5, 0.5));

    const lampPositions: [number, number][] = [
      [-8, -26],
      [8, -26],
      [-8, 26],
      [8, 26],
      [-26, -8],
      [-26, 8],
      [26, -8],
      [26, 8],
    ];

    lampPositions.forEach(([lx, lz], i) => {
      const lampGroup = new THREE.Group();
      lampGroup.name = `${plot.id}-park-lamp-${i}`;
      lampGroup.position.set(lx, 0.12, lz);

      const pole = new THREE.Mesh(lampPoleGeo, lampPoleMat);
      pole.position.y = 1.5;
      pole.castShadow = true;
      lampGroup.add(pole);

      const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
      head.name = `${plot.id}-park-lamp-head-${i}`;
      head.position.y = 3.1;
      lampGroup.add(head);

      parent.add(lampGroup);
    });
  }

  // ----------------------------------------------------
  // Sub-builder: Framing Tall Buildings
  // ----------------------------------------------------
  function buildBuildingPlot(plot: PlotData, parent: THREE.Group) {
    // 1. Ground Plaza / Sidewalk Surface
    const plazaMesh = new THREE.Mesh(sharedPlazaGeo, plazaMat);
    plazaMesh.name = `${plot.id}-surface`;
    plazaMesh.position.y = 0.12;
    plazaMesh.receiveShadow = true;
    parent.add(plazaMesh);
    clickableObjects.push(plazaMesh);

    // Seeded procedural height, material, and architectural archetype variation per plot
    const seed = (plot.row * 7 + plot.col * 13) % 9;
    const bodyMat = seed % 3 === 0 ? bldBodyMat1 : seed % 3 === 1 ? bldBodyMat2 : bldBodyMat3;
    const bodyMatAlt = seed % 3 === 0 ? bldBodyMat3 : seed % 3 === 1 ? bldBodyMat1 : bldBodyMat2;
    const archetype = (plot.row * 2 + plot.col) % 4;

    if (archetype === 0) {
      // ARCHETYPE 0: High-Rise Skyscraper with Stepped Urban Podium (covers ~90% plot area)
      const bWidth = plot.width * (0.88 + (seed % 3) * 0.02); // 63.4 to 66.2
      const bDepth = plot.depth * (0.88 + ((seed + 1) % 3) * 0.02); // 63.4 to 66.2
      const totalHeight = 52 + seed * 3.5; // 52 to 80 units tall

      // Ground Podium (covers full footprint width x depth, height 10 units)
      const podiumHeight = 10;
      const podiumGeo = regGeo(new THREE.BoxGeometry(bWidth, podiumHeight, bDepth));
      const podiumMesh = new THREE.Mesh(podiumGeo, bodyMat);
      podiumMesh.name = `${plot.id}-building-tower-podium`;
      podiumMesh.position.set(0, podiumHeight / 2 + 0.12, 0);
      podiumMesh.castShadow = true;
      podiumMesh.receiveShadow = true;
      parent.add(podiumMesh);

      // Glass Retail / Lobby Band
      const lobbyBandGeo = regGeo(new THREE.BoxGeometry(bWidth + 0.2, 2.5, bDepth + 0.2));
      const lobbyBandMesh = new THREE.Mesh(lobbyBandGeo, bldGlassMat);
      lobbyBandMesh.position.set(0, 3 + 0.12, 0);
      parent.add(lobbyBandMesh);

      // Main Tower rising from podium (80% setback)
      const towerW = bWidth * 0.80;
      const towerD = bDepth * 0.80;
      const towerH = totalHeight - podiumHeight - 8;
      const towerGeo = regGeo(new THREE.BoxGeometry(towerW, towerH, towerD));
      const towerMesh = new THREE.Mesh(towerGeo, bodyMatAlt);
      towerMesh.name = `${plot.id}-building-tower`;
      towerMesh.position.set(0, podiumHeight + towerH / 2 + 0.12, 0);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      parent.add(towerMesh);

      // Architectural Glass Stripes
      const numBands = Math.floor(towerH / 4.5);
      const bandGeo = regGeo(new THREE.BoxGeometry(towerW + 0.2, 0.6, towerD + 0.2));
      for (let b = 1; b < numBands; b++) {
        const bandMesh = new THREE.Mesh(bandGeo, bldGlassMat);
        bandMesh.position.set(0, podiumHeight + b * 4.5 + 0.12, 0);
        parent.add(bandMesh);
      }

      // Stepped Mechanical Penthouse Crown
      const crownH = 5;
      const crownGeo = regGeo(new THREE.BoxGeometry(towerW * 0.65, crownH, towerD * 0.65));
      const crownMesh = new THREE.Mesh(crownGeo, bldRoofMat);
      crownMesh.name = `${plot.id}-building-roof`;
      crownMesh.position.set(0, podiumHeight + towerH + crownH / 2 + 0.12, 0);
      crownMesh.castShadow = true;
      parent.add(crownMesh);

      // Rooftop Spire
      const spireMesh = new THREE.Mesh(sharedSpireGeo, bldAccentMat);
      spireMesh.position.set(0, podiumHeight + towerH + crownH + 3.0 + 0.12, 0);
      parent.add(spireMesh);

    } else if (archetype === 1) {
      // ARCHETYPE 1: Monolithic Corporate Headquarters with Setback Crown (~90% plot area)
      const bWidth = plot.width * (0.89 + (seed % 3) * 0.02); // 64.1 to 67.0
      const bDepth = plot.depth * (0.88 + ((seed + 1) % 3) * 0.02); // 63.4 to 66.2
      const towerH = 48 + seed * 3.2; // 48 to 74 units tall

      // Main Tower
      const towerGeo = regGeo(new THREE.BoxGeometry(bWidth, towerH, bDepth));
      const towerMesh = new THREE.Mesh(towerGeo, bodyMat);
      towerMesh.name = `${plot.id}-building-tower`;
      towerMesh.position.set(0, towerH / 2 + 0.12, 0);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      parent.add(towerMesh);

      // Horizontal Architectural Glass Bands
      const numBands = Math.floor(towerH / 4);
      const bandGeo = regGeo(new THREE.BoxGeometry(bWidth + 0.2, 0.7, bDepth + 0.2));
      for (let b = 1; b < numBands; b++) {
        const bandMesh = new THREE.Mesh(bandGeo, bldGlassMat);
        bandMesh.position.set(0, b * 4 + 0.12, 0);
        parent.add(bandMesh);
      }

      // Stepped Mechanical Penthouse
      const crownH = 5.5;
      const crownGeo = regGeo(new THREE.BoxGeometry(bWidth * 0.65, crownH, bDepth * 0.65));
      const crownMesh = new THREE.Mesh(crownGeo, bldRoofMat);
      crownMesh.name = `${plot.id}-building-roof`;
      crownMesh.position.set(0, towerH + crownH / 2 + 0.12, 0);
      crownMesh.castShadow = true;
      parent.add(crownMesh);

      // Communications Array
      const spireMesh = new THREE.Mesh(sharedSpireGeo, bldAccentMat);
      spireMesh.position.set(0, towerH + crownH + 3.0 + 0.12, 0);
      parent.add(spireMesh);

    } else if (archetype === 2) {
      // ARCHETYPE 2: Dual-Volume / L-Shaped High-Rise Complex (~89% plot coverage)
      const bWidth = plot.width * (0.88 + (seed % 3) * 0.02); // 63.4 to 66.2
      const bDepth = plot.depth * (0.88 + ((seed + 1) % 3) * 0.02); // 63.4 to 66.2
      const towerH = 50 + seed * 3.0; // 50 to 74 units tall
      const wingH = towerH * 0.65; // 32.5 to 48 units tall

      // Primary Volume A (north half +Z, slightly indented on west face by 0.2 for clean architectural reveal)
      const volA_W = bWidth - 0.2;
      const volA_D = bDepth * 0.58;
      const volA_OffsetX = 0.1;
      const volA_OffsetZ = bDepth / 2 - volA_D / 2;
      const geoA = regGeo(new THREE.BoxGeometry(volA_W, towerH, volA_D));
      const meshA = new THREE.Mesh(geoA, bodyMat);
      meshA.name = `${plot.id}-building-tower`;
      meshA.position.set(volA_OffsetX, towerH / 2 + 0.12, volA_OffsetZ);
      meshA.castShadow = true;
      meshA.receiveShadow = true;
      parent.add(meshA);

      // Intersecting Wing Volume B (west half -X, slightly indented on north face by 0.2 for clean reveal)
      const volB_W = bWidth * 0.55;
      const volB_D = bDepth - 0.2;
      const volB_OffsetX = -bWidth / 2 + volB_W / 2;
      const volB_OffsetZ = -0.1;
      const geoB = regGeo(new THREE.BoxGeometry(volB_W, wingH, volB_D));
      const meshB = new THREE.Mesh(geoB, bodyMatAlt);
      meshB.name = `${plot.id}-building-tower-wing`;
      meshB.position.set(volB_OffsetX, wingH / 2 + 0.12, volB_OffsetZ);
      meshB.castShadow = true;
      meshB.receiveShadow = true;
      parent.add(meshB);

      // Glass bands on Primary Volume
      const numBandsA = Math.floor(towerH / 4.5);
      const bandGeoA = regGeo(new THREE.BoxGeometry(bWidth + 0.2, 0.6, volA_D + 0.2));
      for (let b = 1; b < numBandsA; b++) {
        const bandMesh = new THREE.Mesh(bandGeoA, bldGlassMat);
        bandMesh.position.set(0, b * 4.5 + 0.12, volA_OffsetZ);
        parent.add(bandMesh);
      }

      // Rooftop Penthouse Crown
      const crownH = 4.5;
      const crownGeo = regGeo(new THREE.BoxGeometry(bWidth * 0.5, crownH, volA_D * 0.7));
      const crownMesh = new THREE.Mesh(crownGeo, bldRoofMat);
      crownMesh.name = `${plot.id}-building-roof`;
      crownMesh.position.set(0, towerH + crownH / 2 + 0.12, volA_OffsetZ);
      crownMesh.castShadow = true;
      parent.add(crownMesh);

    } else {
      // ARCHETYPE 3: Art Deco Multi-Tier Stepped Skyscraper (~91% plot coverage)
      const bWidth = plot.width * (0.90 + (seed % 3) * 0.015); // 64.8 to 67.0
      const bDepth = plot.depth * (0.90 + ((seed + 1) % 3) * 0.015); // 64.8 to 67.0
      const baseH = 14;
      const midH = 26;
      const upperH = 22 + seed * 2.0; // 22 to 38
      const decoH = 8;

      // Tier 1: Base (covers full footprint width x depth)
      const baseGeo = regGeo(new THREE.BoxGeometry(bWidth, baseH, bDepth));
      const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
      baseMesh.name = `${plot.id}-building-tower`;
      baseMesh.position.set(0, baseH / 2 + 0.12, 0);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      parent.add(baseMesh);

      // Tier 2: Mid Tower (76% setback)
      const midW = bWidth * 0.76;
      const midD = bDepth * 0.76;
      const midGeo = regGeo(new THREE.BoxGeometry(midW, midH, midD));
      const midMesh = new THREE.Mesh(midGeo, bodyMatAlt);
      midMesh.position.set(0, baseH + midH / 2 + 0.12, 0);
      midMesh.castShadow = true;
      midMesh.receiveShadow = true;
      parent.add(midMesh);

      // Tier 3: Upper Tower (56% setback)
      const upperW = bWidth * 0.56;
      const upperD = bDepth * 0.56;
      const upperGeo = regGeo(new THREE.BoxGeometry(upperW, upperH, upperD));
      const upperMesh = new THREE.Mesh(upperGeo, bodyMat);
      upperMesh.position.set(0, baseH + midH + upperH / 2 + 0.12, 0);
      upperMesh.castShadow = true;
      upperMesh.receiveShadow = true;
      parent.add(upperMesh);

      // Tier 4: Deco Stepped Crown
      const crownGeo = regGeo(new THREE.BoxGeometry(upperW * 0.55, decoH, upperD * 0.55));
      const crownMesh = new THREE.Mesh(crownGeo, bldRoofMat);
      crownMesh.name = `${plot.id}-building-roof`;
      crownMesh.position.set(0, baseH + midH + upperH + decoH / 2 + 0.12, 0);
      crownMesh.castShadow = true;
      parent.add(crownMesh);

      // Deco Needle Spire
      const spireMesh = new THREE.Mesh(sharedSpireGeo, bldAccentMat);
      spireMesh.position.set(0, baseH + midH + upperH + decoH + 3.0 + 0.12, 0);
      parent.add(spireMesh);
    }
  }

  // ----------------------------------------------------
  // Sub-builder: Maritime Port & Waterfront Dock
  // ----------------------------------------------------
  function buildPortPlot(plot: PlotData, parent: THREE.Group) {
    const pW = plot.width; // 72
    const pD = plot.depth; // 72

    // 1. Water Basin (reflecting deep ocean blue)
    const waterGeo = regGeo(new THREE.BoxGeometry(pW - 1.2, 0.04, pD - 1.2));
    const waterMesh = new THREE.Mesh(waterGeo, portWaterMat);
    waterMesh.name = `${plot.id}-port-water`;
    waterMesh.position.y = 0.05;
    parent.add(waterMesh);

    // 2. Wooden Boardwalk / Dock Platform (covering 2/3 of the plot, extending toward water edge)
    const dockWidth = pW - 8;
    const dockDepth = pD * 0.65;
    const dockGeo = regGeo(new THREE.BoxGeometry(dockWidth, 0.16, dockDepth));
    const dockMesh = new THREE.Mesh(dockGeo, portPlankMat);
    dockMesh.name = `${plot.id}-port-dock`;
    dockMesh.position.set(0, 0.14, -pD * 0.15); // Inward toward the road
    dockMesh.castShadow = true;
    dockMesh.receiveShadow = true;
    parent.add(dockMesh);
    clickableObjects.push(dockMesh);

    // Primary plot surface for 16-plot raycast contract
    const surfaceMesh = dockMesh.clone();
    surfaceMesh.name = `${plot.id}-surface`;
    surfaceMesh.visible = false;
    parent.add(surfaceMesh);
    clickableObjects.push(surfaceMesh);

    // 3. Pier bollards / mooring posts along the water edge
    const bollardGeo = regGeo(new THREE.CylinderGeometry(0.35, 0.4, 1.2, 6));
    const numBollards = 6;
    const bollardSpacing = dockWidth / (numBollards + 1);
    const edgeZ = -pD * 0.15 + dockDepth / 2;

    for (let b = 1; b <= numBollards; b++) {
      const bx = -dockWidth / 2 + b * bollardSpacing;
      const bollard = new THREE.Mesh(bollardGeo, portBollardMat);
      bollard.name = `${plot.id}-port-bollard-${b}`;
      bollard.position.set(bx, 0.22 + 0.6, edgeZ - 0.4);
      bollard.castShadow = true;
      parent.add(bollard);
    }
  }

  // ----------------------------------------------------
  // 4. Large Invisible Ground Plane for Fallback Raycasting
  // ----------------------------------------------------
  const raycastPlaneGeo = regGeo(new THREE.PlaneGeometry(bounds.totalWidth * 2, bounds.totalDepth * 2));
  const raycastPlaneMat = regMat(
    new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    })
  );
  const raycastPlane = new THREE.Mesh(raycastPlaneGeo, raycastPlaneMat);
  raycastPlane.name = "RaycastGroundPlane";
  raycastPlane.rotation.x = -Math.PI / 2;
  raycastPlane.position.y = 0.01;
  group.add(raycastPlane);
  clickableObjects.push(raycastPlane);

  return {
    group,
    clickableObjects,
    dispose() {
      for (const geo of geometries) {
        geo.dispose();
      }
      for (const mat of materials) {
        mat.dispose();
      }
    },
  };
}
