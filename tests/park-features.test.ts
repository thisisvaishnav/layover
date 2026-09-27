import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import { buildMapMeshes } from "../src/map/map-mesh-builder";

test("TDD [Park Diverse Trees]: Park contains multiple types of trees and varied sizes", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkPlot = map.plots.find((p) => p.type === "park");
  assert.ok(parkPlot, "Park plot must exist");

  const parkGroup = meshSystem.group.getObjectByName(parkPlot!.id);
  assert.ok(parkGroup, "Park group must exist");

  // Collect all trees in the park
  const treeGroups: THREE.Group[] = [];
  parkGroup!.traverse((child) => {
    if (child instanceof THREE.Group && child.name.includes("-park-tree-")) {
      treeGroups.push(child);
    }
  });

  // Verify there are at least 16 trees in the park
  assert.ok(treeGroups.length >= 16, `Park should have lush tree coverage (>= 16 trees), found ${treeGroups.length}`);

  // Check for multiple distinct tree types: oak, pine/conifer, blossom, cypress
  const treeTypes = new Set<string>();
  const treeHeights = new Set<number>();

  treeGroups.forEach((tree) => {
    const typeAttr = tree.userData?.treeType;
    if (typeAttr) treeTypes.add(typeAttr);

    // Measure height of tree
    const bbox = new THREE.Box3().setFromObject(tree);
    const height = Math.round((bbox.max.y - bbox.min.y) * 10) / 10;
    treeHeights.add(height);
  });

  assert.ok(
    treeTypes.size >= 3,
    `Park must contain at least 3 distinct tree species (found ${treeTypes.size}: ${Array.from(treeTypes).join(", ")})`
  );
  assert.ok(
    treeHeights.size >= 3,
    `Park must have trees in multiple varied heights/sizes (found ${treeHeights.size} distinct heights)`
  );

  meshSystem.dispose();
});

test("TDD [Park Amenities]: Park includes picnic tables and walkway benches", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkPlot = map.plots.find((p) => p.type === "park");
  assert.ok(parkPlot);

  const parkGroup = meshSystem.group.getObjectByName(parkPlot!.id);
  assert.ok(parkGroup);

  // Check for picnic tables
  const tables: THREE.Group[] = [];
  const benches: THREE.Group[] = [];

  parkGroup!.traverse((child) => {
    if (child instanceof THREE.Group) {
      if (child.name.includes("-park-table-")) tables.push(child);
      if (child.name.includes("-park-bench-")) benches.push(child);
    }
  });

  assert.ok(tables.length >= 2, `Park must contain picnic tables, found ${tables.length}`);
  assert.ok(benches.length >= 2, `Park must contain resting benches, found ${benches.length}`);

  // Verify picnic table has tabletop and benches
  const firstTable = tables[0];
  assert.ok(firstTable.children.length >= 3, "Table should have tabletop and bench seats");

  meshSystem.dispose();
});

test("TDD [Park Memorial - Country Specific]: Builds country-specific memorials for all onboarding countries", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park");
  assert.ok(parkPlot);

  const testCases: { code: string; expectedSubstring: string }[] = [
    { code: "es", expectedSubstring: "memorial-es" },
    { code: "hi", expectedSubstring: "memorial-hi" },
    { code: "ja", expectedSubstring: "memorial-ja" },
    { code: "fr", expectedSubstring: "memorial-fr" },
    { code: "it", expectedSubstring: "memorial-it" },
  ];

  for (const { code, expectedSubstring } of testCases) {
    const meshSystem = buildMapMeshes(map, { countryCode: code });
    const parkGroup = meshSystem.group.getObjectByName(parkPlot!.id);
    assert.ok(parkGroup);

    const memorial = parkGroup!.children.find((c) => c.name.includes(expectedSubstring));
    assert.ok(
      memorial,
      `Park must contain ${code.toUpperCase()} country memorial with name matching '${expectedSubstring}'`
    );

    // Verify memorial is centered in the park (near 0, 0 in park local space)
    assert.ok(
      Math.abs(memorial!.position.x) < 2.0 && Math.abs(memorial!.position.z) < 2.0,
      `Memorial must be centered in the middle of the park, got pos=(${memorial!.position.x}, ${memorial!.position.z})`
    );

    // Verify memorial has substantial landmark vertical presence (height >= 4 units)
    const memorialBox = new THREE.Box3().setFromObject(memorial!);
    const memorialHeight = memorialBox.max.y - memorialBox.min.y;
    assert.ok(
      memorialHeight >= 4.0,
      `Memorial should be a prominent monument (>= 4m height), got ${memorialHeight.toFixed(2)}m`
    );

    meshSystem.dispose();
  }
});

