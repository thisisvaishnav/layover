import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import {
  createBarberShop,
  isWithinBarberShopRange,
  createBarberPoleTexture,
  createBarberSignTexture,
  getBarberSalonHeading,
  getBarberSalonSubHeading,
} from "../src/interaction/barber-shop";
import {
  BARBER_SHOP_WORLD_POSITION,
} from "../src/scenarios/barber-shop-scenario";
import { getMultilingualScenario } from "../src/scenarios/multilingual";
import {
  worldToMinimap,
  clampToMinimapCircle,
} from "../src/map/minimap-math";

// ==========================================
// 1. POSITIONING & ORIENTATION TESTS
// ==========================================

test("TDD [Barber Shop Positioning]: Barber shop is located on plot-1-2 (right of park) in bottom-left corner facing road", () => {
  const mapData = generateMap({ gridSize: 4 });
  const parkPlot = mapData.plots.find((p) => p.type === "park")!;
  assert.ok(parkPlot, "Park plot must exist");

  // Plot to the right of the park is col 2, row 1 (plot-1-2)
  const rightPlot = mapData.plots.find((p) => p.id === "plot-1-2")!;
  assert.ok(rightPlot, "Right plot to park (plot-1-2) must exist");

  // 1. Verify rightPlot is immediately to the right (East) of Central Park
  assert.equal(rightPlot.col, parkPlot.col + 1, "plot-1-2 must be column 2 (immediately right of park column 1)");
  assert.equal(rightPlot.row, parkPlot.row, "plot-1-2 must be row 1 (same horizontal row as park)");

  // 2. Verify Barber Shop position is strictly inside plot-1-2 boundaries
  assert.ok(
    BARBER_SHOP_WORLD_POSITION.x >= rightPlot.minX && BARBER_SHOP_WORLD_POSITION.x <= rightPlot.maxX,
    `Barber shop x=${BARBER_SHOP_WORLD_POSITION.x} must be inside plot-1-2 x: [${rightPlot.minX}, ${rightPlot.maxX}]`
  );
  assert.ok(
    BARBER_SHOP_WORLD_POSITION.z >= rightPlot.minZ && BARBER_SHOP_WORLD_POSITION.z <= rightPlot.maxZ,
    `Barber shop z=${BARBER_SHOP_WORLD_POSITION.z} must be inside plot-1-2 z: [${rightPlot.minZ}, ${rightPlot.maxZ}]`
  );

  // 3. Verify Barber Shop is in the bottom-left (South-West) quadrant of plot-1-2
  const midX = (rightPlot.minX + rightPlot.maxX) / 2;
  const midZ = (rightPlot.minZ + rightPlot.maxZ) / 2;

  assert.ok(
    BARBER_SHOP_WORLD_POSITION.x <= midX,
    `Barber shop x=${BARBER_SHOP_WORLD_POSITION.x} must be in the left half of plot-1-2 (<= ${midX})`
  );
  assert.ok(
    BARBER_SHOP_WORLD_POSITION.z <= midZ,
    `Barber shop z=${BARBER_SHOP_WORLD_POSITION.z} must be in the bottom (negative Z) half of plot-1-2 (<= ${midZ})`
  );

  // 4. Verify Barber Shop 3D building does not bleed into the road
  const barberShop = createBarberShop(
    BARBER_SHOP_WORLD_POSITION.x,
    BARBER_SHOP_WORLD_POSITION.z,
    { rotation: -Math.PI / 2 }
  );

  const shopBox = new THREE.Box3().setFromObject(barberShop.group);
  assert.ok(
    shopBox.min.x >= rightPlot.minX - 0.05,
    `Barber shop minX (${shopBox.min.x.toFixed(2)}) must not bleed into road at minX (${rightPlot.minX})`
  );
  assert.ok(
    shopBox.max.x <= rightPlot.maxX + 0.05,
    `Barber shop maxX (${shopBox.max.x.toFixed(2)}) must stay within plot maxX (${rightPlot.maxX})`
  );

  barberShop.dispose();
});

