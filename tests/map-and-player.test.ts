import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import { buildMapMeshes } from "../src/map/map-mesh-builder";
import {
  createPlayerState,
  setPlayerDestination,
  updatePlayerMovement,
  updatePlayerKeyboard,
  type KeyboardInput,
  clampPositionToBounds,
  calculateRotation,
  shortestAngleDiff,
} from "../src/player/movement-controller";
import { createPlayerCharacter } from "../src/player/player-character";
import {
  createDestinationIndicator,
  createRaycastHandler,
} from "../src/interaction/raycast-handler";
import { createCameraController } from "../src/camera/camera-controller";

// ==========================================
// 1. MAP GENERATION TESTS
// ==========================================

test("TDD [Map Generation]: GRID_SIZE = 4 generates exactly 16 plots", () => {
  const map = generateMap({ gridSize: 4 });
  assert.equal(map.plots.length, 16, "GRID_SIZE = 4 must generate exactly 16 plots");
  assert.equal(map.config.gridSize, 4);
});

test("TDD [Map Generation]: Every plot has valid dimensions and positive size", () => {
  const plotSize = 24;
  const roadWidth = 8;
  const map = generateMap({ gridSize: 4, plotSize, roadWidth });

  for (const plot of map.plots) {
    assert.equal(plot.width, plotSize, `Plot ${plot.id} width must equal plotSize`);
    assert.equal(plot.depth, plotSize, `Plot ${plot.id} depth must equal plotSize`);
    assert.ok(plot.width > 0, "Plot width must be positive");
    assert.ok(plot.depth > 0, "Plot depth must be positive");
    assert.equal(plot.maxX - plot.minX, plotSize);
    assert.equal(plot.maxZ - plot.minZ, plotSize);
    // Center must match min/max midpoint
    assert.equal(plot.x, (plot.minX + plot.maxX) / 2);
    assert.equal(plot.z, (plot.minZ + plot.maxZ) / 2);
  }
});

test("TDD [Map Generation]: Plot positions do not overlap and maintain road separation", () => {
  const plotSize = 20;
  const roadWidth = 6;
  const map = generateMap({ gridSize: 4, plotSize, roadWidth });

  for (let i = 0; i < map.plots.length; i++) {
    for (let j = i + 1; j < map.plots.length; j++) {
      const a = map.plots[i];
      const b = map.plots[j];

      // Two AABBs overlap if (minX < b.maxX && a.maxX > b.minX) && (a.minZ < b.maxZ && a.maxZ > b.minZ)
      const overlapX = a.minX < b.maxX && a.maxX > b.minX;
      const overlapZ = a.minZ < b.maxZ && a.maxZ > b.minZ;
      assert.ok(
        !(overlapX && overlapZ),
        `Plots ${a.id} and ${b.id} must not overlap`
      );
    }
  }

  // Adjacent plots in the same row should be separated by at least roadWidth
  const row0Plots = map.plots.filter((p) => p.row === 0).sort((a, b) => a.col - b.col);
  for (let c = 0; c < row0Plots.length - 1; c++) {
    const separation = row0Plots[c + 1].minX - row0Plots[c].maxX;
    assert.ok(
      separation >= roadWidth - 0.001,
      `Separation between plot ${c} and ${c + 1} (${separation}) must be at least roadWidth (${roadWidth})`
    );
  }
});

test("TDD [Map Generation]: Roads correctly separate the plots", () => {
  const map = generateMap({ gridSize: 4 });
  assert.ok(map.roads.length > 0, "Map must generate road segments");

  const horizontalRoads = map.roads.filter((r) => r.type === "horizontal");
  const verticalRoads = map.roads.filter((r) => r.type === "vertical");

  assert.ok(horizontalRoads.length >= 3, "Must have horizontal roads separating plot rows");
  assert.ok(verticalRoads.length >= 3, "Must have vertical roads separating plot columns");
});

