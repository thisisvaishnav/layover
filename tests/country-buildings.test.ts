import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { generateMap } from "../src/map/map-generator";
import { buildMapMeshes } from "../src/map/map-mesh-builder";
import {
  COUNTRY_BUILDING_PALETTES,
  getCountryBuildingPalette,
  getCountryMinimapBuildingColors,
} from "../src/map/country-building-architectures";
import { ONBOARDING_COUNTRIES } from "../src/scenarios/catalog";

// ==========================================
// 1. COUNTRY PALETTE & CONFIGURATION TESTS
// ==========================================

test("TDD [Country Building Palettes]: Defines distinct authentic architectural palettes for all onboarding countries", () => {
  const supportedCodes = ONBOARDING_COUNTRIES.map((c) => c.code);
  assert.ok(supportedCodes.length >= 5, "Must support at least 5 countries");

  for (const code of supportedCodes) {
    const palette = getCountryBuildingPalette(code);
    assert.ok(palette, `Palette for country '${code}' must exist`);
    assert.ok(palette.facadePrimary, `Palette '${code}' must have primary facade color`);
    assert.ok(palette.roofMain, `Palette '${code}' must have roof color`);
    assert.ok(palette.ironwork, `Palette '${code}' must have ironwork/trim color`);
    assert.ok(palette.stoneTrim, `Palette '${code}' must have stone trim color`);
    assert.ok(palette.minimapRoof, `Palette '${code}' must have minimap roof color`);
  }

  // Ensure each country has unique primary facade and roof colors reflecting its architecture
  const spanish = getCountryBuildingPalette("es");
  const indian = getCountryBuildingPalette("hi");
  const japanese = getCountryBuildingPalette("ja");
  const french = getCountryBuildingPalette("fr");
  const italian = getCountryBuildingPalette("it");

  // Spain: Mediterranean warm albero sand & terracotta
  assert.equal(spanish.country, "Spain");
  assert.equal(spanish.roofMain, 0xbf4d28); // Terracotta red

  // India: Imperial red sandstone & golden Jaisalmer
  assert.equal(indian.country, "India");
  assert.equal(indian.facadePrimary, 0x9e382b); // Red sandstone

  // Japan: Clean white plaster & dark Kawara ceramic tile
  assert.equal(japanese.country, "Japan");
  assert.equal(japanese.roofMain, 0x2d343b); // Dark charcoal Kawara

  // France: Parisian Pierre de Taille limestone & zinc mansard
  assert.equal(french.country, "France");
  assert.equal(french.roofMain, 0x475569); // Zinc blue-grey

  // Italy: Tuscan warm ochre & Italian terracotta Coppo
  assert.equal(italian.country, "Italy");
  assert.equal(italian.facadePrimary, 0xd97724); // Tuscan ochre
});

// ==========================================
// 2. SPAIN: MEDITERRANEAN ARCHITECTURE TESTS
// ==========================================

test("TDD [Spain Building Architecture]: Builds Spanish Mediterranean style with terracotta roofs, warm stucco & Juliet balconies", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "es" });

  const buildingPlots = mapData.plots.filter((p) => p.type === "building");
  let foundTerracottaRoofs = 0;
  let foundBalconies = 0;

  for (const plot of buildingPlots) {
    const plotGroup = mapMeshes.group.getObjectByName(plot.id);
    assert.ok(plotGroup);

    plotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.es.roofMain) {
          foundTerracottaRoofs++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.es.ironwork) {
          foundBalconies++;
        }
      }
    });
  }

  assert.ok(foundTerracottaRoofs >= 10, `Expected terracotta roofs on Spanish buildings, found ${foundTerracottaRoofs}`);
  assert.ok(foundBalconies >= 10, `Expected wrought-iron Juliet balconies on Spanish buildings, found ${foundBalconies}`);

  mapMeshes.dispose();
});

// ==========================================
// 3. INDIA: INDO-SARACENIC & RAJPUT TESTS
// ==========================================