test("TDD [Barber Shop Facing Road]: Barber shop is oriented to face West towards the road", () => {
  const barberShop = createBarberShop(
    BARBER_SHOP_WORLD_POSITION.x,
    BARBER_SHOP_WORLD_POSITION.z,
    { rotation: -Math.PI / 2 }
  );

  // Group rotation should be -PI/2 (facing West, -X)
  assert.equal(
    barberShop.group.rotation.y,
    -Math.PI / 2,
    "Barber shop rotation.y must be -PI/2 to face West towards the road"
  );

  // Porch and entrance must be on the road side (lower X than the shop center)
  const porch = barberShop.group.getObjectByName("BarberShopPorch");
  assert.ok(porch, "Porch must exist");

  const porchWorldBox = new THREE.Box3().setFromObject(porch);
  const porchCenterX = (porchWorldBox.min.x + porchWorldBox.max.x) / 2;

  assert.ok(
    porchCenterX < BARBER_SHOP_WORLD_POSITION.x,
    `Porch center (${porchCenterX.toFixed(2)}) must be closer to the road than shop origin (${BARBER_SHOP_WORLD_POSITION.x})`
  );

  barberShop.dispose();
});

// ==========================================
// 2. ARCHITECTURAL & INTERIOR FEATURES TESTS
// ==========================================

test("TDD [Barber Shop Architecture]: Contains boutique salon building, checkerboard porch, sign, and rotating barber pole", () => {
  const barberShop = createBarberShop(
    BARBER_SHOP_WORLD_POSITION.x,
    BARBER_SHOP_WORLD_POSITION.z,
    { rotation: -Math.PI / 2 }
  );

  // 1. Building structure
  const building = barberShop.group.getObjectByName("BarberShopBuilding");
  assert.ok(building, "BarberShopBuilding must exist");

  const glass = barberShop.group.getObjectByName("BarberShopGlass");
  assert.ok(glass, "BarberShopGlass display window must exist");

  // 2. Checkerboard porch
  const porch = barberShop.group.getObjectByName("BarberShopPorch");
  assert.ok(porch, "BarberShopPorch must exist");
  assert.ok(porch.children.length >= 10, "Porch must have multiple tiles");

  // 3. Illuminated Barber Shop sign
  const sign = barberShop.group.getObjectByName("BarberShopSign");
  assert.ok(sign, "BarberShopSign must exist");

  // 4. Iconic Barber Pole with spinning cylinder
  const pole = barberShop.group.getObjectByName("BarberPole");
  assert.ok(pole, "BarberPole must exist");

  const poleCylinder = barberShop.group.getObjectByName("BarberPoleCylinder");
  assert.ok(poleCylinder, "BarberPoleCylinder must exist");

  barberShop.dispose();
});

test("TDD [Barber Shop Interior]: Includes vanity counter, 2 mirrors, and 2 vintage leather barber chairs", () => {
  const barberShop = createBarberShop(
    BARBER_SHOP_WORLD_POSITION.x,
    BARBER_SHOP_WORLD_POSITION.z,
    { rotation: -Math.PI / 2 }
  );

  const interior = barberShop.group.getObjectByName("BarberShopInterior");
  assert.ok(interior, "BarberShopInterior must exist");

  // Mirrors
  const mirror1 = barberShop.group.getObjectByName("BarberMirror-1");
  const mirror2 = barberShop.group.getObjectByName("BarberMirror-2");
  assert.ok(mirror1, "BarberMirror-1 must exist");
  assert.ok(mirror2, "BarberMirror-2 must exist");

  // Barber Chairs
  const chair1 = barberShop.group.getObjectByName("BarberChair-1");
  const chair2 = barberShop.group.getObjectByName("BarberChair-2");
  assert.ok(chair1, "BarberChair-1 must exist");
  assert.ok(chair2, "BarberChair-2 must exist");

  // Verify chair has pedestal and seat components
  assert.ok(chair1.children.length >= 4, "Barber chair must have base, pedestal, seat, and backrest");

  barberShop.dispose();
});

test("TDD [Barber Pole Texture]: Generates helical stripe DataTexture in headless Node.js", () => {
  const tex = createBarberPoleTexture(32);
  assert.ok(tex instanceof THREE.DataTexture, "Must produce THREE.DataTexture");
  assert.equal(tex.image.width, 32);
  assert.equal(tex.image.height, 32);
  assert.equal(tex.wrapS, THREE.RepeatWrapping);
  assert.equal(tex.wrapT, THREE.RepeatWrapping);
  tex.dispose();
});

// ==========================================
// 3. NPC & INTERACTION TESTS
// ==========================================