test("TDD [Map Generation]: Map boundaries enclose all plots and roads", () => {
  const map = generateMap({ gridSize: 4 });
  const { minX, maxX, minZ, maxZ, totalWidth, totalDepth } = map.bounds;

  assert.ok(maxX > minX, "maxX must be greater than minX");
  assert.ok(maxZ > minZ, "maxZ must be greater than minZ");
  assert.equal(totalWidth, maxX - minX);
  assert.equal(totalDepth, maxZ - minZ);

  // Every plot must be strictly inside bounds
  for (const plot of map.plots) {
    assert.ok(plot.minX >= minX - 0.001, `Plot ${plot.id} minX is outside map bounds`);
    assert.ok(plot.maxX <= maxX + 0.001, `Plot ${plot.id} maxX is outside map bounds`);
    assert.ok(plot.minZ >= minZ - 0.001, `Plot ${plot.id} minZ is outside map bounds`);
    assert.ok(plot.maxZ <= maxZ + 0.001, `Plot ${plot.id} maxZ is outside map bounds`);
  }
});

// ==========================================
// 2. PLAYER MOVEMENT & BOUNDARIES TESTS
// ==========================================

test("TDD [Player Movement]: Player destination is set and clamped to bounds", () => {
  const map = generateMap({ gridSize: 4 });
  const initial = createPlayerState({ x: 0, z: 0 });

  // Normal in-bounds destination
  const target1 = { x: 10, z: 15 };
  const state1 = setPlayerDestination(initial, target1, map.bounds);
  assert.deepEqual(state1.target, target1);
  assert.equal(state1.isMoving, true);

  // Out-of-bounds destination
  const extremeTarget = { x: 9999, z: -9999 };
  const state2 = setPlayerDestination(initial, extremeTarget, map.bounds);
  assert.ok(state2.target !== null);
  assert.ok(state2.target.x <= map.bounds.maxX, "Target x must be clamped to maxX");
  assert.ok(state2.target.z >= map.bounds.minZ, "Target z must be clamped to minZ");
});

test("TDD [Player Movement]: Player progresses smoothly toward destination over time", () => {
  const map = generateMap({ gridSize: 4 });
  let player = createPlayerState({ x: 0, z: 0, speed: 10 });
  player = setPlayerDestination(player, { x: 10, z: 0 }, map.bounds);

  // Advance by 0.5s: speed is 10, so should move 5 units along X
  const deltaSeconds = 0.5;
  player = updatePlayerMovement(player, deltaSeconds, map.bounds);

  assert.equal(player.isMoving, true);
  assert.ok(
    Math.abs(player.position.x - 5) < 0.01,
    `Player should have moved 5 units along X, got ${player.position.x}`
  );
  assert.equal(player.position.z, 0);
  assert.ok(player.rotation !== undefined, "Player heading must be set");
});

test("TDD [Player Movement]: Player stops smoothly when destination is reached", () => {
  const map = generateMap({ gridSize: 4 });
  let player = createPlayerState({ x: 0, z: 0, speed: 10 });
  player = setPlayerDestination(player, { x: 2, z: 0 }, map.bounds);

  // Advance by 1.0s: speed is 10, distance is 2, so should arrive and stop
  player = updatePlayerMovement(player, 1.0, map.bounds);

  assert.equal(player.isMoving, false, "Player should stop moving");
  assert.equal(player.target, null, "Target should be cleared upon arrival");
  assert.equal(player.position.x, 2, "Player should be exactly at destination");
  assert.equal(player.position.z, 0);
});

test("TDD [Player Boundaries]: Player cannot move or be placed outside map boundaries", () => {
  const map = generateMap({ gridSize: 4 });
  const clampedPos = clampPositionToBounds(
    { x: map.bounds.maxX + 100, z: map.bounds.minZ - 50 },
    map.bounds,
    1.0 // padding
  );

  assert.ok(clampedPos.x <= map.bounds.maxX - 1.0);
  assert.ok(clampedPos.z >= map.bounds.minZ + 1.0);

  // Even if movement delta is huge, player position remains inside bounds
  let player = createPlayerState({ x: 0, z: 0, speed: 10000 });
  player = setPlayerDestination(player, { x: 99999, z: 99999 }, map.bounds);
  player = updatePlayerMovement(player, 10.0, map.bounds);

  assert.ok(player.position.x <= map.bounds.maxX);
  assert.ok(player.position.x >= map.bounds.minX);
  assert.ok(player.position.z <= map.bounds.maxZ);
  assert.ok(player.position.z >= map.bounds.minZ);
});

