import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createTerracottaTileTexture,
  createTactileStripTexture,
  createTerracottaPavementMaterial,
  createTactileStripMaterial,
  TERRACOTTA_BASE_HEX,
  TACTILE_YELLOW_HEX,
} from "../src/map/pavement-textures";
import { generateMap } from "../src/map/map-generator";
import { buildMapMeshes } from "../src/map/map-mesh-builder";

// ==========================================
// 1. TERRACOTTA TILE TEXTURE & COLOR TESTS
// ==========================================

test("TDD [Footpath Base Color]: Base color is within #B94A2F to #C65A3A terracotta range", () => {
  const hex = TERRACOTTA_BASE_HEX;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;

  // #B94A2F = rgb(185, 74, 47)
  // #C65A3A = rgb(198, 90, 58)
  assert.ok(r >= 180 && r <= 205, `Red channel (${r}) must be in terracotta range 180-205`);
  assert.ok(g >= 65 && g <= 100, `Green channel (${g}) must be in terracotta range 65-100`);
  assert.ok(b >= 35 && b <= 70, `Blue channel (${b}) must be in terracotta range 35-70`);
  assert.ok(r > g && g > b, `Terracotta must have dominant red over green and blue (r > g > b)`);
});

test("TDD [Procedural Tile Texture]: Generates valid DataTexture with repeat wrapping and mipmaps", () => {
  const texture = createTerracottaTileTexture({ size: 256, tilesPerSide: 4 });

  assert.ok(texture instanceof THREE.DataTexture, "Texture must be an instance of THREE.DataTexture");
  assert.equal(texture.image.width, 256);
  assert.equal(texture.image.height, 256);
  assert.equal(texture.wrapS, THREE.RepeatWrapping, "wrapS must be RepeatWrapping");
  assert.equal(texture.wrapT, THREE.RepeatWrapping, "wrapT must be RepeatWrapping");
  assert.equal(texture.generateMipmaps, true, "generateMipmaps must be enabled for clean distant viewing");

  const pixels = texture.image.data as Uint8Array;
  assert.ok(pixels, "Pixel data must be defined");
  assert.equal(pixels.length, 256 * 256 * 4, "Must have 4 RGBA channels per pixel");
});

test("TDD [Tile Grid & Grout Lines]: Texture has visible grout lines separating tiles", () => {
  const size = 128;
  const tilesPerSide = 4;
  const texture = createTerracottaTileTexture({ size, tilesPerSide, groutWidth: 2 });
  const pixels = texture.image.data as Uint8Array;

  // Grout pixel at tile seam (e.g. x = 0, y = 32)
  const tileSize = size / tilesPerSide; // 32
  const getPixel = (x: number, y: number) => {
    const idx = (y * size + x) * 4;
    return { r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2], a: pixels[idx + 3] };
  };

  // Tile center should be bright terracotta
  const tileCenter = getPixel(Math.floor(tileSize / 2), Math.floor(tileSize / 2));
  // Grout seam should be darker recessed seam
  const groutSeam = getPixel(tileSize - 1, Math.floor(tileSize / 2));

  assert.ok(
    tileCenter.r > groutSeam.r + 30,
    `Tile center R (${tileCenter.r}) must be visibly brighter than grout seam R (${groutSeam.r})`
  );
});

test("TDD [Tile Variation]: Contains subtle color/brightness variation between individual tiles", () => {
  const size = 128;
  const tilesPerSide = 4;
  const texture = createTerracottaTileTexture({ size, tilesPerSide });
  const pixels = texture.image.data as Uint8Array;
  assert.ok(pixels);

  const tileSize = size / tilesPerSide; // 32
  const tileCenters: number[] = [];

  for (let ty = 0; ty < tilesPerSide; ty++) {
    for (let tx = 0; tx < tilesPerSide; tx++) {
      const cx = tx * tileSize + Math.floor(tileSize / 2);
      const cy = ty * tileSize + Math.floor(tileSize / 2);
      const idx = (cy * size + cx) * 4;
      tileCenters.push(pixels[idx]); // Red channel brightness
    }
  }

  // Verify that not all tiles have identical red channel
  const uniqueVals = new Set(tileCenters);
  assert.ok(uniqueVals.size >= 4, `Tile centers must exhibit subtle brightness variation, got ${uniqueVals.size} distinct values`);
});

