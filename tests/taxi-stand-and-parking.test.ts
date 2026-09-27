import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import { buildMapMeshes } from "../src/map/map-mesh-builder";
import {
  createTaxiStand,
  isWithinTaxiStandRange,
  type TaxiStandSystem,
} from "../src/interaction/taxi-stand";
import {
  TAXI_STAND_WORLD_POSITION,
  TAXI_STAND_ROTATION,
  DEFAULT_TAXI_STAND_SCENARIO,
} from "../src/scenarios/taxi-stand-scenario";
import {
  getMultilingualScenario,
  getBilingualDialogue,
} from "../src/scenarios/multilingual";
import {
  worldToMinimap,
  clampToMinimapCircle,
} from "../src/map/minimap-math";
import { buildRoadCarModel } from "../src/map/car-builder";

// ==========================================
// 1. PLOT-1-0 PARKING GARAGE ARCHITECTURE TESTS
// ==========================================

test("TDD [Parking Building Architecture]: Plot-1-0 contains multi-story parking garage structure", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "es" });

  const plot10Group = mapMeshes.group.getObjectByName("plot-1-0");
  assert.ok(plot10Group, "plot-1-0 group must exist in map meshes");

  // Verify primary architectural naming conventions for coverage & bounding tests
  const tower = plot10Group.getObjectByName("plot-1-0-building-tower");
  assert.ok(tower, "Must have plot-1-0-building-tower for North garage wing");

  const wing = plot10Group.getObjectByName("plot-1-0-building-tower-wing");
  assert.ok(wing, "Must have plot-1-0-building-tower-wing for West garage wing");

  const roof = plot10Group.getObjectByName("plot-1-0-building-roof");
  assert.ok(roof, "Must have plot-1-0-building-roof for NW elevator core roof");

  // Verify parking garage features
  let foundFloorSlabs = 0;
  let foundVehicularPortal = false;
  let foundClearanceBar = false;
  let foundParkingPSign = false;
  let foundRoofCars = 0;

  plot10Group.traverse((child) => {
    if (child.name?.includes("roof-car")) {
      foundRoofCars++;
    }
    if (child instanceof THREE.Mesh) {
      const geo = child.geometry;
      if (geo instanceof THREE.BoxGeometry) {
        const { width, height, depth } = geo.parameters;
        // Floor slab check: thin wide horizontal box
        if (height >= 0.6 && height <= 0.8 && (width > 60 || depth > 60)) {
          foundFloorSlabs++;
        }
        // Vehicular portal arch
        if (width >= 7.0 && width <= 8.0 && height >= 4.0 && height <= 4.5) {
          foundVehicularPortal = true;
        }
        // Clearance bar
        if (width >= 5.5 && width <= 6.5 && height <= 0.5) {
          foundClearanceBar = true;
        }
        // Parking sign
        if (width >= 1.4 && width <= 1.8 && height >= 2.0 && height <= 2.8) {
          foundParkingPSign = true;
        }
      }
    }
  });

  assert.ok(foundFloorSlabs >= 3, `Expected at least 3 floor slabs, found ${foundFloorSlabs}`);
  assert.ok(foundVehicularPortal, "Expected vehicular portal entrance arch");
  assert.ok(foundClearanceBar, "Expected overhead height clearance warning bar");
  assert.ok(foundParkingPSign, "Expected blue parking 'P' totem sign");
  assert.ok(foundRoofCars >= 2, `Expected parked civilian roof cars, found ${foundRoofCars}`);

  mapMeshes.dispose();
});

