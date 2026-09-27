import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import { buildMapMeshes } from "../src/map/map-mesh-builder";
import { createTrafficSystem } from "../src/map/traffic-system";
import { createCoffeeShop } from "../src/interaction/coffee-shop";
import { createBusStop } from "../src/interaction/bus-stop";
import { createTaxiStand } from "../src/interaction/taxi-stand";
import { createBarberShop } from "../src/interaction/barber-shop";
import {
  createPlayerState,
  updatePlayerMovement,
  updatePlayerMovementState,
  resolveCollisions,
  DEFAULT_MOVEMENT_CONFIG,
  type ObstacleCollider,
  type BoxCollider,
  type KeyboardInput,
  type PlayerState,
} from "../src/player/movement-controller";
import {
  buildObstacleColliders,
  PlayerCollisionWorld,
} from "../src/player/world-collision";

const PLAYER_RADIUS = DEFAULT_MOVEMENT_CONFIG.playerRadius ?? 0.7;

interface Footprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function unionFootprint(colliders: ObstacleCollider[]): Footprint {
  const boxes = colliders.filter((c): c is BoxCollider => c.type === "box");
  assert.ok(boxes.length > 0, "Expected at least one box collider");
  const fp = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const b of boxes) {
    fp.minX = Math.min(fp.minX, b.minX);
    fp.maxX = Math.max(fp.maxX, b.maxX);
    fp.minZ = Math.min(fp.minZ, b.minZ);
    fp.maxZ = Math.max(fp.maxZ, b.maxZ);
  }
  return fp;
}

function distanceToBox(pos: { x: number; z: number }, box: BoxCollider): number {
  const cx = Math.max(box.minX, Math.min(box.maxX, pos.x));
  const cz = Math.max(box.minZ, Math.min(box.maxZ, pos.z));
  return Math.hypot(pos.x - cx, pos.z - cz);
}

/** Walks from start to end in small steps, resolving collisions every step. */
function walkThrough(
  colliders: ObstacleCollider[],
  start: { x: number; z: number },
  end: { x: number; z: number },
  steps = 400
): { x: number; z: number } {
  const pos = { x: start.x, z: start.z };
  const total = Math.hypot(end.x - start.x, end.z - start.z);
  const stepSize = total / steps;
  for (let i = 0; i < steps; i++) {
    const dx = end.x - pos.x;
    const dz = end.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 1e-6) break;
    const advance = Math.min(stepSize, dist);
    pos.x += (dx / dist) * advance;
    pos.z += (dz / dist) * advance;
    resolveCollisions(pos, PLAYER_RADIUS, colliders);
  }
  return pos;
}

// ==========================================
// 1. SOLID OBSTACLE RESOLUTION
// ==========================================

test("TDD [Solid Obstacle Resolution]: Player is pushed out of solid boxes and never rests inside one", () => {
  const wall: BoxCollider = { type: "box", minX: -4, maxX: 4, minZ: -1, maxZ: 1, name: "synthetic-wall" };

  const inside = { x: 0, z: 0 };
  const collided = resolveCollisions(inside, PLAYER_RADIUS, [wall]);
  assert.ok(collided, "Standing inside a wall must trigger collision resolution");
  assert.ok(
    distanceToBox(inside, wall) >= PLAYER_RADIUS - 1e-6,
    `Player must be pushed fully outside the wall, gap=${distanceToBox(inside, wall).toFixed(3)}`
  );
  assert.ok(inside.z <= wall.minZ - PLAYER_RADIUS + 1e-6 || inside.z >= wall.maxZ + PLAYER_RADIUS - 1e-6,
    "Push-out must happen along the nearest face");

  // Walking across the wall in small steps must never leave the player inside it
  const crossing = walkThrough([wall], { x: 0, z: -6 }, { x: 0, z: 6 }, 300);
  assert.ok(
    crossing.z <= wall.minZ - PLAYER_RADIUS + 1e-6,
    "Wall must resist the player: crossing attempt must stop at the near face"
  );
});