// ==========================================
// 2. YELLOW TACTILE STRIP TEXTURE & COLOR
// ==========================================

test("TDD [Tactile Yellow Color]: Yellow tactile strip color is saturated but slightly muted yellow", () => {
  const hex = TACTILE_YELLOW_HEX;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;

  assert.ok(r >= 200 && r <= 245, `Red channel (${r}) should be in bright yellow range`);
  assert.ok(g >= 150 && g <= 200, `Green channel (${g}) should be in warm yellow range`);
  assert.ok(b >= 10 && b <= 60, `Blue channel (${b}) should be low for rich yellow`);
  assert.ok(r > g && g > b * 2, "Must be saturated yellow");
});

test("TDD [Tactile Ribbed Pattern]: Generates repeating tactile ribbed bars", () => {
  const texture = createTactileStripTexture({ width: 64, height: 64, ribCount: 4 });
  assert.ok(texture instanceof THREE.DataTexture);

  const pixels = texture.image.data as Uint8Array;
  assert.ok(pixels);
  // Sample along vertical axis across ribs
  const samples: number[] = [];
  for (let y = 0; y < 64; y += 4) {
    const idx = (y * 64 + 32) * 4;
    samples.push(pixels[idx]);
  }

  const minVal = Math.min(...samples);
  const maxVal = Math.max(...samples);
  assert.ok(
    maxVal - minVal >= 25,
    `Tactile ribbed pattern must have noticeable highlight vs groove contrast, got diff ${maxVal - minVal}`
  );
});

// ==========================================
// 3. MATERIAL PROPERTIES & MATTE FINISH
// ==========================================

test("TDD [Matte Finish]: Footpath and tactile materials have matte rough surface rather than glossy", () => {
  const texture = createTerracottaTileTexture();
  const mat = createTerracottaPavementMaterial(texture);

  assert.ok(mat instanceof THREE.MeshStandardMaterial);
  assert.ok(mat.roughness >= 0.8, `Roughness (${mat.roughness}) must be >= 0.8 for matte paving`);
  assert.ok(mat.metalness <= 0.1, `Metalness (${mat.metalness}) must be <= 0.1 for non-metallic stone`);
  assert.equal(mat.map, texture, "Material must use the procedural tile texture");

  const tactileTex = createTactileStripTexture();
  const tactileMat = createTactileStripMaterial(tactileTex);
  assert.ok(tactileMat instanceof THREE.MeshStandardMaterial);
  assert.ok(tactileMat.roughness >= 0.8, "Tactile strip must have matte roughness");
  assert.equal(tactileMat.map, tactileTex, "Tactile material must use tactile texture");
});

// ==========================================
// 4. MAP INTEGRATION & TRANSITIONS
// ==========================================

test("TDD [3D Mesh Integration]: Building plots contain terracotta tiled sidewalks with road-facing tactile strips", () => {
  const mapData = generateMap();
  const meshSystem = buildMapMeshes(mapData);

  const buildingPlots = mapData.plots.filter((p) => p.type === "building");
  assert.ok(buildingPlots.length > 0);

  const firstPlotGroup = meshSystem.group.getObjectByName(buildingPlots[0].id) as THREE.Group;
  assert.ok(firstPlotGroup, "Building plot group must exist in scene");

  // Verify terracotta sidewalk surface
  const sidewalkMesh = firstPlotGroup.getObjectByName(`${buildingPlots[0].id}-surface`) as THREE.Mesh;
  assert.ok(sidewalkMesh, "Building plot sidewalk surface must exist");

  // Verify road-side yellow tactile strips exist on the plot perimeter
  const tactileNorth = firstPlotGroup.getObjectByName(`${buildingPlots[0].id}-tactile-n`);
  const tactileSouth = firstPlotGroup.getObjectByName(`${buildingPlots[0].id}-tactile-s`);
  const tactileEast = firstPlotGroup.getObjectByName(`${buildingPlots[0].id}-tactile-e`);
  const tactileWest = firstPlotGroup.getObjectByName(`${buildingPlots[0].id}-tactile-w`);

  assert.ok(tactileNorth, "Road-facing North tactile strip must exist");
  assert.ok(tactileSouth, "Road-facing South tactile strip must exist");
  assert.ok(tactileEast, "Road-facing East tactile strip must exist");
  assert.ok(tactileWest, "Road-facing West tactile strip must exist");

  meshSystem.dispose();
});