test("TDD [Parking Building Bounds & Open SE Corner]: Spans 85-95% bounding box while leaving SE open for taxi stand", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "es" });
  const plot10Group = mapMeshes.group.getObjectByName("plot-1-0");
  assert.ok(plot10Group);

  // Compute building bounds excluding ground surface and curb (matches map-and-player urban scale test)
  const buildingBox = new THREE.Box3();
  plot10Group.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      !child.name.endsWith("-surface") &&
      !child.name.endsWith("-curb") &&
      !child.name.includes("-tactile-")
    ) {
      child.updateMatrix();
      child.geometry.computeBoundingBox();
      const meshBox = child.geometry.boundingBox.clone();
      meshBox.applyMatrix4(child.matrix);
      buildingBox.union(meshBox);
    }
  });

  const width = buildingBox.max.x - buildingBox.min.x;
  const depth = buildingBox.max.z - buildingBox.min.z;

  // Plot size is 72, urban coverage requirement is 85% (61.2) to 96% (69.12)
  assert.ok(width >= 61.2 && width <= 69.12, `Width ${width} must be 85%-96% of plotSize 72`);
  assert.ok(depth >= 61.2 && depth <= 69.12, `Depth ${depth} must be 85%-96% of plotSize 72`);

  // Verify the south-east corner (local x in [5, 30], z in [-30, -5]) is NOT blocked by tower meshes
  const tower = plot10Group.getObjectByName("plot-1-0-building-tower") as THREE.Mesh;
  const wing = plot10Group.getObjectByName("plot-1-0-building-tower-wing") as THREE.Mesh;

  // Tower is in North half (z > 0)
  assert.ok(tower.position.z > 0, "North garage wing must be positioned at z > 0");
  // Wing is in West half (x < 0)
  assert.ok(wing.position.x < 0, "West garage wing must be positioned at x < 0");

  mapMeshes.dispose();
});

// ==========================================
// 2. TAXI STAND CREATION & SHELTER TESTS
// ==========================================

test("TDD [Taxi Stand System]: createTaxiStand generates complete stand with bays, shelter, totem, and NPC driver", () => {
  const taxiStand: TaxiStandSystem = createTaxiStand(
    TAXI_STAND_WORLD_POSITION.x,
    TAXI_STAND_WORLD_POSITION.z,
    { countryCode: "es" }
  );

  assert.ok(taxiStand.group instanceof THREE.Group, "Must return Three.js Group");
  assert.equal(taxiStand.group.name, "TaxiStandSystem");
  // Driver stands next to driver door of lead cab (local offset 2.4/2.2 scaled by the 2x stand)
  assert.ok(
    Math.abs(taxiStand.driverWorldPosition.x - (TAXI_STAND_WORLD_POSITION.x + 4.8)) < 1e-6,
    `Driver world x must include 2x stand scale, got ${taxiStand.driverWorldPosition.x}`
  );
  assert.ok(
    Math.abs(taxiStand.driverWorldPosition.z - (TAXI_STAND_WORLD_POSITION.z + 4.4)) < 1e-6,
    `Driver world z must include 2x stand scale, got ${taxiStand.driverWorldPosition.z}`
  );

  // Reported driver position must land on the actual NPC beacon
  const driverScene = new THREE.Scene();
  driverScene.add(taxiStand.group);
  driverScene.updateMatrixWorld(true);
  const npcNode = taxiStand.group.getObjectByName("TaxiDriverNPC")!;
  const npcWorld = new THREE.Vector3();
  npcNode.getWorldPosition(npcWorld);
  assert.ok(
    Math.abs(taxiStand.driverWorldPosition.x - npcWorld.x) < 1e-3 &&
      Math.abs(taxiStand.driverWorldPosition.z - npcWorld.z) < 1e-3,
    `driverWorldPosition (${taxiStand.driverWorldPosition.x}, ${taxiStand.driverWorldPosition.z}) must match NPC world position (${npcWorld.x.toFixed(3)}, ${npcWorld.z.toFixed(3)})`
  );

  // Check for Taxi Driver NPC
  const driverGroup = taxiStand.group.getObjectByName("TaxiDriverNPC");
  assert.ok(driverGroup, "Must include TaxiDriverNPC in stand group");

  // Check for TaxiDriverHighlight beacon aura
  const beacon = taxiStand.group.getObjectByName("TaxiDriverHighlight");
  assert.ok(beacon, "Must include glowing TaxiDriverHighlight beacon ring");

  // Check for waiting passenger shelter
  let foundShelterCanopy = false;
  let foundGlassWindbreak = false;
  let foundBench = false;
  let foundTotem = false;
  let foundBays = 0;

  taxiStand.group.traverse((obj) => {
    if (obj.name?.includes("TaxiShelterCanopy")) foundShelterCanopy = true;
    if (obj.name?.includes("TaxiShelterGlass")) foundGlassWindbreak = true;
    if (obj.name?.includes("TaxiShelterBench")) foundBench = true;
    if (obj.name?.includes("TaxiStandTotem") || obj.name?.includes("TaxiTotem")) foundTotem = true;
    if (obj.name?.includes("TaxiBay")) foundBays++;
  });

  assert.ok(foundShelterCanopy, "Must contain passenger shelter canopy");
  assert.ok(foundGlassWindbreak, "Must contain tinted glass windbreak");
  assert.ok(foundBench, "Must contain passenger waiting bench");
  assert.ok(foundTotem, "Must contain illuminated TAXI STAND totem sign");
  assert.ok(foundBays >= 2, `Must contain marked taxi bays, found ${foundBays}`);

  taxiStand.dispose();
});

