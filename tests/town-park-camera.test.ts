import test from "node:test";
import assert from "node:assert/strict";
import {
  CHASE_CAMERA_CONFIG,
  CENTRAL_PARK_CONFIG,
  TOWN_FACILITIES_CONFIG,
  DENSE_TRAFFIC_CONFIG,
  PEDESTRIAN_CONFIG,
  computePedestrianPosition,
  computeHumanAvatarKinematics,
  MAPLE_HOLLOW_DISTRICT_BLOCKS,
} from "../src/lib/world/town-park-expansion";
import { UNIFIED_PLAZA_BOUNDS, getZoneFromPosition } from "../src/lib/world/unified-plaza";

test("TDD [Camera Angle & Pitch]: Over-the-shoulder chase camera maintains 10° to 15° downward pitch", () => {
  // Downward pitch angle must be between 10 and 15 degrees
  const pitchDeg = CHASE_CAMERA_CONFIG.pitchDegrees;
  assert.ok(
    pitchDeg >= 10.0 && pitchDeg <= 15.0,
    `Pitch angle (${pitchDeg}°) must be within [10°, 15°]`
  );

  // Geometric verification: arctan((cameraHeight - targetHeight) / followDistance)
  const dy = CHASE_CAMERA_CONFIG.height - CHASE_CAMERA_CONFIG.lookAtTargetOffsetY;
  const dz = CHASE_CAMERA_CONFIG.followDistance;
  const calculatedPitchRad = Math.atan2(dy, dz);
  const calculatedPitchDeg = (calculatedPitchRad * 180) / Math.PI;

  assert.ok(
    calculatedPitchDeg >= 9.8 && calculatedPitchDeg <= 15.2,
    `Calculated trigonometric pitch (${calculatedPitchDeg.toFixed(2)}°) must match 10°-15° specification`
  );

  // Target offset ahead must place avatar in lower-middle portion of screen
  assert.ok(
    CHASE_CAMERA_CONFIG.lookAtAheadDistance >= 1.5,
    "Look-ahead distance must project forward to keep avatar lower-middle on screen"
  );
  assert.ok(
    CHASE_CAMERA_CONFIG.height >= 2.4 && CHASE_CAMERA_CONFIG.height <= 3.8,
    "Camera height must be slightly elevated over the shoulder (2.4m - 3.8m)"
  );
});

test("TDD [Central Park & Universal Access]: Park is in the middle and accessible from all surrounding blocks", () => {
  // Park must be centrally located (X centered near 0, Z centered near 0)
  const park = CENTRAL_PARK_CONFIG.bounds;
  const centerX = (park.minX + park.maxX) / 2;
  const centerZ = (park.minZ + park.maxZ) / 2;

  assert.ok(Math.abs(centerX) <= 2.0, "Central Park must be centered on X axis near 0");
  assert.ok(Math.abs(centerZ) <= 3.0, "Central Park must be centered on Z axis near 0");

  // Park dimensions must be spacious for playground, pond, paths, and trees
  const parkWidth = park.maxX - park.minX;
  const parkDepth = park.maxZ - park.minZ;
  assert.ok(parkWidth >= 24, "Park width must span at least 24m");
  assert.ok(parkDepth >= 14, "Park depth must span at least 14m");

  // Must include pond and playground structures
  assert.ok(CENTRAL_PARK_CONFIG.pond.radius >= 2.5, "Park must feature a central pond");
  assert.ok(CENTRAL_PARK_CONFIG.playground.hasSwings, "Park must include playground swings");
  assert.ok(CENTRAL_PARK_CONFIG.playground.hasSlide, "Park must include playground slide");

  // Universal access: Must have entrance pathways from all 4 cardinal blocks
  assert.ok(CENTRAL_PARK_CONFIG.entrances.west, "Must have entrance from West (Café/High Street)");
  assert.ok(CENTRAL_PARK_CONFIG.entrances.east, "Must have entrance from East (Airport/Civic)");
  assert.ok(CENTRAL_PARK_CONFIG.entrances.north, "Must have entrance from North (Apartment Towers)");
  assert.ok(CENTRAL_PARK_CONFIG.entrances.south, "Must have entrance from South (Transit Boulevard)");

  // Backward compatibility check for zone detection
  assert.equal(getZoneFromPosition({ x: -14, y: 0, z: 1 }), "cafe");
  assert.equal(getZoneFromPosition({ x: 0, y: 0, z: 1 }), "bus_stop");
  assert.equal(getZoneFromPosition({ x: 14, y: 0, z: 1 }), "airport");
});