test("TDD [India Building Architecture]: Builds Indian architecture with red sandstone, onion domes, Chhatris & Jharokhas", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "hi" });

  const buildingPlots = mapData.plots.filter((p) => p.type === "building");
  let foundRedSandstone = 0;
  let foundDomesAndChhatris = 0;
  let foundChhajjaEaves = 0;

  for (const plot of buildingPlots) {
    const plotGroup = mapMeshes.group.getObjectByName(plot.id);
    assert.ok(plotGroup);

    plotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.hi.facadePrimary) {
          foundRedSandstone++;
        }
        if (
          child.geometry instanceof THREE.SphereGeometry ||
          child.geometry instanceof THREE.ConeGeometry
        ) {
          foundDomesAndChhatris++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.hi.roofTrim) {
          foundChhajjaEaves++;
        }
      }
    });
  }

  assert.ok(foundRedSandstone >= 10, `Expected red sandstone facade meshes on Indian buildings, found ${foundRedSandstone}`);
  assert.ok(foundDomesAndChhatris >= 10, `Expected bulbous onion domes and Chhatri kiosks, found ${foundDomesAndChhatris}`);
  assert.ok(foundChhajjaEaves >= 10, `Expected projecting Chhajja stone eaves, found ${foundChhajjaEaves}`);

  mapMeshes.dispose();
});

// ==========================================
// 4. JAPAN: PAGODA & TRADITIONAL TIMBER TESTS
// ==========================================

test("TDD [Japan Building Architecture]: Builds Japanese architecture with dark Kawara tile roofs, pagoda eaves & Koushi lattice", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "ja" });

  const buildingPlots = mapData.plots.filter((p) => p.type === "building");
  let foundKawaraRoofs = 0;
  let foundLatticePanels = 0;
  let foundWhitePlaster = 0;

  for (const plot of buildingPlots) {
    const plotGroup = mapMeshes.group.getObjectByName(plot.id);
    assert.ok(plotGroup);

    plotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.ja.roofMain) {
          foundKawaraRoofs++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.ja.ironwork) {
          foundLatticePanels++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.ja.facadePrimary) {
          foundWhitePlaster++;
        }
      }
    });
  }

  assert.ok(foundKawaraRoofs >= 10, `Expected dark Kawara ceramic tile roofs, found ${foundKawaraRoofs}`);
  assert.ok(foundLatticePanels >= 10, `Expected Koushi timber lattice grille panels, found ${foundLatticePanels}`);
  assert.ok(foundWhitePlaster >= 10, `Expected crisp white Shikkui plaster facades, found ${foundWhitePlaster}`);

  mapMeshes.dispose();
});

// ==========================================
// 5. FRANCE: HAUSSMANNIAN GRAND BOULEVARD TESTS
// ==========================================

test("TDD [France Building Architecture]: Builds Haussmannian architecture with zinc mansard roofs, lucarnes & continuous iron balconies", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "fr" });

  const buildingPlots = mapData.plots.filter((p) => p.type === "building");
  let foundZincMansards = 0;
  let foundLimestoneFacades = 0;
  let foundIronBalconies = 0;

  for (const plot of buildingPlots) {
    const plotGroup = mapMeshes.group.getObjectByName(plot.id);
    assert.ok(plotGroup);

    plotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.fr.roofMain) {
          foundZincMansards++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.fr.facadePrimary) {
          foundLimestoneFacades++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.fr.ironwork) {
          foundIronBalconies++;
        }
      }
    });
  }

  assert.ok(foundZincMansards >= 10, `Expected Paris zinc blue-grey mansard roofs, found ${foundZincMansards}`);
  assert.ok(foundLimestoneFacades >= 10, `Expected Pierre de Taille cream limestone facades, found ${foundLimestoneFacades}`);
  assert.ok(foundIronBalconies >= 10, `Expected continuous wrought-iron balconies, found ${foundIronBalconies}`);

  mapMeshes.dispose();
});

// ==========================================
// 6. ITALY: RENAISSANCE PALAZZO & TUSCAN TESTS
// ==========================================

test("TDD [Italy Building Architecture]: Builds Italian Renaissance architecture with Tuscan ochre, terracotta Coppo roofs & belvederes", () => {
  const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
  const mapMeshes = buildMapMeshes(mapData, { countryCode: "it" });

  const buildingPlots = mapData.plots.filter((p) => p.type === "building");
  let foundTuscanOchre = 0;
  let foundTerracottaCoppo = 0;
  let foundOliveShutters = 0;

  for (const plot of buildingPlots) {
    const plotGroup = mapMeshes.group.getObjectByName(plot.id);
    assert.ok(plotGroup);

    plotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.it.facadePrimary) {
          foundTuscanOchre++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.it.roofMain) {
          foundTerracottaCoppo++;
        }
        if (child.material.color.getHex() === COUNTRY_BUILDING_PALETTES.it.ironwork) {
          foundOliveShutters++;
        }
      }
    });
  }

  assert.ok(foundTuscanOchre >= 10, `Expected warm Tuscan ochre facades, found ${foundTuscanOchre}`);
  assert.ok(foundTerracottaCoppo >= 10, `Expected Italian terracotta Coppo roofs, found ${foundTerracottaCoppo}`);
  assert.ok(foundOliveShutters >= 10, `Expected Italian Cypress olive green shutters, found ${foundOliveShutters}`);

  mapMeshes.dispose();
});