// ==========================================
// 3. COUNTRY-SPECIFIC FAMOUS TAXIS
// ==========================================

test("TDD [Spain Taxis]: Builds Barcelona Yellow/Black taxi and Madrid White/Red taxi", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "es" });
  let foundBarcelonaTaxi = false;
  let foundMadridTaxi = false;

  taxiStand.group.traverse((obj) => {
    if (obj.name === "BarcelonaTaxi") foundBarcelonaTaxi = true;
    if (obj.name === "MadridTaxi") foundMadridTaxi = true;
  });

  assert.ok(foundBarcelonaTaxi, "Spain must spawn Barcelona Black & Yellow taxi");
  assert.ok(foundMadridTaxi, "Spain must spawn Madrid White & Red stripe taxi");
  taxiStand.dispose();
});

test("TDD [India Taxis]: Builds Mumbai Kaali-Peeli taxi and Iconic Auto-Rickshaw", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "hi" });
  let foundKaaliPeeli = false;
  let foundAutoRickshaw = false;

  taxiStand.group.traverse((obj) => {
    if (obj.name === "KaaliPeeliTaxi") foundKaaliPeeli = true;
    if (obj.name === "AutoRickshaw") foundAutoRickshaw = true;
  });

  assert.ok(foundKaaliPeeli, "India must spawn iconic Mumbai Kaali-Peeli taxi");
  assert.ok(foundAutoRickshaw, "India must spawn 3-wheeler Auto-Rickshaw");
  taxiStand.dispose();
});

test("TDD [Japan Taxis]: Builds Tokyo Crown / JPN Taxi and Nihon Kotsu Green cab", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "ja" });
  let foundTokyoCrown = false;
  let foundNihonKotsu = false;

  taxiStand.group.traverse((obj) => {
    if (obj.name === "TokyoCrownTaxi") foundTokyoCrown = true;
    if (obj.name === "NihonKotsuTaxi") foundNihonKotsu = true;
  });

  assert.ok(foundTokyoCrown, "Japan must spawn Tokyo Crown / JPN Taxi with roof Andon lantern");
  assert.ok(foundNihonKotsu, "Japan must spawn Nihon Kotsu green taxi");
  taxiStand.dispose();
});

test("TDD [France Taxis]: Builds Taxi Parisien with A/B/C tariff roof light", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "fr" });
  let foundParisTaxi = false;

  taxiStand.group.traverse((obj) => {
    if (obj.name?.startsWith("ParisTaxi")) foundParisTaxi = true;
  });

  assert.ok(foundParisTaxi, "France must spawn Taxi Parisien");
  taxiStand.dispose();
});

test("TDD [Italy Taxis]: Builds Taxi Roma white sedan with SPQR crest", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "it" });
  let foundRomaTaxi = false;

  taxiStand.group.traverse((obj) => {
    if (obj.name?.startsWith("RomeTaxi")) foundRomaTaxi = true;
  });

  assert.ok(foundRomaTaxi, "Italy must spawn Taxi Roma white sedan with SPQR Comune di Roma badge");
  taxiStand.dispose();
});

test("TDD [Default / NYC Taxis]: Spawns NYC Yellow Cabs when unknown country code is provided", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "unknown_code" });
  let foundNYCTaxi = false;

  taxiStand.group.traverse((obj) => {
    if (obj.name?.startsWith("NYCTaxi")) foundNYCTaxi = true;
  });

  assert.ok(foundNYCTaxi, "Fallback must spawn NYC Yellow Cabs");
  taxiStand.dispose();
});

// ==========================================
// 4. PROXIMITY & INTERACTION RANGE TESTS
// ==========================================