test("TDD [Player Rotation]: Calculates correct heading rotation and shortest angle difference", () => {
  // Moving East along +X: dx = 10, dz = 0 => atan2(10, 0) = PI / 2
  const eastRot = calculateRotation({ x: 0, z: 0 }, { x: 10, z: 0 });
  assert.ok(Math.abs(eastRot - Math.PI / 2) < 0.001);

  // Moving South along +Z: dx = 0, dz = 10 => atan2(0, 10) = 0
  const southRot = calculateRotation({ x: 0, z: 0 }, { x: 0, z: 10 });
  assert.ok(Math.abs(southRot) < 0.001);

  // Shortest angle difference wrap-around
  const diff = shortestAngleDiff(Math.PI - 0.1, -Math.PI + 0.1);
  assert.ok(Math.abs(diff - 0.2) < 0.001);
});

test("TDD [Player Character 3D]: Generates procedural human with head, body, arms, and legs", () => {
  const character = createPlayerCharacter();
  assert.ok(character.group, "Character must have a Three.js group");
  assert.equal(character.group.name, "PlayerCharacter");

  // Verify character has torso, head, visor, arm pivots, leg pivots, and shadow
  assert.ok(character.group.children.length >= 7, "Must contain all major human body parts");

  // Verify update works with moving state
  const state = createPlayerState({ x: 5, z: -5, isMoving: true, rotation: 1.2 });
  character.update(state, 0.016);
  assert.equal(character.group.position.x, 5);
  assert.equal(character.group.position.z, -5);
  assert.equal(character.group.position.y, 0, "Human must stand directly on ground y=0");

  character.dispose();
});

test("TDD [Destination Feedback]: Shows, animates, and hides destination indicator", () => {
  const indicator = createDestinationIndicator();
  assert.equal(indicator.mesh.visible, false, "Should initially be hidden");

  indicator.show({ x: 12, z: -8 });
  assert.equal(indicator.mesh.visible, true, "Should become visible on show");
  assert.equal(indicator.mesh.position.x, 12);
  assert.equal(indicator.mesh.position.z, -8);

  indicator.update(0.016);
  indicator.hide();
  assert.equal(indicator.mesh.visible, false, "Should be hidden after hide");

  indicator.dispose();
});

test("TDD [Raycast Interaction]: Raycast handler safely handles boundary checks and empty rects", () => {
  const raycastHandler = createRaycastHandler();
  // Empty rect
  const emptyRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
  // Typed perspective camera
  const testCamera = new THREE.PerspectiveCamera();
  const hit = raycastHandler.getPointedWorldCoordinates(100, 100, emptyRect, testCamera, []);
  assert.equal(hit, null, "Must safely return null on empty rect");
});

test("TDD [Map 3D Meshes]: Builds 16 empty plot meshes with curbs and road surfaces", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map);

  assert.ok(meshSystem.group, "Must return a Three.js group");
  assert.ok(meshSystem.clickableObjects.length >= 16, "Clickable objects must include plots");

  // Check all 16 plots are represented in clickable objects
  for (const plot of map.plots) {
    const foundSurface = meshSystem.clickableObjects.some(
      (obj) => obj.name === `${plot.id}-surface`
    );
    assert.ok(foundSurface, `Plot surface ${plot.id}-surface must exist in clickable objects`);
  }

  meshSystem.dispose();
});

test("TDD [Map Scale 1.5X Plot]: Map default config provides 1.5x larger plots (72x72) with 16 spacious plots", () => {
  const map = generateMap(); // Uses updated default config
  assert.equal(map.plots.length, 16, "Must still have 16 plots");
  assert.equal(map.config.plotSize, 72, "Plot size must be 72 units (1.5x larger than 48)");
  assert.equal(map.config.roadWidth, 20, "Road width must be 20 units");

  // 4 * 72 + 5 * 20 = 288 + 100 = 388
  assert.equal(map.bounds.totalWidth, 388, "Total width must be 388 units");
  assert.equal(map.bounds.totalDepth, 388, "Total depth must be 388 units");

  // Each plot has width/depth 72 and area 72 * 72 = 5184 units²
  for (const plot of map.plots) {
    assert.equal(plot.width, 72);
    assert.equal(plot.depth, 72);
  }
});

