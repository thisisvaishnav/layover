import test from "node:test";
import assert from "node:assert/strict";
import { generateMap, getParkSpawnPoint } from "../src/map/map-generator";

// Mirrors the map config WorldCanvas uses when loading the map.
const WORLD_CONFIG = {
  gridSize: 4,
  plotSize: 72,
  roadWidth: 20,
  hasPerimeterRoads: true,
  parkSizeMultiplier: 2,
};

// Central green lawn size from map-mesh-builder (116 on the 2x park, 58 otherwise)
function lawnSizeFor(plotSize: number): number {
  return plotSize >= 120 ? 116 : 58;
}

test("TDD [Park Spawn]: character loads on the park lawn when the map opens", () => {
  const map = generateMap(WORLD_CONFIG);
  const park = map.plots.find((p) => p.type === "park");
  assert.ok(park, "World map must contain a park plot");

  const spawn = getParkSpawnPoint(map);
  const lawnHalf = lawnSizeFor(park.width) / 2;

  assert.equal(spawn.x, park.x, "Spawn is centred on the park plot's east/west axis");
  assert.ok(
    Math.abs(spawn.z - park.z) <= lawnHalf,
    `Spawn z (${spawn.z}) must sit on the green lawn (|z - centre| <= ${lawnHalf})`
  );
  assert.ok(
    Math.abs(spawn.x - park.x) <= lawnHalf,
    "Spawn x must sit on the green lawn, not the perimeter footpath"
  );
});

test("TDD [Park Spawn]: spawn clears the central memorial and faces into the park", () => {
  const map = generateMap(WORLD_CONFIG);
  const park = map.plots.find((p) => p.type === "park")!;
  const spawn = getParkSpawnPoint(map);

  const distFromCentre = Math.hypot(spawn.x - park.x, spawn.z - park.z);
  assert.ok(
    distFromCentre > 13.5 + 0.7,
    `Spawn (${distFromCentre.toFixed(1)} units from centre) must clear the memorial plinth (r 13.5) plus player radius`
  );
  assert.ok(spawn.z < park.z, "Spawn is south of the memorial so the player faces into the park");
  assert.ok(
    spawn.z > park.minZ + 14,
    `Spawn must not hug the plot edge (minZ ${park.minZ} -> spawn ${spawn.z}); it belongs on the lawn`
  );
});

test("TDD [Park Spawn]: spawn stays inside the lawn for the standard 1x park too", () => {
  const map = generateMap({ gridSize: 3, plotSize: 60, roadWidth: 16, hasPerimeterRoads: true, parkSizeMultiplier: 1 });
  const park = map.plots.find((p) => p.type === "park");
  assert.ok(park, "Uniform grid map must still designate a centre park");

  const spawn = getParkSpawnPoint(map);
  const lawnHalf = lawnSizeFor(park.width) / 2;

  assert.ok(Math.abs(spawn.x - park.x) <= lawnHalf, "x on lawn");
  assert.ok(Math.abs(spawn.z - park.z) <= lawnHalf, "z on lawn");
  assert.ok(
    Math.hypot(spawn.x - park.x, spawn.z - park.z) > 13.5,
    "clear of the memorial plinth"
  );
});

test("TDD [Park Spawn]: falls back to the origin when no park plot exists", () => {
  const spawn = getParkSpawnPoint({ config: {} as never, plots: [], roads: [], bounds: {} as never });
  assert.deepEqual(spawn, { x: 0, z: 0 });
});