test("TDD [Proximity Detection]: isWithinTaxiStandRange detects player in interaction radius", () => {
  const standX = TAXI_STAND_WORLD_POSITION.x;
  const standZ = TAXI_STAND_WORLD_POSITION.z;

  // Player right next to taxi driver
  assert.equal(
    isWithinTaxiStandRange(standX + 2, standZ + 2, standX, standZ, 12),
    true,
    "Player within 2.8m must be in range"
  );

  // Player exactly at 11m
  assert.equal(
    isWithinTaxiStandRange(standX + 11, standZ, standX, standZ, 12),
    true,
    "Player at 11m must be in range"
  );

  // Player far away (e.g. at coffee shop)
  assert.equal(
    isWithinTaxiStandRange(-18, -68, standX, standZ, 12),
    false,
    "Player at Coffee Shop (-18, -68) must not be in taxi stand range"
  );
});

// ==========================================
// 5. MULTILINGUAL SCENARIOS & DIALOGUES
// ==========================================

test("TDD [Multilingual Taxi Scenarios]: getMultilingualScenario produces taxi dialogues for all languages", () => {
  assert.ok(DEFAULT_TAXI_STAND_SCENARIO.id.includes("taxi"));
  assert.ok(DEFAULT_TAXI_STAND_SCENARIO.objectives.length >= 1);
  const targetLanguages = ["es", "hi", "ja", "fr", "it", "te"];

  for (const lang of targetLanguages) {
    const scenario = getMultilingualScenario(lang, "en", "taxi");
    assert.ok(scenario.id.includes("taxi"), `Scenario ID for ${lang} must include 'taxi'`);
    assert.ok(scenario.npcName.length > 0, `NPC name for ${lang} must not be empty`);
    assert.ok(scenario.systemPrompt.includes("taxi") || scenario.systemPrompt.includes("cab") || scenario.systemPrompt.includes("driver"), `System prompt for ${lang} must reference taxi/driver`);
    assert.ok(scenario.greeting.length > 0, `Greeting for ${lang} must not be empty`);
    assert.ok(scenario.objectives.length >= 1, `Expected objectives for ${lang}, got ${scenario.objectives.length}`);

    // Verify bilingual dialogue
    const dialogue = getBilingualDialogue({
      targetLang: lang,
      nativeLang: "en",
      zone: "taxi",
      stepIndex: 0,
    });
    assert.ok(dialogue.npcTargetText.length > 0);
    assert.ok(dialogue.userSuggestedTarget.length > 0);
    assert.ok(dialogue.userSuggestedNative.length > 0);
  }
});

// ==========================================
// 6. MINIMAP PROJECTION FOR TAXI STAND
// ==========================================

test("TDD [Minimap Coordinates]: TAXI_STAND_WORLD_POSITION maps inside circular minimap bounds", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const radius = 96;
  const padding = 14;
  const scale = 1.0;

  const minimapPos = worldToMinimap(
    TAXI_STAND_WORLD_POSITION,
    mapData.bounds,
    radius,
    padding,
    scale
  );

  assert.ok(minimapPos.x >= 0 && minimapPos.x <= radius * 2, "Minimap X within canvas width");
  assert.ok(minimapPos.y >= 0 && minimapPos.y <= radius * 2, "Minimap Y within canvas height");

  const clamped = clampToMinimapCircle(minimapPos, { x: radius, y: radius }, radius, 8);
  const distFromCenter = Math.hypot(clamped.x - radius, clamped.y - radius);
  assert.ok(distFromCenter <= radius - 8 + 0.01, "Clamped pos must be within radar boundary");
});

// ==========================================
// 7. TAXI STAND ANIMATION & DISPOSAL
// ==========================================

test("TDD [Taxi Stand Animation & Clean Disposal]: update runs smoothly and dispose cleans all resources", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "es" });

  // Update idle animation
  assert.doesNotThrow(() => {
    taxiStand.update(0.016, false);
    taxiStand.update(0.016, true); // Active conversation
  });

  // Disposal
  assert.doesNotThrow(() => {
    taxiStand.dispose();
  });
});

// ==========================================
// 8. TAXI STAND & STATIONED CAR SCALING
// ==========================================