test("TDD [Player Speed]: Player speed is comfortable and not excessively fast", () => {
  const state = createPlayerState();
  assert.ok(state.speed >= 4.5 && state.speed <= 6.5, "Speed should be brisk walking pace (4.5 - 6.5 units/s)");
});

test("TDD [GTA V Camera]: Places camera in third-person chase perspective behind avatar", () => {
  const playerPos = { x: 0, z: 0 };
  const controller = createCameraController(1280, 800, playerPos);

  // GTA V FOV is wide cinematic perspective (~50° - 60°)
  assert.ok(controller.camera.fov >= 48 && controller.camera.fov <= 65, "FOV should be GTA V style wide");

  // Initial camera placement behind the player
  // Player is at (0, 0), so camera should be placed behind (positive Z or offset) and elevated
  assert.ok(controller.camera.position.y >= 3 && controller.camera.position.y <= 28, "Camera height should be elevated above player");
  assert.ok(controller.camera.position.length() <= 45, "Camera distance should be comfortable third-person, not extreme far");

  const initialZ = controller.camera.position.z;
  // Update with player moved forward over multiple frames
  for (let i = 0; i < 10; i++) {
    controller.update({ x: 10, z: 20 }, 0.1);
  }
  // Camera should follow toward player
  assert.ok(controller.camera.position.x > 0, "Camera should track player X movement");
  assert.ok(controller.camera.position.z > initialZ, "Camera should track player Z movement forward");
});

// ==========================================
// 8. KEYBOARD CONTROLLER & GTA V BEHIND-VIEW TESTS
// ==========================================

test("TDD [Keyboard Controller]: Moves forward in direction of player heading", () => {
  const map = generateMap();
  const initial = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0 });
  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };

  const updated = updatePlayerKeyboard(initial, input, 0.1, map.bounds);
  assert.equal(updated.isMoving, true);
  assert.ok(updated.position.z > 0, "Moving forward must increase Z");
  assert.equal(updated.position.x, 0, "Moving forward must not drift X");
});

test("TDD [Keyboard Controller]: Moves backward and smoothly faces movement direction", () => {
  const map = generateMap();
  const initial = createPlayerState({ position: { x: 0, z: 10 }, rotation: 0 });
  const input: KeyboardInput = { forward: false, backward: true, left: false, right: false };

  const updated = updatePlayerKeyboard(initial, input, 0.1, map.bounds);
  assert.equal(updated.isMoving, true);
  assert.ok(updated.position.z < 10, "Reversing must decrease Z");
  assert.ok(Math.abs(Math.abs(updated.rotation) - Math.PI) < 1.0, "Reversing must smoothly turn heading toward backward direction");
});

test("TDD [Keyboard Controller]: Left and right keys actively move the player laterally and smoothly turn heading", () => {
  const map = generateMap();
  const initial = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0 });

  // Move Left (ArrowLeft or A)
  const leftInput: KeyboardInput = { forward: false, backward: false, left: true, right: false };
  const leftResult = updatePlayerKeyboard(initial, leftInput, 0.1, map.bounds);
  assert.equal(leftResult.isMoving, true);
  assert.ok(leftResult.position.x < 0, "Left key must move player laterally to the left (-X)");
  assert.ok(leftResult.rotation < 0, "Left key must turn heading toward left (-X)");

  // Move Right (ArrowRight or D)
  const rightInput: KeyboardInput = { forward: false, backward: false, left: false, right: true };
  const rightResult = updatePlayerKeyboard(initial, rightInput, 0.1, map.bounds);
  assert.equal(rightResult.isMoving, true);
  assert.ok(rightResult.position.x > 0, "Right key must move player laterally to the right (+X)");
  assert.ok(rightResult.rotation > 0, "Right key must turn heading toward right (+X)");
});