test("TDD [Barber NPC & Beacon]: Master barber NPC Marco has scissors, comb, and glowing aura", () => {
  const barberShop = createBarberShop(
    BARBER_SHOP_WORLD_POSITION.x,
    BARBER_SHOP_WORLD_POSITION.z,
    { rotation: -Math.PI / 2 }
  );

  const npc = barberShop.group.getObjectByName("BarberNPC");
  assert.ok(npc, "BarberNPC must exist");

  const beacon = barberShop.group.getObjectByName("BarberHighlight");
  assert.ok(beacon, "BarberHighlight beacon aura must exist");

  // Barber NPC world position must match rotated position
  assert.ok(
    Math.abs(barberShop.barberWorldPosition.x - barberShop.npcWorldPosition.x) < 0.001,
    "barberWorldPosition and npcWorldPosition must be identical"
  );
  assert.ok(
    barberShop.npcWorldPosition.x !== BARBER_SHOP_WORLD_POSITION.x,
    "NPC position should be offset from building origin"
  );

  barberShop.dispose();
});

test("TDD [Barber Proximity Range]: isWithinBarberShopRange computes player distance accurately", () => {
  const barberX = 58;
  const barberZ = -68;

  assert.equal(isWithinBarberShopRange(58, -68, barberX, barberZ, 12), true, "At barber shop");
  assert.equal(isWithinBarberShopRange(64, -68, barberX, barberZ, 12), true, "Within 6 units");
  assert.equal(isWithinBarberShopRange(70, -68, barberX, barberZ, 12), true, "Exactly on 12-unit boundary");
  assert.equal(isWithinBarberShopRange(71, -68, barberX, barberZ, 12), false, "Outside 12-unit radius");
});

test("TDD [Barber Shop Scenario]: getMultilingualScenario produces complete barber dialogue configuration", () => {
  const scenario = getMultilingualScenario("es", "en", "barber");
  assert.equal(scenario.npcName, "Marco");
  assert.equal(scenario.npcRole, "Master Barber");
  assert.equal(scenario.location, "Vintage Barber Salon");
  assert.equal(scenario.city, "Barcelona");
  assert.ok(scenario.greeting.includes("barbería") || scenario.greeting.includes("pelo"));
  assert.ok(scenario.objectives.length >= 2, "Must contain haircut objectives");
});

test("TDD [Barber Shop Minimap]: BARBER_SHOP_WORLD_POSITION maps inside circular minimap", () => {
  const mapData = generateMap({ gridSize: 4 });
  const rawPos = worldToMinimap(BARBER_SHOP_WORLD_POSITION, mapData.bounds, 96, 12, 1.0);
  const clampedPos = clampToMinimapCircle(rawPos, { x: 96, y: 96 }, 96, 8);

  const dx = clampedPos.x - 96;
  const dy = clampedPos.y - 96;
  const dist = Math.hypot(dx, dy);

  assert.ok(dist <= 96, `Barber shop marker distance ${dist.toFixed(1)} must be <= minimap radius 96`);
});

test("TDD [Barber Shop Animation & Clean Disposal]: update rotates pole and dispose cleans resources", () => {
  const barberShop = createBarberShop(
    BARBER_SHOP_WORLD_POSITION.x,
    BARBER_SHOP_WORLD_POSITION.z,
    { rotation: -Math.PI / 2 }
  );

  const pole = barberShop.group.getObjectByName("BarberPoleCylinder") as THREE.Mesh;
  assert.ok(pole, "Pole must exist");
  const initRot = pole.rotation.y;

  barberShop.update(0.1, false);
  assert.ok(pole.rotation.y > initRot, "Pole rotation must increase after update");

  barberShop.dispose();
});

// ==========================================
// 4. EXPANDED DIMENSIONS & SALOON HEADING TESTS
// ==========================================

test("TDD [Barber Shop Expanded Dimensions]: Barber shop is significantly bigger and wider", () => {
  const barberShop = createBarberShop(0, 0, { rotation: 0 });
  const building = barberShop.group.getObjectByName("BarberShopBuilding");
  assert.ok(building, "BarberShopBuilding must exist");

  const bBox = new THREE.Box3().setFromObject(building);
  const width = bBox.max.x - bBox.min.x;
  const height = bBox.max.y - bBox.min.y;
  const depth = bBox.max.z - bBox.min.z;

  // Verify substantial expansion (was 9.4m wide x 5.8m deep x 4.6m high, then 15.6 x 7.8 x 5.6)
  assert.ok(width >= 21.0, `Barber shop must be wide (>= 21m), got width=${width.toFixed(2)}m`);
  assert.ok(depth >= 10.5, `Barber shop must be deep (>= 10.5m), got depth=${depth.toFixed(2)}m`);
  assert.ok(height >= 6.8, `Barber shop must be tall (>= 6.8m), got height=${height.toFixed(2)}m`);

  // Floor area should be over 220 m² (was 110 m²)
  const floorArea = width * depth;
  assert.ok(floorArea >= 220, `Floor area must be > 220 m², got ${floorArea.toFixed(1)} m²`);

  barberShop.dispose();
});

