import * as THREE from "three";
import type { GeneratedMap, PlotData } from "./map-generator";
import { BUS_STOP_WORLD_POSITION } from "../scenarios/bus-stop-scenario";
import {
  createTerracottaTileTexture,
  createTactileStripTexture,
  createTerracottaPavementMaterial,
  createTactileStripMaterial,
} from "./pavement-textures";
import { buildParkFeatures } from "./park-features";
import {
  getCountryBuildingPalette,
  buildCountryPlot00,
  buildCountryPlot10,
  buildCountryPlot12,
  buildCountryGenericBuilding,
  type BuildingBuildContext,
} from "./country-building-architectures";

export interface MapMeshSystem {
  group: THREE.Group;
  clickableObjects: THREE.Object3D[];
  obstacleObjects: THREE.Object3D[];
  dispose(): void;
}

export interface BuildMapMeshesOptions {
  countryCode?: string;
}

/**
 * Builds the 3D mesh representation of the data-driven map.
 * - Center Landmark: Central Park (green lawn, perimeter footpath, 4 road connection paths, trees, lamps)
 * - Surrounding Plots: Tall procedural buildings framing the park
 * - Outer Edge: Port / Dock with maritime boardwalk and mooring posts
 * - Roads: 3D boulevard roads with dashed lane markings
 */