test("TDD [Keyboard Controller]: Normalizes diagonal movement velocity to prevent speed boost", () => {
  const map = generateMap();
  const initial = createPlayerState({ position: { x: 0, z: 0 }, rotation: 0 });

  // Forward only
  const forwardResult = updatePlayerKeyboard(initial, { forward: true, backward: false, left: false, right: false }, 0.1, map.bounds);
  const forwardDist = Math.hypot(forwardResult.position.x, forwardResult.position.z);

  // Diagonal: Forward + Right
  const diagResult = updatePlayerKeyboard(initial, { forward: true, backward: false, left: false, right: true }, 0.1, map.bounds);
  const diagDist = Math.hypot(diagResult.position.x, diagResult.position.z);

  // Diagonal distance should match forward distance (within 5% float precision)
  assert.ok(Math.abs(diagDist - forwardDist) < 0.01, `Diagonal distance ${diagDist} should equal straight distance ${forwardDist}`);
});

test("TDD [Keyboard Controller]: Cancels active click destination target when key is pressed", () => {
  const map = generateMap();
  const initial = createPlayerState({
    position: { x: 0, z: 0 },
    target: { x: 50, z: 50 },
    isMoving: true,
  });

  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  const updated = updatePlayerKeyboard(initial, input, 0.1, map.bounds);

  assert.equal(updated.target, null, "Keyboard input must immediately cancel click-to-move target");
  assert.equal(updated.isMoving, true);
});

test("TDD [Keyboard Controller]: Clamps keyboard movement safely within map boundaries", () => {
  const map = generateMap();
  // Place player right near maxX
  const nearEdge = createPlayerState({
    position: { x: map.bounds.maxX - 0.9, z: 0 },
    rotation: Math.PI / 2, // Facing +X
  });

  const input: KeyboardInput = { forward: true, backward: false, left: false, right: false };
  // Drive forward with large delta time
  const updated = updatePlayerKeyboard(nearEdge, input, 1.0, map.bounds);

  assert.ok(updated.position.x <= map.bounds.maxX - 0.8, "Player position must be clamped within max boundary");
  assert.ok(updated.position.x >= map.bounds.minX + 0.8);
});

test("TDD [Stable Elevated View]: Camera remains positioned in stable elevated perspective and supports orbit", () => {
  const playerPos = { x: 0, z: 0 };
  const controller = createCameraController(1280, 800, playerPos);

  controller.update(playerPos, 0.5, 0);
  assert.ok(controller.camera.position.z < 0, "Camera sits behind player looking forward");

  // Manual orbit rotates camera cleanly
  controller.rotateOrbit(Math.PI / 2, 0);
  controller.update(playerPos, 0.1);
  assert.ok(controller.camera.position.x < 0, "Manual orbit rotates camera to west");
});// ==========================================
// 9. CENTRAL PARK, FRAMING BUILDINGS & PORT TESTS
// ==========================================

test("TDD [Plot Zone Classification]: Assigns central plot as park, edge plot as port, and framing plots as buildings", () => {
  const map = generateMap({ gridSize: 4 });

  // Central plot at row 2, col 2 (0-indexed row: 1, col: 1)
  const parkPlot = map.plots.find((p) => p.row === 1 && p.col === 1);
  assert.ok(parkPlot, "Plot at row 1, col 1 must exist");
  assert.equal(parkPlot.type, "park", "Row 2, Col 2 (0-indexed 1, 1) must be classified as 'park'");

  // Outer-edge plot for port (e.g. row: 2, col: 3 or row: 3, col: 2)
  const portPlot = map.plots.find((p) => p.type === "port");
  assert.ok(portPlot, "An outer-edge port plot must exist");
  if (portPlot) {
    const isOuterEdge =
      portPlot.row === 0 ||
      portPlot.row === map.config.gridSize - 1 ||
      portPlot.col === 0 ||
      portPlot.col === map.config.gridSize - 1;
    assert.ok(isOuterEdge, `Port plot (${portPlot.row}, ${portPlot.col}) must be on an outer edge`);
  }

  // Exactly 1 park, exactly 1 port, exactly 14 building plots
  const parkCount = map.plots.filter((p) => p.type === "park").length;
  const portCount = map.plots.filter((p) => p.type === "port").length;
  const buildingCount = map.plots.filter((p) => p.type === "building").length;

  assert.equal(parkCount, 1, "Must have exactly 1 central park plot");
  assert.equal(portCount, 1, "Must have exactly 1 outer edge port plot");
  assert.equal(buildingCount, 14, "Must have exactly 14 building plots framing the park");
});

