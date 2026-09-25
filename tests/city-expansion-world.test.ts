import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPANDED_WORLD_BOUNDS,
  ROAD_SYSTEM_CONFIG,
  DAYLIGHT_CONFIG,
  CAMERA_VIEW_CONFIG,
  computeCarPosition,
  worldToMinimapCoords,
} from "../src/lib/world/city-expansion";
import { UNIFIED_PLAZA_BOUNDS, getZoneFromPosition } from "../src/lib/world/unified-plaza";

test("TDD [City Expansion]: World bounds expand to provide a grand urban district", () => {
  // Expanded world must be substantially larger than previous 48m x 24m
  const width = EXPANDED_WORLD_BOUNDS.maxX - EXPANDED_WORLD_BOUNDS.minX;
  const depth = EXPANDED_WORLD_BOUNDS.maxZ - EXPANDED_WORLD_BOUNDS.minZ;

  assert.ok(width >= 80, `World width (${width}m) must be at least 80m`);
  assert.ok(depth >= 36, `World depth (${depth}m) must be at least 36m`);

  // Must encompass the original plaza bounds for backward compatibility
  assert.ok(EXPANDED_WORLD_BOUNDS.minX <= UNIFIED_PLAZA_BOUNDS.minX);
  assert.ok(EXPANDED_WORLD_BOUNDS.maxX >= UNIFIED_PLAZA_BOUNDS.maxX);
  assert.ok(EXPANDED_WORLD_BOUNDS.minZ <= UNIFIED_PLAZA_BOUNDS.minZ);
  assert.ok(EXPANDED_WORLD_BOUNDS.maxZ >= UNIFIED_PLAZA_BOUNDS.maxZ);

  // Existing zone detection must still hold
  assert.equal(getZoneFromPosition({ x: -14, y: 0, z: 1 }), "cafe");
  assert.equal(getZoneFromPosition({ x: 0, y: 0, z: 1 }), "bus_stop");
  assert.equal(getZoneFromPosition({ x: 14, y: 0, z: 1 }), "airport");
});

test("TDD [Road & Traffic System]: Defines two-lane boulevard, traffic lights, lamps, and moving cars", () => {
  // Road configuration
  assert.ok(ROAD_SYSTEM_CONFIG.roadWidth >= 8, "Road width must accommodate 2 lanes");
  assert.ok(ROAD_SYSTEM_CONFIG.roadLength >= 80, "Road length must span the city width");
  assert.ok(ROAD_SYSTEM_CONFIG.cars.length >= 4, "Must feature multiple cars in traffic");

  // Street lamps and traffic lights
  assert.ok(ROAD_SYSTEM_CONFIG.streetLamps.length >= 6, "Must have street lamps lining roads");
  assert.ok(ROAD_SYSTEM_CONFIG.trafficLights.length >= 2, "Must have traffic light stations");

  // Every traffic light must specify signals and position
  ROAD_SYSTEM_CONFIG.trafficLights.forEach((tl) => {
    assert.ok(tl.position.x !== undefined && tl.position.z !== undefined);
    assert.ok(["red", "yellow", "green"].includes(tl.initialState));
  });

  // Every car must specify colorCss for zero-alloc canvas rendering
  ROAD_SYSTEM_CONFIG.cars.forEach((c) => {
    assert.ok(c.colorCss && c.colorCss.startsWith("#"), "Each car must have precomputed colorCss");
  });

  // Verify car animation kinematics: Cars loop seamlessly across the road span
  const car = ROAD_SYSTEM_CONFIG.cars[0];
  const t0 = computeCarPosition(car, 0);
  const t1 = computeCarPosition(car, 2);

  // Position at t1 should advance along road direction
  if (car.direction > 0) {
    assert.ok(t1.x > t0.x, "Eastbound car must advance positive X over time");
  } else {
    assert.ok(t1.x < t0.x, "Westbound car must advance negative X over time");
  }

  // Modulo boundary check: car wraps when exceeding road limits
  const farTime = 1000;
  const tFar = computeCarPosition(car, farTime);
  assert.ok(
    tFar.x >= ROAD_SYSTEM_CONFIG.minCarX && tFar.x <= ROAD_SYSTEM_CONFIG.maxCarX,
    "Car position must stay wrapped within road bounds"
  );
});