// ==========================================
// 7. URBAN COVERAGE & BOUNDING RIGOR FOR ALL COUNTRIES
// ==========================================

test("TDD [All Countries Urban Scale & Bounding Safety]: All 14 building plots meet 85-96% coverage, height >= 40, and stay inside plot bounds", () => {
  const countries = ["es", "hi", "ja", "fr", "it"];

  for (const cCode of countries) {
    const mapData = generateMap({ gridSize: 4, plotSize: 72, roadWidth: 20 });
    const mapMeshes = buildMapMeshes(mapData, { countryCode: cCode });

    const buildingPlots = mapData.plots.filter((p) => p.type === "building");
    assert.equal(buildingPlots.length, 14, `Must have 14 building plots for country ${cCode}`);

    const heights: number[] = [];

    for (const plot of buildingPlots) {
      const plotGroup = mapMeshes.group.getObjectByName(plot.id);
      assert.ok(plotGroup, `Building plot ${plot.id} group must exist for country ${cCode}`);

      // Verify required naming
      const hasTower = plotGroup.children.some((child) => child.name.includes("building-tower"));
      assert.ok(hasTower, `Plot ${plot.id} for ${cCode} must have building-tower mesh`);

      const hasRoof = plotGroup.children.some((child) => child.name.includes("building-roof"));
      assert.ok(hasRoof, `Plot ${plot.id} for ${cCode} must have building-roof mesh`);

      // Compute bounding box
      const buildingBox = new THREE.Box3();
      plotGroup.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          !child.name.endsWith("-surface") &&
          !child.name.endsWith("-curb") &&
          !child.name.includes("-tactile-")
        ) {
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

      // Width 85% to 96%
      const minCoverage = plot.width * 0.85;
      const maxCoverage = plot.width * 0.96;
      assert.ok(
        bWidth >= minCoverage,
        `[${cCode}] Plot ${plot.id} width (${bWidth.toFixed(1)}) must be >= 85% (${minCoverage.toFixed(1)})`
      );
      assert.ok(
        bWidth <= maxCoverage,
        `[${cCode}] Plot ${plot.id} width (${bWidth.toFixed(1)}) must be <= 96% (${maxCoverage.toFixed(1)})`
      );

      // Depth >= 85%
      assert.ok(
        bDepth >= plot.depth * 0.85,
        `[${cCode}] Plot ${plot.id} depth (${bDepth.toFixed(1)}) must be >= 85%`
      );

      // Height >= 40
      assert.ok(
        bHeight >= 40,
        `[${cCode}] Plot ${plot.id} height (${bHeight.toFixed(1)}) must be >= 40`
      );

      // Bounds safety
      assert.ok(
        plot.x + buildingBox.min.x >= plot.minX - 0.01,
        `[${cCode}] Plot ${plot.id} minX must stay within plot boundary`
      );
      assert.ok(
        plot.x + buildingBox.max.x <= plot.maxX + 0.01,
        `[${cCode}] Plot ${plot.id} maxX must stay within plot boundary`
      );
    }

    // Varied skyline heights
    const uniqueHeights = new Set(heights.map((h) => Math.round(h)));
    assert.ok(
      uniqueHeights.size >= 4,
      `[${cCode}] Skyline must have at least 4 unique heights, got ${uniqueHeights.size}`
    );

    mapMeshes.dispose();
  }
});

// ==========================================
// 8. MINIMAP HUD INTEGRATION TESTS
// ==========================================

test("TDD [Minimap HUD Country Colors]: Provides distinct roof colors for each country on the minimap", () => {
  const esColors = getCountryMinimapBuildingColors("es");
  const hiColors = getCountryMinimapBuildingColors("hi");
  const jaColors = getCountryMinimapBuildingColors("ja");
  const frColors = getCountryMinimapBuildingColors("fr");
  const itColors = getCountryMinimapBuildingColors("it");

  assert.equal(esColors.roof, "#bf4d28", "Spain minimap roof must be terracotta red-orange");
  assert.equal(hiColors.roof, "#9e382b", "India minimap roof must be sandstone red");
  assert.equal(jaColors.roof, "#2d343b", "Japan minimap roof must be dark Kawara slate");
  assert.equal(frColors.roof, "#475569", "France minimap roof must be Paris zinc blue-grey");
  assert.equal(itColors.roof, "#d97724", "Italy minimap roof must be Tuscan ochre");
});
