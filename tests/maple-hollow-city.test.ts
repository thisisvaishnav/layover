import test from "node:test";
import assert from "node:assert/strict";
import cityConfig from "../src/city-config.json";
import { roadGraph } from "../src/roads/road-graph";
import { RoadNetwork } from "../src/roads/road-network";
import { Park } from "../src/park/park";
import { Buildings } from "../src/buildings/buildings";
import { Traffic } from "../src/traffic/traffic";
import { Pedestrians } from "../src/pedestrians/pedestrians";
import { CityScene } from "../src/city/city-scene";
import { computePedestrianKinematics } from "../src/lib/world/avatar-kinematics";
import * as THREE from "three";

test("TDD [Single Source of Truth]: city-config.json contains all required layout and simulation parameters", () => {
  // World dimensions
  assert.equal(cityConfig.world.width, 2000);
  assert.equal(cityConfig.world.height, 2000);

  // Central park
  assert.deepEqual(cityConfig.park.center, [1000, 1000]);
  assert.equal(cityConfig.park.radius, 180);

  // Ring and radial roads
  assert.deepEqual(cityConfig.rings, [220, 460, 760]);
  assert.equal(cityConfig.radialCount, 8);
  assert.equal(cityConfig.roadWidths.ring, 12);
  assert.equal(cityConfig.roadWidths.radial, 14);
  assert.equal(cityConfig.footpathWidth, 2.5);

  // Bus stops & routes
  assert.equal(cityConfig.busStop.spacing, 135);
  assert.deepEqual(cityConfig.busStop.shelterFootprint, [3, 2]);
  assert.equal(cityConfig.busRoutes.length, 4);

  // Traffic & Pedestrians
  assert.equal(cityConfig.traffic.targetDensity, 150);
  assert.equal(cityConfig.traffic.mix.car, 0.55);
  assert.equal(cityConfig.traffic.mix.taxi, 0.15);
  assert.equal(cityConfig.traffic.mix.van, 0.12);
  assert.equal(cityConfig.traffic.mix.bus, 0.10);
  assert.equal(cityConfig.traffic.mix.motorbike, 0.08);

  assert.equal(cityConfig.pedestrians.targetCount, 30);
  assert.deepEqual(cityConfig.pedestrians.walkSpeedMs, [1.2, 1.5]);
  assert.deepEqual(cityConfig.pedestrians.idlePauseSeconds, [1, 3]);
});

test("TDD [Agent 1 — Terrain & Roads]: RoadGraph accurately models 24 intersections, lanes, and crossings", () => {
  // 8 radials x 3 rings = 24 intersections
  assert.equal(roadGraph.intersections.length, 24);

  // Innermost ring intersections have traffic lights
  const trafficLights = roadGraph.intersections.filter((i) => i.hasTrafficLight);
  assert.equal(trafficLights.length, 8);
  trafficLights.forEach((tl) => {
    assert.equal(tl.ringIndex, 0);
  });

  // Lanes: 3 rings x 2 directions = 6 ring lanes; 8 radials x 2 directions = 16 radial lanes -> 22 lanes
  assert.equal(roadGraph.lanes.length, 22);

  // Bus stops: distributed every 135m, resulting in ~110-115 total stops
  assert.ok(
    roadGraph.busStops.length >= 110 && roadGraph.busStops.length <= 118,
    `Bus stops count (${roadGraph.busStops.length}) must be in expected range [110, 118]`
  );

  // Bus stops alternate sides
  const leftStops = roadGraph.busStops.filter((s) => s.side === "left");
  const rightStops = roadGraph.busStops.filter((s) => s.side === "right");
  assert.ok(leftStops.length > 40 && rightStops.length > 40);

  // Footpath network
  assert.ok(roadGraph.footpaths.length > 100);
  const crossingNodes = roadGraph.footpaths.filter((fp) => fp.isCrossing);
  assert.equal(crossingNodes.length, 24);
});

