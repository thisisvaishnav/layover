import test from "node:test";
import assert from "node:assert/strict";
import { generateMap } from "../src/map/map-generator";
import { createTrafficSystem } from "../src/map/traffic-system";

test("TDD [Traffic System]: createTrafficSystem returns valid system and adds vehicles to group", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);

  assert.ok(traffic.group, "Traffic group must exist");
  assert.equal(traffic.group.name, "TrafficSystem");
  assert.ok(traffic.vehicles.length >= 4, "Must have vehicles in traffic system");
  assert.equal(traffic.group.children.length, traffic.vehicles.length);

  traffic.dispose();
});

test("TDD [No Buses on Map]: Buses are removed from map traffic system", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);

  const buses = traffic.vehicles.filter((v) => v.type === "bus");
  assert.equal(buses.length, 0, "No buses must be present on the city map");

  traffic.dispose();
});

test("TDD [Selective Cars]: Fleet has selective, sparse cars with distinct colors", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);

  const cars = traffic.vehicles.filter((v) => v.type === "car");
  // Selective cars: not overcrowded (e.g. 2 to 5 cars)
  assert.ok(cars.length >= 2 && cars.length <= 5, `Must have selective cars (2 to 5 cars), found ${cars.length}`);

  // Total vehicles in city is sparse and selective (<= 8 total)
  assert.ok(traffic.vehicles.length <= 8, `Total traffic fleet should be selective, found ${traffic.vehicles.length}`);

  // Distinct car colors
  const colors = new Set(cars.map((c) => c.color));
  assert.ok(colors.size >= 2, "Cars should feature varied selective colors");

  // Each car has 4 wheels
  for (const car of cars) {
    assert.equal(car.wheels.length, 4, "Car must have 4 wheels");
  }

  traffic.dispose();
});

test("TDD [Traffic Motion & Wheel Animation]: Vehicles advance along roads and wheels spin", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);

  const vehicle = traffic.vehicles[0];
  assert.ok(vehicle);

  const initX = vehicle.group.position.x;
  const initZ = vehicle.group.position.z;
  const initialWheelRot = vehicle.wheels[0].rotation.x;

  // Advance time by 0.5s
  traffic.update(0.5);

  const movedX = vehicle.group.position.x;
  const movedZ = vehicle.group.position.z;
  const updatedWheelRot = vehicle.wheels[0].rotation.x;

  const distMoved = Math.hypot(movedX - initX, movedZ - initZ);
  assert.ok(distMoved > 2.0, `Vehicle must move along the road, moved ${distMoved.toFixed(2)} units`);
  assert.notEqual(updatedWheelRot, initialWheelRot, "Wheels must rotate as vehicle drives");

  traffic.dispose();
});

test("TDD [Traffic Boundaries]: Vehicles wrap around map boundaries without leaving roads", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);

  // Advance large amount of time to simulate multiple wraps
  for (let i = 0; i < 50; i++) {
    traffic.update(0.1);
  }

  for (const v of traffic.vehicles) {
    // Position should always stay within safe road bounds + wrap margin
    assert.ok(
      v.group.position.x >= mapData.bounds.minX - 25 &&
        v.group.position.x <= mapData.bounds.maxX + 25,
      `Vehicle X (${v.group.position.x}) must remain within bounds`
    );
    assert.ok(
      v.group.position.z >= mapData.bounds.minZ - 25 &&
        v.group.position.z <= mapData.bounds.maxZ + 25,
      `Vehicle Z (${v.group.position.z}) must remain within bounds`
    );
  }

  traffic.dispose();
});

test("TDD [Traffic Disposal]: dispose() executes cleanly without error", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);
  assert.doesNotThrow(() => traffic.dispose());
});

test("TDD [Vehicle Scaling - Cars 2x & Zero Buses]: Cars are scaled to 2x and no buses on map", () => {
  const mapData = generateMap();
  const traffic = createTrafficSystem(mapData);

  const buses = traffic.vehicles.filter((v) => v.type === "bus");
  const cars = traffic.vehicles.filter((v) => v.type === "car");

  assert.equal(buses.length, 0, "Must have zero buses");
  assert.ok(cars.length >= 1, "Must have cars");

  for (const car of cars) {
    assert.equal(car.group.scale.x, 2.0, "Car scale.x must be 2.0");
    assert.equal(car.group.scale.y, 2.0, "Car scale.y must be 2.0");
    assert.equal(car.group.scale.z, 2.0, "Car scale.z must be 2.0");
  }

  traffic.dispose();
});