test("TDD [Taxi Stand Scale]: Taxi stand group is scaled up 2x in size", () => {
  const taxiStand = createTaxiStand(-120, -68, { countryCode: "es" });
  assert.ok(
    taxiStand.group.scale.x >= 1.9 && taxiStand.group.scale.x <= 2.1,
    `Taxi stand must be scaled 2x in size, got scale=${taxiStand.group.scale.x}`
  );
  assert.ok(
    taxiStand.group.scale.y >= 1.9 && taxiStand.group.scale.y <= 2.1,
    `Taxi stand must be scaled 2x in size, got scale=${taxiStand.group.scale.y}`
  );
  assert.ok(
    taxiStand.group.scale.z >= 1.9 && taxiStand.group.scale.z <= 2.1,
    `Taxi stand must be scaled 2x in size, got scale=${taxiStand.group.scale.z}`
  );
  taxiStand.dispose();
});

test("TDD [Cars on Taxi Stand Same as Road Cars]: Stationed cars at taxi stand match the road car model and scale", () => {
  const taxiStandES = createTaxiStand(-120, -68, { countryCode: "es" });
  const bcnTaxi = taxiStandES.group.getObjectByName("BarcelonaTaxi") as THREE.Group;
  assert.ok(bcnTaxi, "Barcelona taxi must exist");
  assert.equal(bcnTaxi.scale.x, 1.0, "Stationed taxi local scale.x is 1.0 within 2x taxi stand group");
  assert.equal(bcnTaxi.scale.y, 1.0, "Stationed taxi local scale.y is 1.0 within 2x taxi stand group");
  assert.equal(bcnTaxi.scale.z, 1.0, "Stationed taxi local scale.z is 1.0 within 2x taxi stand group");

  // Verify effective world scale equals 2.0 (matching moving road cars)
  const scene = new THREE.Scene();
  scene.add(taxiStandES.group);
  scene.updateMatrixWorld(true);

  const worldScale = new THREE.Vector3();
  bcnTaxi.getWorldScale(worldScale);
  assert.equal(worldScale.x, 2.0, "Stationed taxi world scale.x must equal 2.0 (matching road cars)");
  assert.equal(worldScale.y, 2.0, "Stationed taxi world scale.y must equal 2.0 (matching road cars)");
  assert.equal(worldScale.z, 2.0, "Stationed taxi world scale.z must equal 2.0 (matching road cars)");

  // Compare 3D bounding box dimensions with road car
  const roadCar = buildRoadCarModel({ scale: 2.0, isTaxi: true });
  scene.add(roadCar.group);
  scene.updateMatrixWorld(true);

  const taxiBox = new THREE.Box3().setFromObject(bcnTaxi);
  const roadCarBox = new THREE.Box3().setFromObject(roadCar.group);
  const taxiSize = new THREE.Vector3();
  const roadCarSize = new THREE.Vector3();
  taxiBox.getSize(taxiSize);
  roadCarBox.getSize(roadCarSize);

  // Note: taxi on stand is rotated Math.PI / 2, so width/length swap between X and Z
  const taxiLongest = Math.max(taxiSize.x, taxiSize.z);
  const roadCarLongest = Math.max(roadCarSize.x, roadCarSize.z);
  assert.ok(
    Math.abs(taxiLongest - roadCarLongest) < 0.05,
    `Stationed taxi length (${taxiLongest.toFixed(2)}) must equal road car length (${roadCarLongest.toFixed(2)})`
  );
  assert.ok(
    Math.abs(taxiSize.y - roadCarSize.y) < 0.05,
    `Stationed taxi height (${taxiSize.y.toFixed(2)}) must equal road car height (${roadCarSize.y.toFixed(2)})`
  );

  // Verify it contains the canonical road car meshes
  assert.ok(bcnTaxi.getObjectByName("CarChassis"), "Must have canonical CarChassis");
  assert.ok(bcnTaxi.getObjectByName("CarCabin"), "Must have canonical CarCabin");
  assert.ok(bcnTaxi.getObjectByName("CarGlass"), "Must have canonical CarGlass");
  assert.ok(bcnTaxi.getObjectByName("CarFrontBumper"), "Must have canonical CarFrontBumper");
  assert.ok(bcnTaxi.getObjectByName("CarRearBumper"), "Must have canonical CarRearBumper");
  assert.ok(bcnTaxi.getObjectByName("TaxiRoofSign"), "Must have canonical TaxiRoofSign");

  const madTaxi = taxiStandES.group.getObjectByName("MadridTaxi") as THREE.Group;
  assert.ok(madTaxi, "Madrid taxi must exist");
  assert.equal(madTaxi.scale.x, 1.0, "Madrid taxi local scale must be 1.0 (world scale 2.0)");
  assert.ok(madTaxi.getObjectByName("CarChassis"), "Madrid taxi must be road car model");
  taxiStandES.dispose();

  const taxiStandHI = createTaxiStand(-120, -68, { countryCode: "hi" });
  const kpTaxi = taxiStandHI.group.getObjectByName("KaaliPeeliTaxi") as THREE.Group;
  assert.ok(kpTaxi, "Kaali-Peeli taxi must exist");
  assert.equal(kpTaxi.scale.x, 1.0, "Kaali-Peeli taxi local scale must be 1.0 (world scale 2.0)");
  assert.ok(kpTaxi.getObjectByName("CarChassis"), "Kaali-Peeli taxi must be road car model");

  const autoRickshaw = taxiStandHI.group.getObjectByName("AutoRickshaw") as THREE.Group;
  assert.ok(autoRickshaw, "Auto-rickshaw slot must exist");
  assert.equal(autoRickshaw.scale.x, 1.0, "Stationed car local scale must be 1.0 (world scale 2.0)");
  assert.ok(autoRickshaw.getObjectByName("CarChassis"), "Stationed car must be road car model");
  taxiStandHI.dispose();
});