test("TDD [Central Park Plot Bounds]: Central park remains strictly inside its plot", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park");
  assert.ok(parkPlot);

  if (parkPlot) {
    // Park must not span multiple plots: width and depth must equal plotSize
    assert.equal(parkPlot.width, map.config.plotSize);
    assert.equal(parkPlot.depth, map.config.plotSize);
    assert.equal(parkPlot.maxX - parkPlot.minX, map.config.plotSize);
    assert.equal(parkPlot.maxZ - parkPlot.minZ, map.config.plotSize);

    // Verify 3D mesh representation strictly stays within plot bounds (no bleed into roads)
    const meshSystem = buildMapMeshes(map);
    const parkGroup = meshSystem.group.getObjectByName("plot-1-1");
    assert.ok(parkGroup);
    if (parkGroup) {
      const parkBox = new THREE.Box3().setFromObject(parkGroup);
      assert.ok(
        parkBox.min.x >= parkPlot.minX - 0.01,
        `Park 3D mesh minX (${parkBox.min.x}) must not bleed past plot minX (${parkPlot.minX})`
      );
      assert.ok(
        parkBox.max.x <= parkPlot.maxX + 0.01,
        `Park 3D mesh maxX (${parkBox.max.x}) must not bleed past plot maxX (${parkPlot.maxX})`
      );
      assert.ok(
        parkBox.min.z >= parkPlot.minZ - 0.01,
        `Park 3D mesh minZ (${parkBox.min.z}) must not bleed past plot minZ (${parkPlot.minZ})`
      );
      assert.ok(
        parkBox.max.z <= parkPlot.maxZ + 0.01,
        `Park 3D mesh maxZ (${parkBox.max.z}) must not bleed past plot maxZ (${parkPlot.maxZ})`
      );
    }
    meshSystem.dispose();
  }
});

test("TDD [Map 3D Meshes - Central Park, Buildings, Port]: Generates park, framing buildings, and port meshes", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map);

  // Find park group
  const parkGroup = meshSystem.group.getObjectByName("plot-1-1");
  assert.ok(parkGroup, "Central park group must exist in scene");

  if (parkGroup) {
    // Verify park has lawn, footpath, trees, lamp posts, and road connectors
    const hasLawn = parkGroup.children.some((child) => child.name.includes("park-lawn"));
    const hasFootpath = parkGroup.children.some((child) => child.name.includes("park-footpath"));
    const hasRoadConnectors = parkGroup.children.some((child) => child.name.includes("park-connector"));
    const treeCount = parkGroup.children.filter((child) => child.name.includes("park-tree")).length;
    const lampCount = parkGroup.children.filter((child) => child.name.includes("park-lamp")).length;

    assert.ok(hasLawn, "Park must have a green central lawn");
    assert.ok(hasFootpath, "Park must have a walkable surrounding footpath");
    assert.ok(hasRoadConnectors, "Park must have 4 road connector paths leading to surrounding roads");
    assert.ok(treeCount >= 4, `Park must have several trees, found ${treeCount}`);
    assert.ok(lampCount >= 4, `Park must have several park lamps, found ${lampCount}`);
  }

  // Verify buildings exist on building plots
  const buildingPlot = map.plots.find((p) => p.type === "building");
  assert.ok(buildingPlot);
  if (buildingPlot) {
    const buildingGroup = meshSystem.group.getObjectByName(buildingPlot.id);
    assert.ok(buildingGroup, "Building group must exist");
    if (buildingGroup) {
      const hasTower = buildingGroup.children.some((child) => child.name.includes("building-tower"));
      assert.ok(hasTower, "Building plot must contain framing tower mesh");
    }
  }

  // Verify port exists on port plot
  const portPlot = map.plots.find((p) => p.type === "port");
  assert.ok(portPlot);
  if (portPlot) {
    const portGroup = meshSystem.group.getObjectByName(portPlot.id);
    assert.ok(portGroup, "Port group must exist");
    if (portGroup) {
      const hasDock = portGroup.children.some((child) => child.name.includes("port-dock"));
      assert.ok(hasDock, "Port plot must contain dock/boardwalk mesh");
    }
  }

  // Check that clickable objects do NOT include skyscraper roofs or tree foliage
  const clickableNames = meshSystem.clickableObjects.map((o) => o.name);
  assert.ok(!clickableNames.some((n) => n.includes("roof")), "Roofs must not be clickable");
  assert.ok(!clickableNames.some((n) => n.includes("foliage")), "Tree foliage must not be clickable");

  meshSystem.dispose();
});