test("TDD [Park Memorial Seated On Plinth]: Monuments rest flush on the plinth with no floating gap", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park");
  assert.ok(parkPlot);

  // "de" is not special-cased, so it exercises the generic fallback obelisk
  const codes = ["es", "hi", "ja", "fr", "it", "de"];

  for (const code of codes) {
    const meshSystem = buildMapMeshes(map, { countryCode: code });
    meshSystem.group.updateMatrixWorld(true);

    const parkGroup = meshSystem.group.getObjectByName(parkPlot!.id);
    assert.ok(parkGroup);

    const memorial = parkGroup!.children.find((c) => c.name.includes(`-park-memorial-${code}`));
    assert.ok(memorial, `Park must contain a memorial for ${code}`);

    const monument = memorial!.children.find(
      (c) => c.name === `${parkPlot!.id}-park-memorial-${code}`
    );
    assert.ok(monument, `Monument must exist for ${code}`);

    // Top surface of the stepped plinth (the wide cylinder base tiers)
    let plinthTopY = -Infinity;
    for (const child of memorial!.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const geo = child.geometry as THREE.CylinderGeometry;
      if (geo.type !== "CylinderGeometry" || geo.parameters.radiusTop <= 5) continue;
      plinthTopY = Math.max(plinthTopY, new THREE.Box3().setFromObject(child).max.y);
    }
    assert.ok(Number.isFinite(plinthTopY), `Plinth must exist for ${code}`);

    const gap = new THREE.Box3().setFromObject(monument!).min.y - plinthTopY;
    assert.ok(
      gap >= -0.05 && gap <= 0.05,
      `${code} memorial must sit flush on its plinth, got a gap of ${gap.toFixed(3)} units`
    );

    meshSystem.dispose();
  }
});

test("TDD [Park Bounds Safety]: All trees, tables, benches, and memorials stay within plot boundaries", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park")!;

  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;

  const parkBox = new THREE.Box3().setFromObject(parkGroup);
  assert.ok(
    parkBox.min.x >= parkPlot.minX - 0.01,
    `Park elements minX (${parkBox.min.x}) must not bleed past plot minX (${parkPlot.minX})`
  );
  assert.ok(
    parkBox.max.x <= parkPlot.maxX + 0.01,
    `Park elements maxX (${parkBox.max.x}) must not bleed past plot maxX (${parkPlot.maxX})`
  );
  assert.ok(
    parkBox.min.z >= parkPlot.minZ - 0.01,
    `Park elements minZ (${parkBox.min.z}) must not bleed past plot minZ (${parkPlot.minZ})`
  );
  assert.ok(
    parkBox.max.z <= parkPlot.maxZ + 0.01,
    `Park elements maxZ (${parkBox.max.z}) must not bleed past plot maxZ (${parkPlot.maxZ})`
  );

  meshSystem.dispose();
});

test("TDD [Park Footpath Shifted to Edge & Expanded Lawn]: Footpath outer edge extends to curb and lawn is expanded to 58x58", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park")!;
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;

  const footpathMesh = parkGroup.getObjectByName(`${parkPlot.id}-park-footpath`) as THREE.Mesh;
  assert.ok(footpathMesh, "Park footpath must exist");
  const fpBox = new THREE.Box3().setFromObject(footpathMesh);
  const fpWidth = fpBox.max.x - fpBox.min.x;
  // Footpath should reach out to near the curb edge (~70.8 units)
  assert.ok(fpWidth >= 70.0, `Footpath outer size should reach near curb edge (>=70), got ${fpWidth.toFixed(1)}`);

  const lawnMesh = parkGroup.getObjectByName(`${parkPlot.id}-park-lawn`) as THREE.Mesh;
  assert.ok(lawnMesh, "Park lawn must exist");
  const lawnBox = new THREE.Box3().setFromObject(lawnMesh);
  const lawnWidth = lawnBox.max.x - lawnBox.min.x;
  // Green lawn area is expanded to 58x58 (substantially bigger than previous 42x42)
  assert.ok(lawnWidth >= 56.0, `Park green lawn should be expanded (>= 56), got ${lawnWidth.toFixed(1)}`);

  meshSystem.dispose();
});

test("TDD [Trees Double Size]: Park trees are double in size (heights between 9m and 20m)", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park")!;
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;

  const treeGroups: THREE.Group[] = [];
  parkGroup.traverse((child) => {
    if (child instanceof THREE.Group && child.name.includes("-park-tree-")) {
      treeGroups.push(child);
    }
  });

  assert.ok(treeGroups.length >= 16);
  // All trees are double in size (heights between 9m and 20m)
  treeGroups.forEach((tree) => {
    const bbox = new THREE.Box3().setFromObject(tree);
    const height = bbox.max.y - bbox.min.y;
    assert.ok(
      height <= 20.0 && height >= 9.0,
      `Tree ${tree.name} must be double in size (expected between 9m and 20m), got ${height.toFixed(2)}m`
    );
  });

  meshSystem.dispose();
});