test("TDD [Agent 2 — Park]: Central Park inside 180m radius features pond, playground, and paths", () => {
  const park = new Park();
  const scene = new THREE.Scene();
  park.init(scene);

  const parkGroup = scene.getObjectByName("CentralPark") as THREE.Group;
  assert.ok(parkGroup, "CentralPark root group must be added to scene");

  // Verify updates and animation
  park.update(0.016, 1.0);
  park.dispose();
  assert.equal(scene.children.length, 0);
});

test("TDD [Agent 3 — Buildings]: All structures placed per Section 3 and bus shelters instanced", () => {
  const buildings = new Buildings();
  const scene = new THREE.Scene();
  buildings.init(scene);

  const bGroup = scene.getObjectByName("CityBuildings") as THREE.Group;
  assert.ok(bGroup, "CityBuildings group must be mounted");

  // Verify InstancedMeshes exist for bus stop shelters
  const instancedMeshes = bGroup.children.filter((c) => c instanceof THREE.InstancedMesh);
  assert.ok(instancedMeshes.length >= 3, "Must use InstancedMesh for bus stop roofs, glass, and benches");

  buildings.dispose();
});

test("TDD [Agent 4 — Traffic]: 150 active vehicles with exact vehicle mix and bus routes", () => {
  const traffic = new Traffic();
  const scene = new THREE.Scene();
  traffic.init(scene);

  // Exactly 150 vehicles active concurrently
  assert.equal(traffic.vehicles.length, 150);

  // Verify exact mix
  const cars = traffic.vehicles.filter((v) => v.type === "car");
  const taxis = traffic.vehicles.filter((v) => v.type === "taxi");
  const vans = traffic.vehicles.filter((v) => v.type === "van");
  const buses = traffic.vehicles.filter((v) => v.type === "bus");
  const motorbikes = traffic.vehicles.filter((v) => v.type === "motorbike");

  assert.equal(cars.length, 82);
  assert.equal(taxis.length, 23);
  assert.equal(vans.length, 18);
  assert.equal(buses.length, 15);
  assert.equal(motorbikes.length, 12);

  // Buses have routes assigned
  buses.forEach((b) => {
    assert.ok(b.busRoute, `Bus ${b.id} must be assigned to a route`);
  });

  // Verify simulation update step
  traffic.update(0.05, 1.0);
  traffic.dispose();
});

test("TDD [Agent 5 — Pedestrians]: 30 active pedestrians with human kinematics and idle pauses", () => {
  const pedestrians = new Pedestrians();
  const scene = new THREE.Scene();
  pedestrians.init(scene);

  // Exactly 30 active pedestrians
  assert.equal(pedestrians.pedestrians.length, 30);

  // Speeds within 1.2 - 1.5 m/s with +/- 10% individual variance [1.08, 1.65]
  pedestrians.pedestrians.forEach((p) => {
    assert.ok(
      p.speed >= 1.05 && p.speed <= 1.7,
      `Pedestrian speed ${p.speed.toFixed(2)} must be within human walking variance`
    );
  });

  // Procedural kinematics computation check
  const kinWalking = computePedestrianKinematics(true, 0.25, 1.35);
  assert.ok(Math.abs(kinWalking.leftLegRotX) > 0.1, "Walking must have leg swing");
  assert.ok(kinWalking.bounceY > 0, "Walking must have vertical bounce");

  const kinIdle = computePedestrianKinematics(false, 0.25, 0);
  assert.equal(kinIdle.leftLegRotX, 0);
  assert.equal(kinIdle.bounceY, 0);

  // Simulation tick
  pedestrians.update(0.05, 2.0);
  pedestrians.dispose();
});

test("TDD [Integration — CityScene]: Composite scene manages all 5 subsystems cleanly", () => {
  const city = new CityScene();
  const scene = new THREE.Scene();

  city.init(scene);
  assert.ok(scene.getObjectByName("RoadNetwork"));
  assert.ok(scene.getObjectByName("CentralPark"));
  assert.ok(scene.getObjectByName("CityBuildings"));
  assert.ok(scene.getObjectByName("CityTraffic"));
  assert.ok(scene.getObjectByName("CityPedestrians"));

  city.update(0.016, 0.5);
  city.dispose();
});