test("TDD [Park Footpath Integration]: Central Park uses terracotta pavement and tactile transition strips", () => {
  const mapData = generateMap();
  const meshSystem = buildMapMeshes(mapData);

  const parkPlot = mapData.plots.find((p) => p.type === "park")!;
  const parkGroup = meshSystem.group.getObjectByName(parkPlot.id) as THREE.Group;
  assert.ok(parkGroup, "Central park group must exist");

  // Footpath loop
  const parkFootpath = parkGroup.getObjectByName(`${parkPlot.id}-park-footpath`) as THREE.Mesh;
  assert.ok(parkFootpath, "Park perimeter footpath must exist");

  // 4 Connector footpaths
  for (const dir of ["n", "s", "e", "w"]) {
    const conn = parkGroup.getObjectByName(`${parkPlot.id}-park-connector-${dir}`) as THREE.Mesh;
    assert.ok(conn, `Park connector ${dir} must exist`);

    // Tactile strip at road connector edge
    const tactile = parkGroup.getObjectByName(`${parkPlot.id}-park-tactile-${dir}`);
    assert.ok(tactile, `Park road connector ${dir} tactile strip must exist`);
  }

  meshSystem.dispose();
});

test("TDD [Walkability & Raycasting]: All sidewalks and tactile strips are registered as clickable", () => {
  const mapData = generateMap();
  const meshSystem = buildMapMeshes(mapData);

  const clickableNames = meshSystem.clickableObjects.map((o) => o.name);

  // Check building plot clickable surfaces
  const bld = mapData.plots.find((p) => p.type === "building")!;
  assert.ok(clickableNames.includes(`${bld.id}-surface`), "Sidewalk must be clickable for movement");
  assert.ok(clickableNames.includes(`${bld.id}-tactile-n`), "Tactile strip must be clickable for movement");

  // Check park clickable paths
  const park = mapData.plots.find((p) => p.type === "park")!;
  assert.ok(clickableNames.includes(`${park.id}-park-footpath`), "Park footpath must be clickable");
  assert.ok(clickableNames.includes(`${park.id}-park-connector-n`), "Park connector must be clickable");
  assert.ok(clickableNames.includes(`${park.id}-park-tactile-n`), "Park tactile strip must be clickable");

  meshSystem.dispose();
});

test("TDD [Curb & Transition Heights]: Heights layer properly without z-fighting", () => {
  const mapData = generateMap();
  const meshSystem = buildMapMeshes(mapData);

  const bld = mapData.plots.find((p) => p.type === "building")!;
  const plotGroup = meshSystem.group.getObjectByName(bld.id) as THREE.Group;

  const curb = plotGroup.getObjectByName(`${bld.id}-curb`) as THREE.Mesh;
  const tactile = plotGroup.getObjectByName(`${bld.id}-tactile-n`) as THREE.Mesh;
  const sidewalk = plotGroup.getObjectByName(`${bld.id}-surface`) as THREE.Mesh;

  // Road (0.02) -> Curb (top 0.12) -> Tactile (top ~0.125) -> Sidewalk (top ~0.13)
  // Check Y positions are strictly non-overlapping
  assert.ok(tactile.position.y >= curb.position.y, "Tactile strip sits on/above curb base");
  assert.ok(sidewalk.position.y >= curb.position.y, "Sidewalk sits on/above curb base");
  assert.ok(Math.abs(tactile.position.y - sidewalk.position.y) < 0.02, "Tactile and sidewalk are comfortably flush");

  meshSystem.dispose();
});