test("TDD [Daylight & Sky Atmosphere]: Configured for bright day with vivid blue sky", () => {
  // Background sky must be daytime blue (not dark twilight 0x111827)
  assert.equal(DAYLIGHT_CONFIG.skyColorHex, 0x60a5fa, "Sky must be clear daytime sky blue");
  assert.equal(DAYLIGHT_CONFIG.isDaytime, true);
  assert.ok(DAYLIGHT_CONFIG.sunIntensity >= 1.4, "Sunlight must be bright daytime illumination");
  assert.ok(DAYLIGHT_CONFIG.ambientIntensity >= 0.8, "Ambient lighting must be bright day");
  assert.ok(DAYLIGHT_CONFIG.fogColorHex === 0xbae6fd || DAYLIGHT_CONFIG.fogColorHex === 0xe0f2fe);
});

test("TDD [Camera System]: Pulled back for wide panoramic perspective", () => {
  // Existing camera was at Z offset ~9.5, height ~8.2, FOV 45
  // New camera must be pulled further back and higher with wider FOV
  assert.ok(CAMERA_VIEW_CONFIG.height >= 12.0, "Camera height must be elevated for wide view");
  assert.ok(CAMERA_VIEW_CONFIG.zOffset >= 14.0, "Camera Z offset must be pulled back backwards");
  assert.ok(CAMERA_VIEW_CONFIG.fov >= 50, "FOV must be wide (>= 50 degrees)");
});

test("TDD [Minimap Radar HUD]: Accurately transforms 3D world coordinates to 2D radar pixels", () => {
  const mapWidth = 200;
  const mapHeight = 200;

  // Geometric center of world
  const worldCenter = {
    x: (EXPANDED_WORLD_BOUNDS.minX + EXPANDED_WORLD_BOUNDS.maxX) / 2,
    y: 0,
    z: (EXPANDED_WORLD_BOUNDS.minZ + EXPANDED_WORLD_BOUNDS.maxZ) / 2,
  };
  const centerCoords = worldToMinimapCoords(
    worldCenter,
    EXPANDED_WORLD_BOUNDS,
    mapWidth,
    mapHeight
  );
  assert.ok(
    Math.abs(centerCoords.u - mapWidth / 2) < 2,
    "Center X should map near horizontal center of minimap"
  );
  assert.ok(
    Math.abs(centerCoords.v - mapHeight / 2) < 2,
    "Center Z should map near vertical center of minimap"
  );

  // West Café coordinates (-14, 0)
  const cafeCoords = worldToMinimapCoords(
    { x: -14, y: 0, z: 0 },
    EXPANDED_WORLD_BOUNDS,
    mapWidth,
    mapHeight
  );
  assert.ok(cafeCoords.u < centerCoords.u, "Café must map to left/west side of minimap");

  // East Airport coordinates (+14, 0)
  const airportCoords = worldToMinimapCoords(
    { x: 14, y: 0, z: 0 },
    EXPANDED_WORLD_BOUNDS,
    mapWidth,
    mapHeight
  );
  assert.ok(airportCoords.u > centerCoords.u, "Airport must map to right/east side of minimap");

  // Clamping test: Out-of-bounds positions must be safely clamped
  const clampedFar = worldToMinimapCoords(
    { x: 999, y: 0, z: -999 },
    EXPANDED_WORLD_BOUNDS,
    mapWidth,
    mapHeight
  );
  assert.ok(clampedFar.u <= mapWidth, "Clamped U must not exceed mapWidth");
  assert.ok(clampedFar.v >= 0, "Clamped V must not fall below 0");
});