export function buildMapMeshes(
  mapData: GeneratedMap,
  options?: BuildMapMeshesOptions
): MapMeshSystem {
  const group = new THREE.Group();
  group.name = "MapGridSystem";

  const clickableObjects: THREE.Object3D[] = [];
  const obstacleObjects: THREE.Object3D[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  // Helper to register disposable assets
  function regGeo<T extends THREE.BufferGeometry>(geo: T): T {
    geometries.push(geo);
    return geo;
  }
  function regMat<T extends THREE.Material>(mat: T): T {
    materials.push(mat);
    return mat;
  }
  function regTex<T extends THREE.Texture>(tex: T): T {
    textures.push(tex);
    return tex;
  }

  const { plots, roads, bounds } = mapData;

  // Lamps must never be placed on top of the bus stand (kept clear of its shelter footprint)
  const BUS_STOP_LAMP_CLEARANCE = 14;
  const isOverlappingBusStop = (x: number, z: number): boolean =>
    Math.hypot(x - BUS_STOP_WORLD_POSITION.x, z - BUS_STOP_WORLD_POSITION.z) <
    BUS_STOP_LAMP_CLEARANCE;

  // ----------------------------------------------------
  // 1. Shared Materials & Geometries
  // ----------------------------------------------------
  // Bedrock Foundation
  const baseMargin = 12;
  const baseWidth = bounds.totalWidth + baseMargin * 2;
  const baseDepth = bounds.totalDepth + baseMargin * 2;
  const baseGeo = regGeo(new THREE.BoxGeometry(baseWidth, 1.2, baseDepth));
  const baseMat = regMat(new THREE.MeshLambertMaterial({ color: 0x2e3846 })); // Clean bedrock slate

  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, -0.6, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Roads
  const roadMat = regMat(new THREE.MeshLambertMaterial({ color: 0x3d444d })); // Clean modern asphalt
  const dashMat = regMat(new THREE.MeshBasicMaterial({ color: 0xf1f5f9 })); // Bright white lane markings
  const vDashGeo = regGeo(new THREE.PlaneGeometry(0.3, 2.5));
  const hDashGeo = regGeo(new THREE.PlaneGeometry(2.5, 0.3));

  // Common Plot Materials
  const curbMat = regMat(new THREE.MeshLambertMaterial({ color: 0xe5e7eb })); // Bright concrete curb

  // Procedural Terracotta Tile & Yellow Tactile Strip Pavement System
  const terracottaTex = regTex(createTerracottaTileTexture({ size: 256, tilesPerSide: 4 }));
  terracottaTex.repeat.set(16, 16);

  const parkTerracottaTex = regTex(createTerracottaTileTexture({ size: 256, tilesPerSide: 4 }));
  parkTerracottaTex.repeat.set(14, 14);

  const tactileHTex = regTex(createTactileStripTexture({ width: 128, height: 128, ribCount: 8 }));
  tactileHTex.repeat.set(32, 1);

  const tactileVTex = regTex(createTactileStripTexture({ width: 128, height: 128, ribCount: 8 }));
  tactileVTex.repeat.set(1, 32);

  const parkTactileHTex = regTex(createTactileStripTexture({ width: 128, height: 128, ribCount: 8 }));
  parkTactileHTex.repeat.set(4, 1);

  const parkTactileVTex = regTex(createTactileStripTexture({ width: 128, height: 128, ribCount: 8 }));
  parkTactileVTex.repeat.set(1, 4);

  const terracottaMat = regMat(createTerracottaPavementMaterial(terracottaTex));
  const parkTerracottaMat = regMat(createTerracottaPavementMaterial(parkTerracottaTex));
  const tactileHMat = regMat(createTactileStripMaterial(tactileHTex));
  const tactileVMat = regMat(createTactileStripMaterial(tactileVTex));
  const parkTactileHMat = regMat(createTactileStripMaterial(parkTactileHTex));
  const parkTactileVMat = regMat(createTactileStripMaterial(parkTactileVTex));

  const parkLawnMat = regMat(new THREE.MeshLambertMaterial({ color: 0x489654 })); // Bright lush lawn green
  const lampPoleMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1f2937 })); // Cast iron
  const lampGlowMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffd166,
      emissiveIntensity: 1.2,
    })
  );

  // Street Traffic Light Materials
  const trafficPoleMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1f2937 })); // Dark iron pole
  const trafficBoxMat = regMat(new THREE.MeshLambertMaterial({ color: 0x111827 })); // Signal housing
  const signalRedMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
    })
  );
  const signalYellowMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.2,
    })
  );
  const signalGreenMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.2,
    })
  );

  // Country-Tailored Building Materials
  const countryCode = options?.countryCode ?? "es";
  const buildingPalette = getCountryBuildingPalette(countryCode);

  const matFacadePrimary = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.facadePrimary }));
  const matFacadeSecondary = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.facadeSecondary }));
  const matFacadeBase = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.facadeBase }));
  const matRoofMain = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.roofMain }));
  const matRoofTrim = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.roofTrim }));
  const matIronwork = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.ironwork }));
  const matStoneTrim = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.stoneTrim }));
  const matAccent = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.accent }));
  const matGlass = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.glass }));
  const matParapet = regMat(new THREE.MeshLambertMaterial({ color: buildingPalette.parapet }));

  // Port Materials
  const portPlankMat = regMat(new THREE.MeshLambertMaterial({ color: 0x9a501e })); // Warm honey cedar dock
  const portWaterMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0ea5e9 })); // Vibrant clear ocean water
  const portBollardMat = regMat(new THREE.MeshLambertMaterial({ color: 0x374151 })); // Cast iron bollard

  // Reusable plot-level curb and sidewalk geometries
  const plotWidth = plots[0]?.width ?? 72;
  const plotDepth = plots[0]?.depth ?? 72;
  const curbGeo = regGeo(new THREE.BoxGeometry(plotWidth, 0.12, plotDepth));
  const sharedPlazaGeo = regGeo(new THREE.BoxGeometry(plotWidth - 1.2, 0.06, plotDepth - 1.2));
  const sharedSpireGeo = regGeo(new THREE.CylinderGeometry(0.15, 0.35, 6, 6));

  // Reusable 3x tall street furniture geometries (11.25m height = 9m * 1.25)
  const streetPoleGeo = regGeo(new THREE.CylinderGeometry(0.14, 0.20, 11.25, 8));
  const streetPoleBaseGeo = regGeo(new THREE.CylinderGeometry(0.28, 0.36, 1.0, 8));
  const trafficArmGeo = regGeo(new THREE.CylinderGeometry(0.08, 0.10, 3.4, 6));
  const trafficBoxGeo = regGeo(new THREE.BoxGeometry(0.48, 1.75, 0.42));
  const signalLensGeo = regGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8));
  const streetLampArmGeo = regGeo(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 6));
  const streetLampFixtureGeo = regGeo(new THREE.ConeGeometry(0.45, 0.35, 6));
  const streetLampBulbGeo = regGeo(new THREE.SphereGeometry(0.25, 8, 8));

  // Reusable tactile edge geometries for building plots & park connectors
  const bldTactileHGeo = regGeo(new THREE.BoxGeometry(plotWidth - 2.4, 0.05, 1.0));
  const bldTactileVGeo = regGeo(new THREE.BoxGeometry(1.0, 0.05, plotDepth - 4.4));
  const parkTactileHGeo = regGeo(new THREE.BoxGeometry(8.0, 0.05, 1.0));
  const parkTactileVGeo = regGeo(new THREE.BoxGeometry(1.0, 0.05, 8.0));

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
  // 2b. Render 3x Tall Street Furniture: Traffic Lights & Street Lamps (11.25m height)
  // ----------------------------------------------------
  // 1. Street Intersection Traffic Lights (3x tall mast poles with signal heads)
  let tlIndex = 0;
  for (const hRoad of horizontalRoads) {
    for (const vRoad of verticalRoads) {
      const ix = vRoad.x;
      const iz = hRoad.z;
      const dx = vRoad.width / 2 + 1.2;
      const dz = hRoad.depth / 2 + 1.2;

      // Two diagonal corners per intersection
      const corners = [
        { x: ix - dx, z: iz - dz, armDir: "east" as const },
        { x: ix + dx, z: iz + dz, armDir: "west" as const },
      ];

      for (const corner of corners) {
        const tlGroup = new THREE.Group();
        tlGroup.name = `street-traffic-light-${tlIndex++}`;
        tlGroup.position.set(corner.x, 0.12, corner.z);

        // Mast pole base
        const baseMesh = new THREE.Mesh(streetPoleBaseGeo, trafficPoleMat);
        baseMesh.position.y = 0.5;
        tlGroup.add(baseMesh);

        // 11.25m tall mast pole (3x tall, +25%)
        const poleMesh = new THREE.Mesh(streetPoleGeo, trafficPoleMat);
        poleMesh.position.y = 5.625;
        poleMesh.castShadow = true;
        tlGroup.add(poleMesh);
        obstacleObjects.push(poleMesh);

        // Cantilever horizontal arm extending over street lane at y = 10.625
        const armMesh = new THREE.Mesh(trafficArmGeo, trafficPoleMat);
        armMesh.position.y = 10.625;
        if (corner.armDir === "east") {
          armMesh.position.x = 1.7;
          armMesh.rotation.z = Math.PI / 2;
        } else {
          armMesh.position.x = -1.7;
          armMesh.rotation.z = -Math.PI / 2;
        }
        tlGroup.add(armMesh);

        // Signal Housing Box
        const boxX = corner.armDir === "east" ? 3.0 : -3.0;
        const boxMesh = new THREE.Mesh(trafficBoxGeo, trafficBoxMat);
        boxMesh.position.set(boxX, 10.25, 0);
        boxMesh.castShadow = true;
        tlGroup.add(boxMesh);

        // Red, Yellow, Green signal lenses
        const redLens = new THREE.Mesh(signalLensGeo, signalRedMat);
        redLens.rotation.x = Math.PI / 2;
        redLens.position.set(boxX, 10.75, 0.22);
        tlGroup.add(redLens);

        const yellowLens = new THREE.Mesh(signalLensGeo, signalYellowMat);
        yellowLens.rotation.x = Math.PI / 2;
        yellowLens.position.set(boxX, 10.25, 0.22);
        tlGroup.add(yellowLens);

        const greenLens = new THREE.Mesh(signalLensGeo, signalGreenMat);
        greenLens.rotation.x = Math.PI / 2;
        greenLens.position.set(boxX, 9.75, 0.22);
        tlGroup.add(greenLens);

        group.add(tlGroup);
      }
    }
  }

  // 2. Street Lamps along the streets (3x tall, 11.25m height)
  let slIndex = 0;
  const streetLampPositions: { x: number; z: number; armRot: number }[] = [];

  for (const hRoad of horizontalRoads) {
    const vXs = verticalRoads.map((vr) => vr.x).sort((a, b) => a - b);
    const intervals: number[] = [bounds.minX + 24];
    for (let i = 0; i < vXs.length - 1; i++) {
      intervals.push((vXs[i] + vXs[i + 1]) / 2);
    }
    intervals.push(bounds.maxX - 24);

    for (const lx of intervals) {
      streetLampPositions.push({
        x: lx,
        z: hRoad.z + hRoad.depth / 2 + 1.2,
        armRot: 0,
      });
      streetLampPositions.push({
        x: lx,
        z: hRoad.z - hRoad.depth / 2 - 1.2,
        armRot: Math.PI,
      });
    }
  }

  for (const vRoad of verticalRoads) {
    const hZs = horizontalRoads.map((hr) => hr.z).sort((a, b) => a - b);
    const intervals: number[] = [bounds.minZ + 24];
    for (let i = 0; i < hZs.length - 1; i++) {
      intervals.push((hZs[i] + hZs[i + 1]) / 2);
    }
    intervals.push(bounds.maxZ - 24);

    for (const lz of intervals) {
      streetLampPositions.push({
        x: vRoad.x + vRoad.width / 2 + 1.2,
        z: lz,
        armRot: Math.PI / 2,
      });
      streetLampPositions.push({
        x: vRoad.x - vRoad.width / 2 - 1.2,
        z: lz,
        armRot: -Math.PI / 2,
      });
    }
  }

  streetLampPositions
    .filter((lamp) => !isOverlappingBusStop(lamp.x, lamp.z))
    .forEach((lamp) => {
    const lampGroup = new THREE.Group();
    lampGroup.name = `street-lamp-${slIndex++}`;
    lampGroup.position.set(lamp.x, 0.12, lamp.z);
    lampGroup.rotation.y = lamp.armRot;

    const baseMesh = new THREE.Mesh(streetPoleBaseGeo, lampPoleMat);
    baseMesh.position.y = 0.5;
    lampGroup.add(baseMesh);

    const poleMesh = new THREE.Mesh(streetPoleGeo, lampPoleMat);
    poleMesh.position.y = 5.625;
    poleMesh.castShadow = true;
    lampGroup.add(poleMesh);
    obstacleObjects.push(poleMesh);

    const neckMesh = new THREE.Mesh(streetLampArmGeo, lampPoleMat);
    neckMesh.position.set(0, 11.0, -0.9);
    neckMesh.rotation.x = Math.PI / 2;
    lampGroup.add(neckMesh);

    const fixMesh = new THREE.Mesh(streetLampFixtureGeo, lampPoleMat);
    fixMesh.position.set(0, 11.125, -1.8);
    lampGroup.add(fixMesh);

    const bulbMesh = new THREE.Mesh(streetLampBulbGeo, lampGlowMat);
    bulbMesh.name = `street-lamp-glow-${slIndex - 1}`;
    bulbMesh.position.set(0, 10.8125, -1.8);
    lampGroup.add(bulbMesh);

    group.add(lampGroup);
  });

  // ----------------------------------------------------
  // 3. Render Plots: Central Park, Framing Buildings, Port
  // ----------------------------------------------------
  for (const plot of plots) {
    const plotGroup = new THREE.Group();
    plotGroup.name = plot.id;
    plotGroup.position.set(plot.x, 0, plot.z);

    // Curb base for the plot
    const plotCurbGeo =
      plot.width === plotWidth && plot.depth === plotDepth
        ? curbGeo
        : regGeo(new THREE.BoxGeometry(plot.width, 0.12, plot.depth));
    const curbMesh = new THREE.Mesh(plotCurbGeo, curbMat);
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
      plotGroup.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          !child.name.endsWith("-surface") &&
          !child.name.endsWith("-curb") &&
          !child.name.includes("-tactile-")
        ) {
          obstacleObjects.push(child);
        }
      });
    }

    group.add(plotGroup);
  }

  // ----------------------------------------------------
  // Sub-builder: Central Park Landmark
  // ----------------------------------------------------
  function buildParkPlot(plot: PlotData, parent: THREE.Group) {
    const pW = plot.width; // 144 for 2x park size (or plot.width)

    // 1. Walkable Footpath Loop shifted to the edge where the white curb line is
    // The curb base is pW x pD (e.g. 144x144). Footpath perimeter outer size is pW - 1.2, leaving 0.6 white curb edge.
    // The central green lawn expands 2x from 58x58 to 116x116 (or pW >= 120 ? 116 : 58).
    const isExpanded = pW >= 120;
    const lawnSize = isExpanded ? 116 : 58;
    const pathOuterSize = pW - 1.2;
    const pathGeo = regGeo(new THREE.BoxGeometry(pathOuterSize, 0.06, pathOuterSize));
    const pathMesh = new THREE.Mesh(pathGeo, parkTerracottaMat);
    pathMesh.name = `${plot.id}-park-footpath`;
    pathMesh.position.y = 0.12;
    pathMesh.receiveShadow = true;
    parent.add(pathMesh);
    clickableObjects.push(pathMesh);

    // 2. Central Green Lawn (116x116 for 2x park size)
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
    // Connecting outer footpath edge to curb transition
    const connectorWidth = isExpanded ? 12 : 8;
    const connectorLength = 1.6;
    const connectorOffset = pW / 2 - connectorLength / 2;

    // North connector (+Z)
    const northGeo = regGeo(new THREE.BoxGeometry(connectorWidth, 0.08, connectorLength));
    const northPath = new THREE.Mesh(northGeo, parkTerracottaMat);
    northPath.name = `${plot.id}-park-connector-n`;
    northPath.position.set(0, 0.12, connectorOffset);
    northPath.receiveShadow = true;
    parent.add(northPath);
    clickableObjects.push(northPath);

    // South connector (-Z)
    const southGeo = regGeo(new THREE.BoxGeometry(connectorWidth, 0.08, connectorLength));
    const southPath = new THREE.Mesh(southGeo, parkTerracottaMat);
    southPath.name = `${plot.id}-park-connector-s`;
    southPath.position.set(0, 0.12, -connectorOffset);
    southPath.receiveShadow = true;
    parent.add(southPath);
    clickableObjects.push(southPath);

    // East connector (+X)
    const eastGeo = regGeo(new THREE.BoxGeometry(connectorLength, 0.08, connectorWidth));
    const eastPath = new THREE.Mesh(eastGeo, parkTerracottaMat);
    eastPath.name = `${plot.id}-park-connector-e`;
    eastPath.position.set(connectorOffset, 0.12, 0);
    eastPath.receiveShadow = true;
    parent.add(eastPath);
    clickableObjects.push(eastPath);

    // West connector (-X)
    const westGeo = regGeo(new THREE.BoxGeometry(connectorLength, 0.08, connectorWidth));
    const westPath = new THREE.Mesh(westGeo, parkTerracottaMat);
    westPath.name = `${plot.id}-park-connector-w`;
    westPath.position.set(-connectorOffset, 0.12, 0);
    westPath.receiveShadow = true;
    parent.add(westPath);
    clickableObjects.push(westPath);

    // Road-connector Yellow Tactile Warning Strips at curb transitions.
    // Connectors span y 0.08-0.16, so the strips (0.05 tall) must rest on top of
    // the connector surface instead of being buried inside the connector box.
    const tactileParkHGeo =
      pW === plotWidth ? parkTactileHGeo : regGeo(new THREE.BoxGeometry(connectorWidth, 0.05, 1.0));
    const tactileParkVGeo =
      pW === plotWidth ? parkTactileVGeo : regGeo(new THREE.BoxGeometry(1.0, 0.05, connectorWidth));

    const tactileParkY = 0.19; // spans 0.165-0.215, clear of connector top (0.16)

    const tactileParkNorth = new THREE.Mesh(tactileParkHGeo, parkTactileHMat);
    tactileParkNorth.name = `${plot.id}-park-tactile-n`;
    tactileParkNorth.position.set(0, tactileParkY, pW / 2 - 0.6);
    tactileParkNorth.receiveShadow = true;
    parent.add(tactileParkNorth);
    clickableObjects.push(tactileParkNorth);

    const tactileParkSouth = new THREE.Mesh(tactileParkHGeo, parkTactileHMat);
    tactileParkSouth.name = `${plot.id}-park-tactile-s`;
    tactileParkSouth.position.set(0, tactileParkY, -pW / 2 + 0.6);
    tactileParkSouth.receiveShadow = true;
    parent.add(tactileParkSouth);
    clickableObjects.push(tactileParkSouth);

    const tactileParkEast = new THREE.Mesh(tactileParkVGeo, parkTactileVMat);
    tactileParkEast.name = `${plot.id}-park-tactile-e`;
    tactileParkEast.position.set(pW / 2 - 0.6, tactileParkY, 0);
    tactileParkEast.receiveShadow = true;
    parent.add(tactileParkEast);
    clickableObjects.push(tactileParkEast);

    const tactileParkWest = new THREE.Mesh(tactileParkVGeo, parkTactileVMat);
    tactileParkWest.name = `${plot.id}-park-tactile-w`;
    tactileParkWest.position.set(-pW / 2 + 0.6, tactileParkY, 0);
    tactileParkWest.receiveShadow = true;
    parent.add(tactileParkWest);
    clickableObjects.push(tactileParkWest);

    // 4. Diverse Trees, Amenities (Picnic Tables, Benches, Planters), and Country Memorial
    buildParkFeatures(plot, parent, {
      countryCode: options?.countryCode ?? "es",
      regGeo,
      regMat,
      clickableObjects,
      obstacleObjects,
    });

    // 5. Procedural 3D Park Lamps (3x tall, 11.25m height = 9m * 1.25)
    const lampPoleGeo = regGeo(new THREE.CylinderGeometry(0.12, 0.16, 11.25, 8));
    const lampHeadGeo = regGeo(new THREE.BoxGeometry(0.75, 0.75, 0.75));

    const lampDist = isExpanded ? 68 : 32;
    const lampSpread = isExpanded ? 24 : 12;

    const lampPositions: [number, number][] = [
      [-lampSpread, -lampDist],
      [lampSpread, -lampDist],
      [-lampSpread, lampDist],
      [lampSpread, lampDist],
      [-lampDist, -lampSpread],
      [-lampDist, lampSpread],
      [lampDist, -lampSpread],
      [lampDist, lampSpread],
    ];

    lampPositions.forEach(([lx, lz], i) => {
      // Skip lamps that would collide with the bus stand footprint
      if (isOverlappingBusStop(plot.x + lx, plot.z + lz)) return;

      const lampGroup = new THREE.Group();
      lampGroup.name = `${plot.id}-park-lamp-${i}`;
      lampGroup.position.set(lx, 0.12, lz);

      const pole = new THREE.Mesh(lampPoleGeo, lampPoleMat);
      pole.position.y = 5.625;
      pole.castShadow = true;
      lampGroup.add(pole);
      obstacleObjects.push(pole);

      const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
      head.name = `${plot.id}-park-lamp-head-${i}`;
      head.position.y = 11.5;
      lampGroup.add(head);

      parent.add(lampGroup);
    });
  }

  // ----------------------------------------------------
  // Sub-builder: Framing Tall Buildings
  // ----------------------------------------------------
  function buildBuildingPlot(plot: PlotData, parent: THREE.Group) {
    // 1. Ground Terracotta Sidewalk Surface
    const plazaGeo =
      plot.width === plotWidth && plot.depth === plotDepth
        ? sharedPlazaGeo
        : regGeo(new THREE.BoxGeometry(plot.width - 1.2, 0.06, plot.depth - 1.2));
    const plazaMesh = new THREE.Mesh(plazaGeo, terracottaMat);
    plazaMesh.name = `${plot.id}-surface`;
    plazaMesh.position.y = 0.12;
    plazaMesh.receiveShadow = true;
    parent.add(plazaMesh);
    clickableObjects.push(plazaMesh);

    // Road-facing Yellow Tactile Warning Strips along the 4 plot perimeter edges
    const tactileNGeo =
      plot.width === plotWidth
        ? bldTactileHGeo
        : regGeo(new THREE.BoxGeometry(plot.width - 2.4, 0.05, 1.0));
    const tactileVGeo =
      plot.depth === plotDepth
        ? bldTactileVGeo
        : regGeo(new THREE.BoxGeometry(1.0, 0.05, plot.depth - 4.4));

    const tactileN = new THREE.Mesh(tactileNGeo, tactileHMat);
    tactileN.name = `${plot.id}-tactile-n`;
    tactileN.position.set(0, 0.125, plot.depth / 2 - 1.1);
    tactileN.receiveShadow = true;
    parent.add(tactileN);
    clickableObjects.push(tactileN);

    const tactileS = new THREE.Mesh(tactileNGeo, tactileHMat);
    tactileS.name = `${plot.id}-tactile-s`;
    tactileS.position.set(0, 0.125, -plot.depth / 2 + 1.1);
    tactileS.receiveShadow = true;
    parent.add(tactileS);
    clickableObjects.push(tactileS);

    const tactileE = new THREE.Mesh(tactileVGeo, tactileVMat);
    tactileE.name = `${plot.id}-tactile-e`;
    tactileE.position.set(plot.width / 2 - 1.1, 0.125, 0);
    tactileE.receiveShadow = true;
    parent.add(tactileE);
    clickableObjects.push(tactileE);

    const tactileW = new THREE.Mesh(tactileVGeo, tactileVMat);
    tactileW.name = `${plot.id}-tactile-w`;
    tactileW.position.set(-plot.width / 2 + 1.1, 0.125, 0);
    tactileW.receiveShadow = true;
    parent.add(tactileW);
    clickableObjects.push(tactileW);

    // Seeded procedural height, material, and architectural archetype variation per plot
    const seed = (plot.row * 7 + plot.col * 13) % 9;
    const archetype = (plot.row * 2 + plot.col) % 4;

    const ctx: BuildingBuildContext = {
      plot,
      parent,
      countryCode,
      palette: buildingPalette,
      seed,
      archetype,
      regGeo,
      regMat,
      clickableObjects,
      obstacleObjects,
      materials: {
        matFacadePrimary,
        matFacadeSecondary,
        matFacadeBase,
        matRoofMain,
        matRoofTrim,
        matIronwork,
        matStoneTrim,
        matAccent,
        matGlass,
        matParapet,
        sharedSpireGeo,
      },
    };

    if (plot.id === "plot-0-0") {
      buildCountryPlot00(ctx);
    } else if (plot.id === "plot-1-0") {
      buildCountryPlot10(ctx);
    } else if (plot.id === "plot-1-2") {
      buildCountryPlot12(ctx);
    } else {
      buildCountryGenericBuilding(ctx);
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
    obstacleObjects,
    dispose() {
      for (const geo of geometries) {
        geo.dispose();
      }
      for (const mat of materials) {
        mat.dispose();
      }
      for (const tex of textures) {
        tex.dispose();
      }
    },
  };
}