// ==========================================
// 2. SHOPS ARE SOLID (Coffee shop, Bus stand, Taxi stand, Barber shop)
// ==========================================

test("TDD [Shop Colliders]: Coffee shop, bus stand, taxi stand and barber shop block the player from passing through", () => {
  const shops: [string, THREE.Group][] = [
    ["CoffeeShop", createCoffeeShop(0, 0).group],
    ["BusStand", createBusStop(0, 0).group],
    ["TaxiStand", createTaxiStand(0, 0, { countryCode: "es" }).group],
    ["BarberShop", createBarberShop(0, 0, { countryCode: "es", rotation: -Math.PI / 2 }).group],
  ];

  for (const [label, group] of shops) {
    const colliders = buildObstacleColliders([group]);
    assert.ok(colliders.length >= 3, `${label} must expose blocking colliders, got ${colliders.length}`);

    const fp = unionFootprint(colliders);
    assert.ok(fp.maxX - fp.minX > 3, `${label} footprint must cover the structure width`);
    assert.ok(fp.maxZ - fp.minZ > 3, `${label} footprint must cover the structure depth`);

    const centerX = (fp.minX + fp.maxX) / 2;
    const frontToBack = walkThrough(
      colliders,
      { x: centerX, z: fp.maxZ + 4 },
      { x: centerX, z: fp.minZ - 4 }
    );
    assert.ok(
      frontToBack.z > fp.minZ + 1,
      `${label} must not be walk-through front-to-back: player emerged at z=${frontToBack.z.toFixed(2)} (back edge z=${fp.minZ.toFixed(2)})`
    );

    const backToFront = walkThrough(
      colliders,
      { x: centerX, z: fp.minZ - 4 },
      { x: centerX, z: fp.maxZ + 4 }
    );
    assert.ok(
      backToFront.z < fp.maxZ - 1,
      `${label} must not be walk-through back-to-front: player emerged at z=${backToFront.z.toFixed(2)} (front edge z=${fp.maxZ.toFixed(2)})`
    );
  }
});

test("TDD [Street Light Colliders]: Street lamps, traffic lights and park lamps block the player", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });

  const colliders = buildObstacleColliders(meshSystem.obstacleObjects);
  assert.ok(colliders.length >= 10, `Map must expose obstacle colliders, got ${colliders.length}`);

  // Tall thin poles = street lamps + traffic light masts (registered as map obstacles)
  const poles: THREE.Box3[] = [];
  for (const obj of meshSystem.obstacleObjects) {
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) continue;
    const width = box.max.x - box.min.x;
    const depth = box.max.z - box.min.z;
    const height = box.max.y - box.min.y;
    if (height > 5 && width < 3 && depth < 3) poles.push(box);
  }
  assert.ok(poles.length >= 4, `Street/traffic light poles must be registered as obstacles, found ${poles.length}`);

  for (const pole of poles.slice(0, 6)) {
    const pos = { x: (pole.min.x + pole.max.x) / 2, z: (pole.min.z + pole.max.z) / 2 };
    const hit = resolveCollisions(pos, PLAYER_RADIUS, colliders);
    assert.ok(hit, "Street furniture pole must block the player");
    const boxCollider: BoxCollider = {
      type: "box",
      minX: pole.min.x,
      maxX: pole.max.x,
      minZ: pole.min.z,
      maxZ: pole.max.z,
    };
    assert.ok(
      distanceToBox(pos, boxCollider) >= PLAYER_RADIUS - 1e-6,
      "Player must be kept outside the pole radius"
    );
  }

  // Park lamps must also be solid
  const parkLamps: THREE.Object3D[] = [];
  meshSystem.group.traverse((obj) => {
    if (obj.name.includes("-park-lamp-") && !obj.name.includes("head")) parkLamps.push(obj);
  });
  assert.ok(parkLamps.length >= 4, `Park lamps must exist, found ${parkLamps.length}`);

  for (const lamp of parkLamps.slice(0, 4)) {
    lamp.updateWorldMatrix(true, false);
    const world = new THREE.Vector3().setFromMatrixPosition(lamp.matrixWorld);
    const pos = { x: world.x, z: world.z };
    assert.ok(
      resolveCollisions(pos, PLAYER_RADIUS, colliders),
      `Park lamp at (${world.x.toFixed(1)}, ${world.z.toFixed(1)}) must block the player`
    );
  }

  meshSystem.dispose();
});