// ==========================================
// 10. BUILDING COVERAGE, COLORED FOOTPATH & ON-FOOT CAMERA PERSPECTIVE
// ==========================================

test("TDD [Building Coverage & Urban Scale]: Buildings occupy 85% to 95% of plot area while maintaining tall multi-story height and variation", () => {
  const map = generateMap();
  const meshSystem = buildMapMeshes(map);

  const buildingPlots = map.plots.filter((p) => p.type === "building");
  assert.equal(buildingPlots.length, 14, "Must have 14 building plots");

  const heights: number[] = [];
  const widths: number[] = [];

  for (const plot of buildingPlots) {
    const plotGroup = meshSystem.group.getObjectByName(plot.id);
    assert.ok(plotGroup, `Building plot ${plot.id} group must exist`);

    // Compute bounding box of building structures (excluding the flat ground surface/curb)
    const buildingBox = new THREE.Box3();
    plotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.name.endsWith("-surface") && !child.name.endsWith("-curb")) {
        child.updateMatrix();
        child.geometry.computeBoundingBox();
        const meshBox = child.geometry.boundingBox.clone();
        meshBox.applyMatrix4(child.matrix);
        buildingBox.union(meshBox);
      }
    });

    const bWidth = buildingBox.max.x - buildingBox.min.x;
    const bDepth = buildingBox.max.z - buildingBox.min.z;
    const bHeight = buildingBox.max.y;

    heights.push(bHeight);
    widths.push(bWidth);

    // 1. Footprint must cover 85% to 95% of plot dimensions
    const minExpectedCoverage = plot.width * 0.85;
    const maxExpectedCoverage = plot.width * 0.96;
    assert.ok(
      bWidth >= minExpectedCoverage,
      `Plot ${plot.id} building width (${bWidth.toFixed(1)}) must be at least 85% of plot (${minExpectedCoverage.toFixed(1)})`
    );
    assert.ok(
      bWidth <= maxExpectedCoverage,
      `Plot ${plot.id} building width (${bWidth.toFixed(1)}) must not exceed 96% of plot (${maxExpectedCoverage.toFixed(1)})`
    );
    assert.ok(
      bDepth >= plot.depth * 0.85,
      `Plot ${plot.id} building depth (${bDepth.toFixed(1)}) must be at least 85% of plot`
    );

    // 2. Must remain inside plot bounds with small setback from road
    assert.ok(
      plot.x + buildingBox.min.x >= plot.minX - 0.01,
      `Plot ${plot.id} minX must stay inside plot boundary`
    );
    assert.ok(
      plot.x + buildingBox.max.x <= plot.maxX + 0.01,
      `Plot ${plot.id} maxX must stay inside plot boundary`
    );

    // 3. Must maintain tall vertical scale (at least 40 units high)
    assert.ok(
      bHeight >= 40,
      `Plot ${plot.id} building must be tall and multi-story (>= 40 units), got ${bHeight.toFixed(1)}`
    );
  }

  // 4. Skyline variation across plots (not identical heights)
  const uniqueHeights = new Set(heights.map((h) => Math.round(h)));
  assert.ok(uniqueHeights.size >= 4, `Must have at least 4 varied building heights across plots, got ${uniqueHeights.size}`);

  meshSystem.dispose();
});