test("TDD [Park Amenities Person Scale]: Picnic tables and resting benches match the player avatar scale (2.405x)", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park")!;
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;

  const tables: THREE.Group[] = [];
  const benches: THREE.Group[] = [];

  parkGroup.traverse((child) => {
    if (child instanceof THREE.Group) {
      if (child.name.includes("-park-table-")) tables.push(child);
      if (child.name.includes("-park-bench-")) benches.push(child);
    }
  });

  assert.ok(tables.length >= 2, "Must contain picnic tables");
  assert.ok(benches.length >= 2, "Must contain resting benches");

  // Furniture must be sized to the person (player avatar scale = 2.405)
  for (const t of tables) {
    assert.equal(t.scale.x, 2.405, "Picnic table must match person scale (2.405x)");
    assert.equal(t.scale.y, 2.405, "Picnic table must match person scale (2.405x)");
    assert.equal(t.scale.z, 2.405, "Picnic table must match person scale (2.405x)");
  }

  for (const b of benches) {
    assert.equal(b.scale.x, 2.405, "Park bench must match person scale (2.405x)");
    assert.equal(b.scale.y, 2.405, "Park bench must match person scale (2.405x)");
    assert.equal(b.scale.z, 2.405, "Park bench must match person scale (2.405x)");
  }

  meshSystem.dispose();
});

test("TDD [Monument 4X Scale]: Country monument in the middle is scaled 4x in size", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park")!;
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;

  const memorial = parkGroup.children.find((c) => c.name.includes("memorial-es"));
  assert.ok(memorial, "Memorial group must exist");

  // Monument child inside memorial must be scaled 4x
  const monument = memorial.children.find((c) => c.name === `${parkPlot.id}-park-memorial-es`);
  assert.ok(monument, "Spain monument group must exist");
  assert.equal(monument.scale.x, 4.0, "Monument scale X must be 4.0 (4x in size)");
  assert.equal(monument.scale.y, 4.0, "Monument scale Y must be 4.0 (4x in size)");
  assert.equal(monument.scale.z, 4.0, "Monument scale Z must be 4.0 (4x in size)");

  // Overall memorial structure should have monumental presence (height >= 18m)
  const bbox = new THREE.Box3().setFromObject(memorial);
  const height = bbox.max.y - bbox.min.y;
  assert.ok(height >= 18.0, `4x monument should have height >= 18m, got ${height.toFixed(2)}m`);

  meshSystem.dispose();
});

test("TDD [Street Furniture 3X Tall]: Street lamps and traffic lights in the street are 3x tall (~11.25m height)", () => {
  const map = generateMap({ gridSize: 4 });
  const meshSystem = buildMapMeshes(map, { countryCode: "es" });

  // 1. Street traffic lights
  const trafficLights = meshSystem.group.children.filter((c) => c.name.startsWith("street-traffic-light-"));
  assert.ok(trafficLights.length >= 4, `Must have traffic lights at street intersections, found ${trafficLights.length}`);

  const firstTL = trafficLights[0];
  const tlBox = new THREE.Box3().setFromObject(firstTL);
  const tlHeight = tlBox.max.y - tlBox.min.y;
  assert.ok(
    tlHeight >= 11.0,
    `Traffic light mast must be 3x tall (>= 11.0m height), got ${tlHeight.toFixed(2)}m`
  );

  // 2. Street lamps
  const streetLamps = meshSystem.group.children.filter((c) => c.name.startsWith("street-lamp-"));
  assert.ok(streetLamps.length >= 8, `Must have street lamps along street corridors, found ${streetLamps.length}`);

  const firstSL = streetLamps[0];
  const slBox = new THREE.Box3().setFromObject(firstSL);
  const slHeight = slBox.max.y - slBox.min.y;
  assert.ok(
    slHeight >= 11.0,
    `Street lamp must be 3x tall (>= 11.0m height), got ${slHeight.toFixed(2)}m`
  );

  // 3. Park lamps are also 3x tall (height >= 8.5m)
  const parkPlot = map.plots.find((p) => p.type === "park")!;
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;
  const parkLamps = parkGroup.children.filter((c) => c.name.includes("park-lamp-"));
  assert.ok(parkLamps.length >= 4, "Park lamps must exist");
  const plBox = new THREE.Box3().setFromObject(parkLamps[0]);
  const plHeight = plBox.max.y - plBox.min.y;
  assert.ok(
    plHeight >= 11.0,
    `Park lamps must be 3x tall (>= 11.0m height), got ${plHeight.toFixed(2)}m`
  );

  meshSystem.dispose();
});