// ==========================================
// 4. WALLS (Buildings) RESIST THE PLAYER
// ==========================================

test("TDD [Wall Resistance]: Walking into a building never places the player inside the building footprint", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const colliders = buildObstacleColliders(meshSystem.obstacleObjects);

  const buildings = colliders.filter(
    (c): c is BoxCollider =>
      c.type === "box" && c.maxX - c.minX > 12 && c.maxZ - c.minZ > 12
  );
  assert.ok(buildings.length > 0, "Map must contain building footprint colliders");

  for (const building of buildings.slice(0, 3)) {
    const pos = { x: building.minX - 5, z: (building.minZ + building.maxZ) / 2 };
    for (let i = 0; i < 120; i++) {
      pos.x += 0.3;
      resolveCollisions(pos, PLAYER_RADIUS, [building]);
    }
    assert.ok(
      pos.x <= building.minX - PLAYER_RADIUS + 1e-6,
      `Wall must resist: player stopped at x=${pos.x.toFixed(2)}, wall edge x=${building.minX.toFixed(2)}`
    );
  }

  meshSystem.dispose();
});

// ==========================================
// 5. MOVING CARS ARE SOLID + COLLIDERS TRACK THEM
// ==========================================

test("TDD [Traffic Car Colliders]: Cars block the player and their colliders follow the moving car", () => {
  const map = generateMap({ gridSize: 4 });
  const traffic = createTrafficSystem(map);
  assert.ok(traffic.vehicles.length > 0, "Traffic must spawn vehicles");

  const world = new PlayerCollisionWorld();
  world.addDynamic(traffic.vehicles.map((v) => v.group));
  assert.ok(world.colliders.length > 0, "Vehicles must produce colliders");

  const car = traffic.vehicles[0];
  const carPos = { x: car.group.position.x, z: car.group.position.z };

  const blocker = { x: carPos.x, z: carPos.z };
  assert.ok(
    resolveCollisions(blocker, PLAYER_RADIUS, world.colliders),
    "Standing where the car is must trigger collision"
  );
  assert.ok(Math.hypot(blocker.x - carPos.x, blocker.z - carPos.z) > 0.1, "Player must be pushed out of the car");

  // Move traffic forward and verify colliders track the new car position
  traffic.update(1.0);
  world.refreshDynamic();

  const oldSpot = world.colliders.filter(
    (c): c is BoxCollider => c.type === "box" &&
      c.minX <= carPos.x && c.maxX >= carPos.x && c.minZ <= carPos.z && c.maxZ >= carPos.z
  );
  const newCarPos = { x: car.group.position.x, z: car.group.position.z };
  assert.notEqual(newCarPos.x, carPos.x, "Car must have moved");
  const newSpot = world.colliders.filter(
    (c): c is BoxCollider => c.type === "box" &&
      c.minX <= newCarPos.x && c.maxX >= newCarPos.x && c.minZ <= newCarPos.z && c.maxZ >= newCarPos.z
  );
  assert.ok(newSpot.length > 0, "Collider must follow the car to its new position");
  assert.equal(oldSpot.length, 0, "Collider must not stay behind at the old car position");

  traffic.dispose();
});

// ==========================================
// 6. INTEGRATED PLAYER MOVEMENT (Keyboard + Click-to-move)
// ==========================================