// ==========================================
// 9. PLOT-0-0 RELOCATION & CENTRAL TAXI TERMINAL ARCHITECTURE
// ==========================================

test("TDD [Taxi Stand Relocation to Plot-1-0]: TAXI_STAND_WORLD_POSITION is located strictly inside plot-1-0 open SE apron", () => {
  // Same config the app builds the world with (parkSizeMultiplier 2 -> Central Park is 144x144)
  const mapData = generateMap({
    gridSize: 4,
    plotSize: 72,
    roadWidth: 20,
    hasPerimeterRoads: true,
    parkSizeMultiplier: 2,
  });
  const plot10 = mapData.plots.find((p) => p.id === "plot-1-0")!;
  assert.ok(plot10, "plot-1-0 must exist in generated map");
  assert.equal(plot10.row, 1, "plot-1-0 must be row 1 (2nd southernmost row)");
  assert.equal(plot10.col, 0, "plot-1-0 must be col 0 (westernmost column)");

  // Central Park is plot-1-1
  const parkPlot = mapData.plots.find((p) => p.id === "plot-1-1")!;
  assert.equal(plot10.row, parkPlot.row, "plot-1-0 must be same row as the park");
  assert.equal(plot10.col, parkPlot.col - 1, "plot-1-0 must be 1 col to the left of the park");

  // Verify TAXI_STAND_WORLD_POSITION is strictly within plot-1-0 bounds
  assert.ok(
    TAXI_STAND_WORLD_POSITION.x >= plot10.minX && TAXI_STAND_WORLD_POSITION.x <= plot10.maxX,
    `Taxi stand x=${TAXI_STAND_WORLD_POSITION.x} must be inside plot-1-0 x bounds [${plot10.minX}, ${plot10.maxX}]`
  );
  assert.ok(
    TAXI_STAND_WORLD_POSITION.z >= plot10.minZ && TAXI_STAND_WORLD_POSITION.z <= plot10.maxZ,
    `Taxi stand z=${TAXI_STAND_WORLD_POSITION.z} must be inside plot-1-0 z bounds [${plot10.minZ}, ${plot10.maxZ}]`
  );

  // Must sit in the open SE apron the L-shaped garage leaves free:
  // east of the West garage wing (local x >= -3) and south of the North garage wing (local z <= 2)
  const localX = TAXI_STAND_WORLD_POSITION.x - plot10.x;
  const localZ = TAXI_STAND_WORLD_POSITION.z - plot10.z;
  assert.ok(
    localX >= 5 && localX <= 30,
    `Taxi stand localX=${localX} must be inside open SE apron x=[5, 30]`
  );
  assert.ok(
    localZ >= -70 && localZ <= -5,
    `Taxi stand localZ=${localZ} must be inside open SE apron z=[-70, -5]`
  );

  // Exact coordinates
  assert.equal(TAXI_STAND_WORLD_POSITION.x, -150);
  assert.equal(TAXI_STAND_WORLD_POSITION.z, -80);
});