test("TDD [Multiple Bus Stops & Big Apartment Towers]: Features multiple bus stops and tall towers", () => {
  // Multiple bus stops
  assert.ok(
    TOWN_FACILITIES_CONFIG.busStops.length >= 3,
    `Must feature at least 3 bus stops across town (found ${TOWN_FACILITIES_CONFIG.busStops.length})`
  );

  // Big apartment towers (inspired by Cedar Court in screenshot)
  assert.ok(
    TOWN_FACILITIES_CONFIG.apartmentTowers.length >= 2,
    "Must feature at least 2 apartment towers"
  );
  TOWN_FACILITIES_CONFIG.apartmentTowers.forEach((tower) => {
    assert.ok(tower.height >= 16.0, `Tower ${tower.id} height (${tower.height}m) must be big (>= 16m)`);
    assert.ok(tower.floors >= 5, `Tower ${tower.id} must be multi-story (>= 5 floors)`);
    assert.ok(tower.windowGridCols >= 3, "Tower must feature multi-column window grids");
  });
});

test("TDD [Dense Traffic & Footpath Pedestrians]: Active multi-vehicle traffic and walking pedestrians", () => {
  // Dense vehicle traffic
  assert.ok(
    DENSE_TRAFFIC_CONFIG.cars.length >= 8,
    `Traffic must be dense with >= 8 active vehicles (found ${DENSE_TRAFFIC_CONFIG.cars.length})`
  );

  // Footpath pedestrians
  assert.ok(
    PEDESTRIAN_CONFIG.pedestrians.length >= 4,
    `Footpath must feature walking pedestrians (found ${PEDESTRIAN_CONFIG.pedestrians.length})`
  );

  // Pedestrian kinematic looping
  const ped = PEDESTRIAN_CONFIG.pedestrians[0];
  const p0 = computePedestrianPosition(ped, 0);
  const p1 = computePedestrianPosition(ped, 2);

  if (ped.direction > 0) {
    assert.ok(p1.x > p0.x, "Eastbound pedestrian must advance positive X");
  } else {
    assert.ok(p1.x < p0.x, "Westbound pedestrian must advance negative X");
  }
});

test("TDD [Human Locomotion Kinematics]: Avatar moves and idles like an authentic human", () => {
  // Idle state: subtle natural breathing and relaxed arm posture
  const idleKinematics = computeHumanAvatarKinematics(false, 1.0, 0);
  assert.ok(
    idleKinematics.breathingY !== 0,
    "Idle state must exhibit subtle breathing expansion"
  );
  assert.ok(
    idleKinematics.leftArmRelaxAngle > 0,
    "Human arms at rest hang with natural relaxed forward angle"
  );

  // Walking state: dynamic hip bob, leg opposition, arm opposition, lateral weight transfer
  const walkKinematics = computeHumanAvatarKinematics(true, 0.5, 4.2);
  assert.ok(
    walkKinematics.leftLegRotX !== 0 && walkKinematics.rightLegRotX !== 0,
    "Legs must swing during locomotion"
  );
  assert.ok(
    Math.sign(walkKinematics.leftLegRotX) === -Math.sign(walkKinematics.rightLegRotX),
    "Legs swing in opposition"
  );
  assert.ok(
    walkKinematics.torsoRollSway !== 0,
    "Human locomotion exhibits lateral weight transfer sway"
  );
  assert.ok(walkKinematics.strideBounceY >= 0, "Stride bounce must be positive");
});

test("TDD [Maple Hollow District Map]: Matches districts and landmarks in reference layout", () => {
  const blockNames = MAPLE_HOLLOW_DISTRICT_BLOCKS.map((b) => b.name);

  assert.ok(blockNames.includes("GREEN SPACE"), "Map must feature GREEN SPACE (Elm Park & Pond)");
  assert.ok(blockNames.includes("HIGH STREET"), "Map must feature HIGH STREET (Shops & Café)");
  assert.ok(blockNames.includes("APARTMENTS"), "Map must feature APARTMENTS (Cedar Court)");
  assert.ok(blockNames.includes("TRANSIT"), "Map must feature TRANSIT (Central Station & Bus Depot)");
  assert.ok(blockNames.includes("AIRPORT"), "Map must feature AIRPORT");

  // Every block must have defined coordinate boundaries and icons
  MAPLE_HOLLOW_DISTRICT_BLOCKS.forEach((block) => {
    assert.ok(block.bounds.minX < block.bounds.maxX);
    assert.ok(block.bounds.minZ < block.bounds.maxZ);
    assert.ok(block.icon.length > 0);
  });
});