test("TDD [Keyboard Wall Resistance]: Keyboard movement is resisted by walls instead of passing through", () => {
  const wall: BoxCollider = { type: "box", minX: -10, maxX: 10, minZ: -1, maxZ: 1, name: "wall" };
  const bounds = generateMap({ gridSize: 4 }).bounds;

  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
  camera.position.set(0, 15, -20);
  camera.lookAt(0, 1.4, 0);
  camera.updateMatrixWorld();

  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  let state: PlayerState = createPlayerState({ position: { x: 0, y: 0, z: -8 } });

  for (let i = 0; i < 90; i++) {
    state = updatePlayerMovementState(state, input, camera, 0.05, bounds, 0.8, DEFAULT_MOVEMENT_CONFIG, [wall]);
  }

  assert.ok(
    state.position.z <= wall.minZ - PLAYER_RADIUS + 1e-6,
    `Player must be resisted by the wall (z=${state.position.z.toFixed(2)})`
  );
});

test("TDD [Click-to-Move Wall Stop]: Player stops at the wall instead of walking in place against it", () => {
  const wall: BoxCollider = { type: "box", minX: -10, maxX: 10, minZ: -1, maxZ: 1, name: "wall" };
  const bounds = generateMap({ gridSize: 4 }).bounds;

  let state: PlayerState = {
    ...createPlayerState({ position: { x: 0, y: 0, z: -8 } }),
    target: { x: 0, z: 8 },
    isMoving: true,
    movementState: "MOVING",
  };

  for (let i = 0; i < 90; i++) {
    state = updatePlayerMovement(state, 0.05, bounds, 0.8, [wall]);
    if (!state.isMoving) break;
  }

  assert.ok(
    state.position.z <= wall.minZ - PLAYER_RADIUS + 1e-6,
    `Player must stop at the wall (z=${state.position.z.toFixed(2)})`
  );
  assert.equal(state.target, null, "Blocked destination must be cancelled");
  assert.equal(state.isMoving, false, "Player must not keep walking in place against the wall");
});

// ==========================================
// 7. COLLISION WORLD WIRING
// ==========================================

test("TDD [Collision World]: Static map obstacles, shops and dynamic cars are all tracked together", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const traffic = createTrafficSystem(map);

  const world = new PlayerCollisionWorld();
  world.addStatic(meshSystem.obstacleObjects);
  world.addStatic([
    createCoffeeShop(0, 0).group,
    createBusStop(0, 0).group,
    createTaxiStand(0, 0, { countryCode: "es" }).group,
    createBarberShop(0, 0, { countryCode: "es", rotation: -Math.PI / 2 }).group,
  ]);
  world.addDynamic(traffic.vehicles.map((v) => v.group));

  assert.ok(world.colliders.length >= 20, `Collision world must be populated, got ${world.colliders.length}`);
  assert.equal(world.colliders.length, world.staticCount + world.dynamicCount,
    "Static + dynamic colliders must both be exposed");

  const building = world.colliders.find(
    (c): c is BoxCollider => c.type === "box" && c.maxX - c.minX > 12 && c.maxZ - c.minZ > 12
  );
  assert.ok(building, "Collision world must contain a building footprint");
  const probe = { x: (building.minX + building.maxX) / 2, z: (building.minZ + building.maxZ) / 2 };
  assert.ok(world.resolve(probe, PLAYER_RADIUS), "Collision world must resolve overlaps");
  assert.ok(
    distanceToBox(probe, building) >= PLAYER_RADIUS - 1e-6,
    "Player must be pushed out of the building"
  );

  // Static colliders persist while dynamics refresh
  const before = world.staticCount;
  traffic.update(0.5);
  world.refreshDynamic();
  assert.equal(world.staticCount, before, "Static colliders must stay cached across dynamic refreshes");

  meshSystem.dispose();
  traffic.dispose();
});