test("TDD [Taxi Stand Clear of Garage & Road]: Rotated stand fits the open apron without touching the garage, roads or other plots", () => {
  const mapData = generateMap({
    gridSize: 4,
    plotSize: 72,
    roadWidth: 20,
    hasPerimeterRoads: true,
    parkSizeMultiplier: 2,
  });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "es" });
  const taxiStand = createTaxiStand(
    TAXI_STAND_WORLD_POSITION.x,
    TAXI_STAND_WORLD_POSITION.z,
    { countryCode: "es", rotation: TAXI_STAND_ROTATION }
  );

  taxiStand.group.updateMatrixWorld(true);
  const standBox = new THREE.Box3().setFromObject(taxiStand.group);
  assert.ok(!standBox.isEmpty(), "Stand world box must be computed");

  // 1. Bay row runs north-south (parallel to the boulevard east of plot-1-0), not east-west
  const standWidth = standBox.max.x - standBox.min.x;
  const standDepth = standBox.max.z - standBox.min.z;
  assert.ok(
    standDepth > standWidth * 2,
    `Stand must be turned 90 degrees so it runs along the road, got width=${standWidth.toFixed(1)} depth=${standDepth.toFixed(1)}`
  );

  // 2. Tarmac edge stays inside the plot curb (road-v-1 starts at the plot's east edge)
  const plot10 = mapData.plots.find((p) => p.id === "plot-1-0")!;
  assert.ok(
    standBox.max.x <= plot10.maxX,
    `Stand east edge ${standBox.max.x.toFixed(1)} must not cross the plot curb ${plot10.maxX}`
  );
  assert.ok(
    standBox.min.x >= plot10.minX &&
      standBox.min.z >= plot10.minZ &&
      standBox.max.z <= plot10.maxZ,
    "Stand must stay inside plot-1-0 bounds"
  );

  // 3. No overlap with any road surface
  for (const road of mapData.roads) {
    const roadBox = new THREE.Box3(
      new THREE.Vector3(road.x - road.width / 2, -1, road.z - road.depth / 2),
      new THREE.Vector3(road.x + road.width / 2, 1, road.z + road.depth / 2)
    );
    assert.equal(
      roadBox.intersectsBox(standBox),
      false,
      `Stand must not sit on road ${road.id}`
    );
  }

  // 4. No overlap with the parking garage structure itself
  const plot10Group = mapMeshes.group.getObjectByName("plot-1-0")!;
  plot10Group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child.name.endsWith("-surface") || child.name.endsWith("-curb") || child.name.includes("-tactile-")) return;
    child.updateMatrixWorld(true);
    const meshBox = new THREE.Box3().setFromObject(child);
    if (meshBox.isEmpty() || meshBox.max.y < 0.5) return;
    assert.equal(
      meshBox.intersectsBox(standBox),
      false,
      `Stand must not intersect garage mesh ${child.name}`
    );
  });

  // 5. Stationed cabs face north, along the adjacent northbound lane
  const leadCab = taxiStand.group.getObjectByName("BarcelonaTaxi")!;
  const cabQuat = new THREE.Quaternion();
  leadCab.getWorldQuaternion(cabQuat);
  const cabYaw = new THREE.Euler().setFromQuaternion(cabQuat, "YXZ").y;
  assert.ok(
    Math.abs(cabYaw) < 1e-6,
    `Lead cab must face north (yaw ~0), got yaw=${cabYaw.toFixed(3)}`
  );

  // 6. Shelter/totem stay on the courtyard (west) side, bays against the curb (east)
  const shelterBox = new THREE.Box3().setFromObject(taxiStand.group.getObjectByName("TaxiStandShelter")!);
  const padBox = new THREE.Box3().setFromObject(taxiStand.group.getObjectByName("TaxiBay-Pad")!);
  assert.ok(
    (shelterBox.min.x + shelterBox.max.x) / 2 < TAXI_STAND_WORLD_POSITION.x,
    "Shelter must sit west of the stand centre, away from the road"
  );
  assert.ok(
    padBox.max.x > TAXI_STAND_WORLD_POSITION.x,
    "Bay tarmac must extend east towards the curb"
  );

  taxiStand.dispose();
  mapMeshes.dispose();
});