test("TDD [Barber Saloon Country Headings]: Heading correctly features Saloon and country-specific variants", () => {
  // India (hi / in) must specifically feature "SALOON"
  assert.equal(getBarberSalonHeading("hi"), "ROYAL HAIR SALOON");
  assert.equal(getBarberSalonHeading("in"), "ROYAL HAIR SALOON");
  assert.ok(getBarberSalonHeading("hi").includes("SALOON"), "India heading must contain SALOON");

  // Spain (es)
  assert.equal(getBarberSalonHeading("es"), "SALÓN DE BARBERÍA");

  // France (fr)
  assert.equal(getBarberSalonHeading("fr"), "SALON DE BARBIER");

  // Italy (it)
  assert.equal(getBarberSalonHeading("it"), "SALONE BARBIERE");

  // Japan (ja)
  assert.equal(getBarberSalonHeading("ja"), "BARBER SALON");

  // Default / English
  assert.equal(getBarberSalonHeading("en"), "VINTAGE BARBER SALOON");
  assert.equal(getBarberSalonHeading(), "VINTAGE BARBER SALOON");
  assert.ok(getBarberSalonHeading("en").includes("SALOON"), "Default heading must contain SALOON");

  // Sub-headings
  assert.ok(getBarberSalonSubHeading("hi").length > 0);
  assert.ok(getBarberSalonSubHeading("es").length > 0);
  assert.ok(getBarberSalonSubHeading("fr").length > 0);
  assert.ok(getBarberSalonSubHeading("it").length > 0);
  assert.ok(getBarberSalonSubHeading("ja").length > 0);
});

test("TDD [Barber Saloon Marquee Texture]: createBarberSignTexture generates valid texture with border in headless Node", () => {
  const tex = createBarberSignTexture("hi", 256, 64);
  assert.ok(tex instanceof THREE.Texture, "Must produce a THREE.Texture");
  if (tex instanceof THREE.DataTexture) {
    assert.equal(tex.image.width, 256);
    assert.equal(tex.image.height, 64);
    // Check gold border exists in texture data
    const data = tex.image.data;
    assert.ok(data);
    assert.equal(data[0], 250, "Top-left border pixel must be gold R=250");
    assert.equal(data[1], 204, "Top-left border pixel must be gold G=204");
  }
  tex.dispose();
});

test("TDD [Barber Saloon Sign Mesh]: Barber shop sign contains plaque with localized heading metadata and texture", () => {
  const indiaShop = createBarberShop(0, 0, { countryCode: "hi" });
  const sign = indiaShop.group.getObjectByName("BarberShopSign");
  assert.ok(sign, "BarberShopSign must exist");
  assert.equal(sign.userData.heading, "ROYAL HAIR SALOON", "India sign heading must be ROYAL HAIR SALOON");

  const plaque = indiaShop.group.getObjectByName("BarberShopSignPlaque") as THREE.Mesh;
  assert.ok(plaque, "BarberShopSignPlaque must exist");
  assert.equal(plaque.userData.heading, "ROYAL HAIR SALOON");
  indiaShop.dispose();

  const spainShop = createBarberShop(0, 0, { countryCode: "es" });
  const spainSign = spainShop.group.getObjectByName("BarberShopSign");
  assert.equal(spainSign?.userData.heading, "SALÓN DE BARBERÍA");
  spainShop.dispose();
});

test("TDD [Barber Shop 3 Styling Stations]: Wide salon interior contains 3 mirrors and 3 barber chairs", () => {
  const barberShop = createBarberShop(0, 0);
  const interior = barberShop.group.getObjectByName("BarberShopInterior");
  assert.ok(interior, "Interior must exist");

  const mirror1 = barberShop.group.getObjectByName("BarberMirror-1");
  const mirror2 = barberShop.group.getObjectByName("BarberMirror-2");
  const mirror3 = barberShop.group.getObjectByName("BarberMirror-3");
  assert.ok(mirror1, "BarberMirror-1 must exist");
  assert.ok(mirror2, "BarberMirror-2 must exist");
  assert.ok(mirror3, "BarberMirror-3 must exist");

  const chair1 = barberShop.group.getObjectByName("BarberChair-1");
  const chair2 = barberShop.group.getObjectByName("BarberChair-2");
  const chair3 = barberShop.group.getObjectByName("BarberChair-3");
  assert.ok(chair1, "BarberChair-1 must exist");
  assert.ok(chair2, "BarberChair-2 must exist");
  assert.ok(chair3, "BarberChair-3 must exist");

  barberShop.dispose();
});