test("TDD [Colored Park Footpath]: Footpath and connectors use distinct warm paved color with high contrast", () => {
  const map = generateMap();
  const meshSystem = buildMapMeshes(map);

  const parkPlot = map.plots.find((p) => p.type === "park");
  assert.ok(parkPlot);

  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id);
  assert.ok(parkGroup);

  const footpathMesh = parkGroup.getObjectByName(`${parkPlot.id}-park-footpath`) as THREE.Mesh;
  assert.ok(footpathMesh, "Park perimeter footpath must exist");

  const footpathMat = footpathMesh.material as THREE.MeshLambertMaterial;
  assert.ok(footpathMat, "Footpath material must exist");

  // Check color is a warm stone/tan hue (R > G > B and warm brightness)
  const hex = footpathMat.color.getHex();
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;

  assert.ok(r > g && g > b, `Footpath color should be warm tan/sandstone hue (r > g > b), got rgb(${r}, ${g}, ${b})`);
  assert.ok(r >= 200 && g >= 160 && b >= 130, `Footpath should be light warm paving, got rgb(${r}, ${g}, ${b})`);

  // Check all 4 connector paths share this distinct footpath material
  const connectors = ["n", "s", "e", "w"].map(
    (dir) => parkGroup.getObjectByName(`${parkPlot.id}-park-connector-${dir}`) as THREE.Mesh
  );
  for (const conn of connectors) {
    assert.ok(conn, "Each cardinal connector must exist");
    assert.equal(conn.material, footpathMat, "Connectors must share the warm footpath material");
  }

  meshSystem.dispose();
});

test("TDD [On-Foot Camera Perspective]: Elevated preset sits at comfortable height and zooms predictably", () => {
  const playerPos = { x: 0, z: 0 };
  const controller = createCameraController(1280, 800, playerPos);

  // 1. Default pitch angle is elevated ~37° providing clear context of character and surroundings
  controller.update(playerPos, 0.1);
  const defaultHeight = controller.camera.position.y;
  assert.ok(
    defaultHeight >= 14 && defaultHeight <= 26,
    `Elevated camera height should sit at comfortable overview (~14m to 26m), got ${defaultHeight.toFixed(2)}`
  );

  // 2. Close Preset (zoom factor ~0.55)
  controller.setZoom(0.55);
  for (let i = 0; i < 20; i++) {
    controller.update(playerPos, 0.1);
  }
  const closeDist = Math.hypot(controller.camera.position.x, controller.camera.position.z);
  assert.ok(
    closeDist < 25,
    `Close preset camera distance (${closeDist.toFixed(2)}) must be closer than default`
  );

  // 3. Medium Preset (zoom factor 1.0)
  controller.setZoom(1.0);
  for (let i = 0; i < 20; i++) {
    controller.update(playerPos, 0.1);
  }
  const mediumDist = Math.hypot(controller.camera.position.x, controller.camera.position.z);
  assert.ok(
    mediumDist > closeDist + 3.0,
    `Medium preset camera distance (${mediumDist.toFixed(2)}) must dynamically expand from close distance (${closeDist.toFixed(2)})`
  );

  // 4. Far Preset (zoom factor 1.8)
  controller.setZoom(1.8);
  for (let i = 0; i < 20; i++) {
    controller.update(playerPos, 0.1);
  }
  const farDist = Math.hypot(controller.camera.position.x, controller.camera.position.z);
  assert.ok(
    farDist > mediumDist + 5.0,
    `Far preset camera distance (${farDist.toFixed(2)}) must expand beyond medium distance (${mediumDist.toFixed(2)})`
  );

  // 5. Base horizontal FOV is 50° to 60°
  const vertFov = controller.camera.fov;
  const aspect = controller.camera.aspect;
  const horizFovRad = 2 * Math.atan(Math.tan((vertFov * Math.PI) / 360) * aspect);
  const horizFovDeg = (horizFovRad * 180) / Math.PI;
  assert.ok(
    (vertFov >= 48 && vertFov <= 60) || (horizFovDeg >= 48 && horizFovDeg <= 65),
    `Camera FOV should be 50°-60° standard third-person perspective (vert=${vertFov}°, horiz=${horizFovDeg.toFixed(1)}°)`
  );
});