test("TDD [Park 2X Size]: Park plot is 144x144 (2x), trees are double in size, and benches/tables match the person scale", () => {
  const map = generateMap({ gridSize: 4 });
  const parkPlot = map.plots.find((p) => p.type === "park")!;
  assert.ok(parkPlot, "Park plot must exist");

  // 1. Central Park dimensions are 2x standard 72m (144m x 144m)
  assert.equal(parkPlot.width, 144, "Park width must be 144m (2x 72m)");
  assert.equal(parkPlot.depth, 144, "Park depth must be 144m (2x 72m)");

  const meshSystem = buildMapMeshes(map, { countryCode: "es" });
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id)!;
  assert.ok(parkGroup, "Park group must exist in scene");

  // 2. Outer footpath loop extends to near the 144m curb (~142.8m)
  const footpathMesh = parkGroup.getObjectByName(`${parkPlot.id}-park-footpath`) as THREE.Mesh;
  assert.ok(footpathMesh, "Park footpath must exist");
  const fpBox = new THREE.Box3().setFromObject(footpathMesh);
  const fpWidth = fpBox.max.x - fpBox.min.x;
  assert.ok(fpWidth >= 140.0, `Footpath outer size must reach near 144m curb (>= 140), got ${fpWidth.toFixed(1)}`);

  // 3. Lawn is expanded 2x from 58m to 116m
  const lawnMesh = parkGroup.getObjectByName(`${parkPlot.id}-park-lawn`) as THREE.Mesh;
  assert.ok(lawnMesh, "Park lawn must exist");
  const lawnBox = new THREE.Box3().setFromObject(lawnMesh);
  const lawnWidth = lawnBox.max.x - lawnBox.min.x;
  assert.ok(lawnWidth >= 114.0, `Park green lawn must be expanded to 2x (>= 114), got ${lawnWidth.toFixed(1)}`);

  // 4. Trees are double in size; tables/benches match the person scale; memorial unchanged:
  // (a) Trees: heights are double in size (9m to 20m)
  const trees: THREE.Group[] = [];
  parkGroup.traverse((child) => {
    if (child instanceof THREE.Group && child.name.includes("-park-tree-")) {
      trees.push(child);
    }
  });
  assert.ok(trees.length >= 16, "Must have trees distributed across park");
  for (const tree of trees) {
    const box = new THREE.Box3().setFromObject(tree);
    const height = box.max.y - box.min.y;
    assert.ok(
      height >= 9.0 && height <= 20.0,
      `Tree height must be double in size (9m-20m), got ${height.toFixed(2)}m`
    );
  }

  // (b) Picnic tables: scale matches the person (2.405)
  const tables: THREE.Object3D[] = [];
  const benches: THREE.Object3D[] = [];
  parkGroup.traverse((child) => {
    if (child.name.includes("-park-table-")) tables.push(child);
    if (child.name.includes("-park-bench-")) benches.push(child);
  });
  assert.ok(tables.length >= 4, "Must have picnic tables");
  for (const table of tables) {
    assert.equal(table.scale.x, 2.405, "Table scale.x must match person scale (2.405)");
    assert.equal(table.scale.y, 2.405, "Table scale.y must match person scale (2.405)");
    assert.equal(table.scale.z, 2.405, "Table scale.z must match person scale (2.405)");
  }

  // (c) Benches: scale matches the person (2.405)
  assert.ok(benches.length >= 4, "Must have walkway benches");
  for (const bench of benches) {
    assert.equal(bench.scale.x, 2.405, "Bench scale.x must match person scale (2.405)");
    assert.equal(bench.scale.y, 2.405, "Bench scale.y must match person scale (2.405)");
    assert.equal(bench.scale.z, 2.405, "Bench scale.z must match person scale (2.405)");
  }

  // (d) Memorial: monument scale remains (4, 4, 4)
  const memorial = parkGroup.children.find((c) => c.name.includes("memorial-es"))!;
  assert.ok(memorial, "Memorial group must exist");
  const monument = memorial.children.find((c) => c.name === `${parkPlot.id}-park-memorial-es`)!;
  assert.ok(monument, "Monument must exist");
  assert.equal(monument.scale.x, 4.0, "Monument scale.x must remain 4.0");
  assert.equal(monument.scale.y, 4.0, "Monument scale.y must remain 4.0");
  assert.equal(monument.scale.z, 4.0, "Monument scale.z must remain 4.0");

  // (e) Park lamps: height is 25% taller (~11.25m pole)
  const parkLamps = parkGroup.children.filter((c) => c.name.includes("park-lamp-"));
  assert.ok(parkLamps.length >= 4, "Park lamps must exist");
  const lampBox = new THREE.Box3().setFromObject(parkLamps[0]);
  const lampHeight = lampBox.max.y - lampBox.min.y;
  assert.ok(
    lampHeight >= 11.0 && lampHeight <= 12.5,
    `Park lamp height must be 25% taller (~11.25m), got ${lampHeight.toFixed(2)}m`
  );

  meshSystem.dispose();
});