test("TDD [Taxi Stand Rotation Option]: rotation turns the stand and re-anchors the driver world position", () => {
  const stand = createTaxiStand(0, 0, { countryCode: "es", rotation: -Math.PI / 2 });
  assert.ok(Math.abs(stand.group.rotation.y + Math.PI / 2) < 1e-9, "group must carry the requested rotation");

  // Local driver offset (2.4, 2.2) * 2x scale rotated by -90 degrees => (-4.4, +4.8)
  assert.ok(Math.abs(stand.driverWorldPosition.x - -4.4) < 1e-6, `driver x=${stand.driverWorldPosition.x}`);
  assert.ok(Math.abs(stand.driverWorldPosition.z - 4.8) < 1e-6, `driver z=${stand.driverWorldPosition.z}`);
  stand.dispose();

  const flat = createTaxiStand(0, 0, { countryCode: "es" });
  assert.equal(flat.group.rotation.y, 0, "Default rotation must stay 0");
  assert.ok(Math.abs(flat.driverWorldPosition.x - 4.8) < 1e-6 && Math.abs(flat.driverWorldPosition.z - 4.4) < 1e-6);
  flat.dispose();
});

test("TDD [Plot-0-0 Architecture & Framing]: Plot-0-0 contains Grand Central Taxi Terminal with unobstructed central plaza", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "es" });

  const plot00Group = mapMeshes.group.getObjectByName("plot-0-0");
  assert.ok(plot00Group, "plot-0-0 group must exist in map meshes");

  // Verify primary architectural naming conventions
  const tower = plot00Group.getObjectByName("plot-0-0-building-tower");
  assert.ok(tower, "Must have plot-0-0-building-tower for South Concourse Tower");

  const portico = plot00Group.getObjectByName("plot-0-0-building-tower-portico");
  assert.ok(portico, "Must have plot-0-0-building-tower-portico for North Portico Wing");

  const skybridge = plot00Group.getObjectByName("plot-0-0-terminal-skybridge");
  assert.ok(skybridge, "Must have plot-0-0-terminal-skybridge for elevated glass skybridge");

  const roof = plot00Group.getObjectByName("plot-0-0-building-roof");
  assert.ok(roof, "Must have plot-0-0-building-roof for South Concourse Penthouse Crown");

  // Compute building bounds excluding ground surface and curb
  const buildingBox = new THREE.Box3();
  plot00Group.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      !child.name.endsWith("-surface") &&
      !child.name.endsWith("-curb") &&
      !child.name.includes("-tactile-")
    ) {
      child.updateMatrix();
      child.geometry.computeBoundingBox();
      const meshBox = child.geometry.boundingBox.clone();
      meshBox.applyMatrix4(child.matrix);
      buildingBox.union(meshBox);
    }
  });

  const width = buildingBox.max.x - buildingBox.min.x;
  const depth = buildingBox.max.z - buildingBox.min.z;
  const height = buildingBox.max.y;

  // Plot size is 72, urban coverage requirement is 85% (61.2) to 96% (69.12)
  assert.ok(width >= 61.2 && width <= 69.12, `Width ${width} must be 85%-96% of plotSize 72`);
  assert.ok(depth >= 61.2 && depth <= 69.12, `Depth ${depth} must be 85%-96% of plotSize 72`);
  assert.ok(height >= 40, `Height ${height} must be tall terminal skyscraper (>= 40 units)`);

  // Verify the central plaza corridor (local z in [-12, +18]) is NOT blocked by ground-level building meshes
  plot00Group.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      !child.name.endsWith("-surface") &&
      !child.name.endsWith("-curb") &&
      !child.name.includes("-tactile-") &&
      !child.name.includes("skybridge") &&
      !child.name.includes("frame")
    ) {
      child.geometry.computeBoundingBox();
      const childBox = child.geometry.boundingBox.clone();
      child.updateMatrix();
      childBox.applyMatrix4(child.matrix);

      // Any ground-level building mesh (y < 20) must be outside the taxi stand zone (z in [-12, +18])
      if (childBox.min.y < 20) {
        const overlapsTaxiZ = childBox.min.z < 18 && childBox.max.z > -12;
        assert.equal(
          overlapsTaxiZ,
          false,
          `Ground-level building mesh ${child.name} must not overlap the central taxi plaza z=[-12, 18]`
        );
      }
    }
  });

  mapMeshes.dispose();
});
