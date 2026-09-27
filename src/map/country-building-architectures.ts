import * as THREE from "three";
import type { PlotData } from "./map-generator";

export interface CountryBuildingColors {
  name: string;
  country: string;
  facadePrimary: number;
  facadeSecondary: number;
  facadeBase: number;
  roofMain: number;
  roofTrim: number;
  ironwork: number;
  stoneTrim: number;
  accent: number;
  glass: number;
  parapet: number;
  minimapRoof: string;
  minimapBase: string;
}

export const COUNTRY_BUILDING_PALETTES: Record<string, CountryBuildingColors> = {
  // SPAIN: Madrid & Barcelona - Mediterranean terracotta barrel roofs, warm stucco, wrought-iron balconies & arches
  es: {
    name: "Spanish Mediterranean & Classical Modernist",
    country: "Spain",
    facadePrimary: 0xecd5b3,   // Warm albero sand stucco
    facadeSecondary: 0xdfbf98, // Terracotta cream / ochre
    facadeBase: 0xd6c2a5,      // Warm Montjuïc carved limestone
    roofMain: 0xbf4d28,        // Rich Spanish terracotta clay tile
    roofTrim: 0xa83e1b,        // Dark terracotta tile edge
    ironwork: 0x23201d,        // Wrought iron black/bronze
    stoneTrim: 0xf5ebd9,       // Warm white stone cornices & pediments
    accent: 0xeab308,          // Spanish golden brass / ceramic tile accent
    glass: 0x38bdf8,           // Sunlit Mediterranean sky blue
    parapet: 0xccb293,         // Warm carved limestone parapet
    minimapRoof: "#bf4d28",
    minimapBase: "#2c2018",
  },

  // INDIA: Delhi, Mumbai & Jaipur - Imperial red & golden sandstone, Chhatris, fluted onion domes, Jharokhas & Chhajjas
  hi: {
    name: "Indo-Saracenic & Heritage Rajput",
    country: "India",
    facadePrimary: 0x9e382b,   // Imperial Agra / Dholpur red sandstone
    facadeSecondary: 0xd99846, // Golden Jaisalmer sandstone
    facadeBase: 0xce7164,      // Jaipur rose terracotta pink
    roofMain: 0x8b2e22,        // Deep red sandstone dome & roof
    roofTrim: 0xa63a2c,        // Terracotta sandstone cornice
    ironwork: 0x78350f,        // Carved dark teakwood lattice
    stoneTrim: 0xf8f5ee,       // Makrana white marble trims & pilasters
    accent: 0xf59e0b,          // Gilded brass / golden kalasha
    glass: 0x38bdf8,           // Vibrant crystal clear sky blue
    parapet: 0x832b20,         // Sandstone crenellated parapet
    minimapRoof: "#9e382b",
    minimapBase: "#2b1816",
  },

  // JAPAN: Tokyo & Kyoto - Traditional dark Kawara ceramic tile roofs, upturned sori eaves, Hinoki timber & Koushi lattice
  ja: {
    name: "Japanese Pagoda & Traditional Machiya",
    country: "Japan",
    facadePrimary: 0xf3efe6,   // Clean white Shikkui plaster
    facadeSecondary: 0x8b572a, // Warm Hinoki cypress & cedar timber
    facadeBase: 0x26292d,      // Dark Yakisugi charred cedar base
    roofMain: 0x2d343b,        // Traditional dark charcoal Kawara ceramic tile
    roofTrim: 0x1f242a,        // Dark slate roof ridge
    ironwork: 0x42220e,        // Dark timber lattice / Koushi grill
    stoneTrim: 0xede6d8,       // Light natural wood / stone trim
    accent: 0xcc2918,          // Japanese Torii vermilion lacquer
    glass: 0x7dd3fc,           // Luminous soft cyan-blue
    parapet: 0x3b444e,         // Slate tile parapet
    minimapRoof: "#2d343b",
    minimapBase: "#1b1e24",
  },

  // FRANCE: Paris & Lyon - Parisian Pierre de Taille cream limestone, blue-grey zinc mansards, lucarnes & wrought-iron balconies
  fr: {
    name: "Haussmannian Grand Boulevard",
    country: "France",
    facadePrimary: 0xeee8dc,   // Parisian Pierre de Taille limestone
    facadeSecondary: 0xe2d9c8, // Warm honed limestone
    facadeBase: 0xd2c7b0,      // Rusticated grooved ashlar limestone
    roofMain: 0x475569,        // Iconic Paris zinc & slate blue-grey mansard
    roofTrim: 0x334155,        // Dark slate mansard trim
    ironwork: 0x1a1d20,        // Parisian cast wrought-iron black
    stoneTrim: 0xf7f5f0,       // Carved stone pediments & keystones
    accent: 0xd4af37,          // Gilded gold roof cresting / brass accents
    glass: 0x60a5fa,           // Reflective Parisian blue sky
    parapet: 0xc4b79b,         // Classical stone balustrade
    minimapRoof: "#475569",
    minimapBase: "#252830",
  },

  // ITALY: Rome & Florence - Tuscan warm ochre & sienna, Roman arched loggias, terracotta roofs with modillions & green shutters
  it: {
    name: "Italian Renaissance Palazzo & Tuscan Classical",
    country: "Italy",
    facadePrimary: 0xd97724,   // Warm Tuscan ochre / golden Sienna
    facadeSecondary: 0xc8681a, // Burnt Venetian sienna
    facadeBase: 0xf2ede0,      // Italian Travertine marble / cream limestone
    roofMain: 0xb4481b,        // Italian terracotta Coppo barrel tile
    roofTrim: 0x9e3a12,        // Deep terracotta eave
    ironwork: 0x3e5538,        // Italian Cypress olive green shutters & trim
    stoneTrim: 0xe6dfce,       // Honed Travertine stringcourses & cornices
    accent: 0x78350f,          // Antique Italian bronze
    glass: 0x38bdf8,           // Bright Mediterranean azure
    parapet: 0xbaa285,         // Travertine stone balustrade
    minimapRoof: "#d97724",
    minimapBase: "#2d1e14",
  },
};

export function getCountryBuildingPalette(code?: string): CountryBuildingColors {
  if (code && code in COUNTRY_BUILDING_PALETTES) {
    return COUNTRY_BUILDING_PALETTES[code];
  }
  return COUNTRY_BUILDING_PALETTES.es;
}

export function getCountryMinimapBuildingColors(code?: string): { base: string; roof: string; border: string } {
  const p = getCountryBuildingPalette(code);
  return {
    base: p.minimapBase,
    roof: p.minimapRoof,
    border: "#64748b",
  };
}

export interface BuildingBuildContext {
  plot: PlotData;
  parent: THREE.Group;
  countryCode: string;
  palette: CountryBuildingColors;
  seed: number;
  archetype: number;
  regGeo: <T extends THREE.BufferGeometry>(geo: T) => T;
  regMat: <T extends THREE.Material>(mat: T) => T;
  clickableObjects: THREE.Object3D[];
  obstacleObjects: THREE.Object3D[];
  materials: {
    matFacadePrimary: THREE.Material;
    matFacadeSecondary: THREE.Material;
    matFacadeBase: THREE.Material;
    matRoofMain: THREE.Material;
    matRoofTrim: THREE.Material;
    matIronwork: THREE.Material;
    matStoneTrim: THREE.Material;
    matAccent: THREE.Material;
    matGlass: THREE.Material;
    matParapet: THREE.Material;
    sharedSpireGeo: THREE.CylinderGeometry;
  };
}

/**
 * Builds country-specific roof crowns:
 * - Spain: Terracotta tiled hip roof with projecting eave brackets, balustrade, and corner rotunda cupola
 * - India: Grand central fluted onion dome (gumbad) with lotus base & kalasha finial, plus 4 corner Chhatris
 * - Japan: Traditional flared hip-and-gable (irimoya) dark kawara tile roof with upturned sori eaves, onigawara & sorin spire
 * - France: Authentic Paris blue-grey zinc mansard roof with lucarne dormer windows, chimneys & gilded cresting
 * - Italy: Low-pitched Mediterranean terracotta tile roof with modillion brackets, balustrades & columned belvedere
 */
export function buildCountryRoof(
  ctx: BuildingBuildContext,
  width: number,
  depth: number,
  height: number,
  posX = 0,
  posZ = 0
): THREE.Mesh {
  const { plot, parent, countryCode, regGeo, regMat, materials } = ctx;
  const { matRoofMain, matRoofTrim, matStoneTrim, matAccent } = materials;

  const roofBaseY = height + 0.12;

  if (countryCode === "hi") {
    // ----------------------------------------------------
    // INDIA: Grand Onion Dome (Gumbad) & 4 Corner Chhatris
    // ----------------------------------------------------
    // Roof Terrace Slab
    const terraceGeo = regGeo(new THREE.BoxGeometry(width + 0.4, 1.2, depth + 0.4));
    const terraceMesh = new THREE.Mesh(terraceGeo, matRoofTrim);
    terraceMesh.name = `${plot.id}-building-roof`;
    terraceMesh.position.set(posX, roofBaseY + 0.6, posZ);
    terraceMesh.castShadow = true;
    parent.add(terraceMesh);

    // Stepped Kangura Parapet (ornamental battlements)
    const parapetH = 1.0;
    const parapetGeo = regGeo(new THREE.BoxGeometry(width + 0.6, parapetH, depth + 0.6));
    const parapetMesh = new THREE.Mesh(parapetGeo, matStoneTrim);
    parapetMesh.position.set(posX, roofBaseY + 1.2 + parapetH / 2, posZ);
    parent.add(parapetMesh);

    // Central Drum & Fluted Bulbous Onion Dome
    const drumH = 2.4;
    const drumR = Math.min(width, depth) * 0.22;
    const drumGeo = regGeo(new THREE.CylinderGeometry(drumR, drumR, drumH, 16));
    const drumMesh = new THREE.Mesh(drumGeo, matStoneTrim);
    drumMesh.position.set(posX, roofBaseY + 1.2 + drumH / 2, posZ);
    drumMesh.castShadow = true;
    parent.add(drumMesh);

    // Onion Dome (Gumbad)
    const domeR = drumR * 1.08;
    const domeGeo = regGeo(new THREE.SphereGeometry(domeR, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.68));
    const domeMesh = new THREE.Mesh(domeGeo, matRoofMain);
    domeMesh.position.set(posX, roofBaseY + 1.2 + drumH + domeR * 0.45, posZ);
    domeMesh.castShadow = true;
    parent.add(domeMesh);

    // Lotus Cap & Golden Kalasha Spire
    const spireH = 4.2;
    const kalashGeo = regGeo(new THREE.CylinderGeometry(0.12, 0.45, spireH, 8));
    const kalashMesh = new THREE.Mesh(kalashGeo, matAccent);
    kalashMesh.position.set(posX, roofBaseY + 1.2 + drumH + domeR + spireH / 2, posZ);
    parent.add(kalashMesh);

    // 4 Corner Chhatris (Octagonal/Square Domed Kiosks on Slender Pillars)
    const chhatriOffsetW = width * 0.38;
    const chhatriOffsetD = depth * 0.38;
    const pillarH = 2.6;
    const chhatriRoofR = 1.5;

    [
      [-chhatriOffsetW, -chhatriOffsetD],
      [chhatriOffsetW, -chhatriOffsetD],
      [-chhatriOffsetW, chhatriOffsetD],
      [chhatriOffsetW, chhatriOffsetD],
    ].forEach(([cx, cz]) => {
      // 4 Pillars per Chhatri
      const pillarGeo = regGeo(new THREE.CylinderGeometry(0.12, 0.16, pillarH, 6));
      [-0.7, 0.7].forEach((px) => {
        [-0.7, 0.7].forEach((pz) => {
          const pillar = new THREE.Mesh(pillarGeo, matStoneTrim);
          pillar.position.set(posX + cx + px, roofBaseY + 1.2 + pillarH / 2, posZ + cz + pz);
          parent.add(pillar);
        });
      });

      // Miniature Chhatri Dome Cap
      const chhatriCapGeo = regGeo(new THREE.ConeGeometry(chhatriRoofR, 1.4, 8));
      const chhatriCap = new THREE.Mesh(chhatriCapGeo, matRoofMain);
      chhatriCap.position.set(posX + cx, roofBaseY + 1.2 + pillarH + 0.7, posZ + cz);
      chhatriCap.castShadow = true;
      parent.add(chhatriCap);

      // Chhatri Finial
      const finialGeo = regGeo(new THREE.CylinderGeometry(0.04, 0.08, 0.8, 6));
      const finial = new THREE.Mesh(finialGeo, matAccent);
      finial.position.set(posX + cx, roofBaseY + 1.2 + pillarH + 1.8, posZ + cz);
      parent.add(finial);
    });

    return terraceMesh;

  } else if (countryCode === "ja") {
    // ----------------------------------------------------
    // JAPAN: Flared Hip-and-Gable (Irimoya) Kawara Tile Roof & Sorin Spire
    // ----------------------------------------------------
    const crownH = 5.8;
    // Lower Wide Flared Eave (extends 0.6m past building wall)
    const lowerEaveW = width + 0.8;
    const lowerEaveD = depth + 0.8;
    const lowerEaveGeo = regGeo(new THREE.BoxGeometry(lowerEaveW, 0.6, lowerEaveD));
    const lowerEaveMesh = new THREE.Mesh(lowerEaveGeo, matRoofTrim);
    lowerEaveMesh.position.set(posX, roofBaseY + 0.3, posZ);
    lowerEaveMesh.castShadow = true;
    parent.add(lowerEaveMesh);

    // Main Curved Hip Tile Roof (Kawara)
    const roofW = width * 0.82;
    const roofD = depth * 0.82;
    const roofGeo = regGeo(new THREE.BoxGeometry(roofW, crownH * 0.65, roofD));
    const crownMesh = new THREE.Mesh(roofGeo, matRoofMain);
    crownMesh.name = `${plot.id}-building-roof`;
    crownMesh.position.set(posX, roofBaseY + (crownH * 0.65) / 2 + 0.6, posZ);
    crownMesh.castShadow = true;
    parent.add(crownMesh);

    // Upper Hip Tier
    const upperHipGeo = regGeo(new THREE.BoxGeometry(roofW * 0.68, crownH * 0.35, roofD * 0.68));
    const upperHipMesh = new THREE.Mesh(upperHipGeo, matRoofMain);
    upperHipMesh.position.set(posX, roofBaseY + crownH * 0.65 + (crownH * 0.35) / 2 + 0.6, posZ);
    upperHipMesh.castShadow = true;
    parent.add(upperHipMesh);

    // Upper Ridge Cap & Ornamental Ridge End Tiles (Onigawara)
    const ridgeGeo = regGeo(new THREE.BoxGeometry(roofW * 0.52, 0.6, 0.9));
    const ridgeMesh = new THREE.Mesh(ridgeGeo, matRoofTrim);
    ridgeMesh.position.set(posX, roofBaseY + crownH + 0.6, posZ);
    parent.add(ridgeMesh);

    // Tall Sacred Pagoda Spire (Sorin with 4 Rings)
    const sorinBaseGeo = regGeo(new THREE.CylinderGeometry(0.14, 0.28, 5.0, 8));
    const sorinMesh = new THREE.Mesh(sorinBaseGeo, matAccent);
    sorinMesh.position.set(posX, roofBaseY + crownH + 3.1, posZ);
    parent.add(sorinMesh);

    // Ring Tiers on Sorin Spire
    const ringGeo = regGeo(new THREE.TorusGeometry(0.38, 0.06, 6, 12));
    for (let r = 1; r <= 4; r++) {
      const ringMesh = new THREE.Mesh(ringGeo, matAccent);
      ringMesh.position.set(posX, roofBaseY + crownH + 1.2 + r * 0.65, posZ);
      ringMesh.rotation.x = Math.PI / 2;
      parent.add(ringMesh);
    }

    return crownMesh;

  } else if (countryCode === "fr") {
    // ----------------------------------------------------
    // FRANCE: Parisian Blue-Grey Zinc Mansard Roof with Lucarnes & Chimneys
    // ----------------------------------------------------
    const mansardH = 6.2;
    // Lower Mansard Eave Cornice
    const corniceGeo = regGeo(new THREE.BoxGeometry(width + 0.6, 0.8, depth + 0.6));
    const corniceMesh = new THREE.Mesh(corniceGeo, matStoneTrim);
    corniceMesh.position.set(posX, roofBaseY + 0.4, posZ);
    parent.add(corniceMesh);

    // Steep High-Pitched Zinc Mansard Body
    const mansardGeo = regGeo(new THREE.BoxGeometry(width * 0.78, mansardH, depth * 0.78));
    const mansardMesh = new THREE.Mesh(mansardGeo, matRoofMain);
    mansardMesh.name = `${plot.id}-building-roof`;
    mansardMesh.position.set(posX, roofBaseY + mansardH / 2 + 0.8, posZ);
    mansardMesh.castShadow = true;
    parent.add(mansardMesh);

    // Upper Zinc Roof Ridge & Wrought-Iron Cresting
    const ridgeGeo = regGeo(new THREE.BoxGeometry(width * 0.62, 0.45, depth * 0.62));
    const ridgeMesh = new THREE.Mesh(ridgeGeo, matRoofTrim);
    ridgeMesh.position.set(posX, roofBaseY + mansardH + 0.8, posZ);
    parent.add(ridgeMesh);

    // Gilded Iron Cresting Railing along Roof Peak
    const crestingGeo = regGeo(new THREE.BoxGeometry(width * 0.58, 0.6, 0.2));
    const crestingMesh = new THREE.Mesh(crestingGeo, matAccent);
    crestingMesh.position.set(posX, roofBaseY + mansardH + 1.3, posZ);
    parent.add(crestingMesh);

    // Projecting Dormer Windows (Lucarnes) with Stone Pediments
    const lucarneGeo = regGeo(new THREE.BoxGeometry(2.4, 2.8, 1.2));
    const pedimentGeo = regGeo(new THREE.BoxGeometry(2.6, 0.8, 1.3));

    [-width * 0.24, 0, width * 0.24].forEach((lx) => {
      // Front (South) Lucarne
      const lucarneS = new THREE.Mesh(lucarneGeo, matStoneTrim);
      lucarneS.position.set(posX + lx, roofBaseY + 2.4, posZ - depth * 0.38 - 0.4);
      parent.add(lucarneS);

      const pedimentS = new THREE.Mesh(pedimentGeo, matStoneTrim);
      pedimentS.position.set(posX + lx, roofBaseY + 4.2, posZ - depth * 0.38 - 0.4);
      parent.add(pedimentS);

      // Back (North) Lucarne
      const lucarneN = new THREE.Mesh(lucarneGeo, matStoneTrim);
      lucarneN.position.set(posX + lx, roofBaseY + 2.4, posZ + depth * 0.38 + 0.4);
      parent.add(lucarneN);

      const pedimentN = new THREE.Mesh(pedimentGeo, matStoneTrim);
      pedimentN.position.set(posX + lx, roofBaseY + 4.2, posZ + depth * 0.38 + 0.4);
      parent.add(pedimentN);
    });

    // Parisian Terracotta Chimney Stacks
    const chimneyGeo = regGeo(new THREE.BoxGeometry(1.2, 3.2, 2.4));
    const potGeo = regGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 8));
    const matChimney = regMat(new THREE.MeshLambertMaterial({ color: 0xb45309 })); // Terracotta red brick

    [-width * 0.36, width * 0.36].forEach((cx) => {
      const chimney = new THREE.Mesh(chimneyGeo, matChimney);
      chimney.position.set(posX + cx, roofBaseY + mansardH + 1.2, posZ);
      chimney.castShadow = true;
      parent.add(chimney);

      // Chimney pots on top
      [-0.6, 0.6].forEach((pz) => {
        const pot = new THREE.Mesh(potGeo, matChimney);
        pot.position.set(posX + cx, roofBaseY + mansardH + 3.2, posZ + pz);
        parent.add(pot);
      });
    });

    return mansardMesh;

  } else if (countryCode === "it") {
    // ----------------------------------------------------
    // ITALY: Tuscan Terracotta Roof with Modillions & Columned Belvedere Loggia
    // ----------------------------------------------------
    const eaveW = width + 0.8;
    const eaveD = depth + 0.8;

    // Overhanging Eave Supported by Modillion Brackets
    const eaveGeo = regGeo(new THREE.BoxGeometry(eaveW, 0.6, eaveD));
    const eaveMesh = new THREE.Mesh(eaveGeo, matRoofTrim);
    eaveMesh.position.set(posX, roofBaseY + 0.3, posZ);
    parent.add(eaveMesh);

    // Low-Pitched Mediterranean Terracotta Barrel Tile Roof
    const roofH = 4.2;
    const roofW = width * 0.82;
    const roofD = depth * 0.82;
    const crownGeo = regGeo(new THREE.BoxGeometry(roofW, roofH, roofD));
    const crownMesh = new THREE.Mesh(crownGeo, matRoofMain);
    crownMesh.name = `${plot.id}-building-roof`;
    crownMesh.position.set(posX, roofBaseY + roofH / 2 + 0.6, posZ);
    crownMesh.castShadow = true;
    parent.add(crownMesh);

    // Classical Travertine Balustrade with Urns
    const balustradeGeo = regGeo(new THREE.BoxGeometry(roofW + 0.4, 0.9, roofD + 0.4));
    const balustradeMesh = new THREE.Mesh(balustradeGeo, matStoneTrim);
    balustradeMesh.position.set(posX, roofBaseY + roofH + 0.8, posZ);
    parent.add(balustradeMesh);

    // Rooftop Belvedere / Columned Loggia Pavilion
    const belvedereW = roofW * 0.52;
    const belvedereD = roofD * 0.52;
    const colH = 3.6;

    // Belvedere Pillars
    const colGeo = regGeo(new THREE.CylinderGeometry(0.22, 0.28, colH, 8));
    [-belvedereW / 2 + 0.5, belvedereW / 2 - 0.5].forEach((bx) => {
      [-belvedereD / 2 + 0.5, belvedereD / 2 - 0.5].forEach((bz) => {
        const col = new THREE.Mesh(colGeo, matStoneTrim);
        col.position.set(posX + bx, roofBaseY + roofH + 1.2 + colH / 2, posZ + bz);
        parent.add(col);
      });
    });

    // Belvedere Terracotta Roof Slab & Cap
    const belRoofGeo = regGeo(new THREE.BoxGeometry(belvedereW + 0.8, 0.8, belvedereD + 0.8));
    const belRoof = new THREE.Mesh(belRoofGeo, matRoofMain);
    belRoof.position.set(posX, roofBaseY + roofH + 1.2 + colH + 0.4, posZ);
    belRoof.castShadow = true;
    parent.add(belRoof);

    // Belvedere Upper Cap
    const belCapGeo = regGeo(new THREE.BoxGeometry(belvedereW * 0.6, 0.8, belvedereD * 0.6));
    const belCap = new THREE.Mesh(belCapGeo, matRoofTrim);
    belCap.position.set(posX, roofBaseY + roofH + 1.2 + colH + 1.2, posZ);
    parent.add(belCap);

    // Belvedere Bronze Finial
    const finialGeo = regGeo(new THREE.CylinderGeometry(0.08, 0.16, 1.8, 6));
    const finial = new THREE.Mesh(finialGeo, matAccent);
    finial.position.set(posX, roofBaseY + roofH + 1.2 + colH + 2.5, posZ);
    parent.add(finial);

    return crownMesh;

  } else {
    // ----------------------------------------------------
    // SPAIN (DEFAULT): Spanish Clay Tile Hipped Roof & Rotunda Cupola
    // ----------------------------------------------------
    const crownH = 5.2;
    const eaveW = width + 1.6;
    const eaveD = depth + 1.6;

    // Overhanging Terracotta Tile Eave
    const eaveGeo = regGeo(new THREE.BoxGeometry(eaveW, 0.6, eaveD));
    const eaveMesh = new THREE.Mesh(eaveGeo, matRoofTrim);
    eaveMesh.position.set(posX, roofBaseY + 0.3, posZ);
    parent.add(eaveMesh);

    // Hipped Terracotta Barrel Tile Crown
    const crownGeo = regGeo(new THREE.BoxGeometry(width * 0.75, crownH, depth * 0.75));
    const crownMesh = new THREE.Mesh(crownGeo, matRoofMain);
    crownMesh.name = `${plot.id}-building-roof`;
    crownMesh.position.set(posX, roofBaseY + crownH / 2 + 0.6, posZ);
    crownMesh.castShadow = true;
    parent.add(crownMesh);

    // Classical Stone Balustrade with Urns
    const balustradeGeo = regGeo(new THREE.BoxGeometry(width * 0.78, 0.85, depth * 0.78));
    const balustradeMesh = new THREE.Mesh(balustradeGeo, matStoneTrim);
    balustradeMesh.position.set(posX, roofBaseY + crownH + 0.9, posZ);
    parent.add(balustradeMesh);

    // Spanish Corner Cupola / Rounded Lantern Dome
    const cupolaR = 2.6;
    const cupolaGeo = regGeo(new THREE.SphereGeometry(cupolaR, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55));
    const cupolaMesh = new THREE.Mesh(cupolaGeo, matRoofMain);
    cupolaMesh.position.set(posX, roofBaseY + crownH + 1.4 + cupolaR * 0.3, posZ);
    cupolaMesh.castShadow = true;
    parent.add(cupolaMesh);

    // Gilded Finial Spire
    const spireMesh = new THREE.Mesh(materials.sharedSpireGeo, matAccent);
    spireMesh.position.set(posX, roofBaseY + crownH + cupolaR + 3.2, posZ);
    parent.add(spireMesh);

    return crownMesh;
  }
}

/**
 * Decorates the building facade with country-authentic elements:
 * - Spain: Wrought-iron Juliet balconies, stone quoin borders, arched loggia portals
 * - India: Cantilevered Jharokhas, wide overhanging chhajja stone eaves, cusped arch portals
 * - Japan: Koushi timber lattice screens, exposed post-and-beam timbers, intermediate pagoda eaves
 * - France: Continuous 2nd floor iron balcony, French casement windows, ashlar rustication
 * - Italy: Roman arched loggia arcades, alternating window pediments, olive green shutters
 */
export function decorateCountryFacade(
  ctx: BuildingBuildContext,
  width: number,
  depth: number,
  height: number,
  posX = 0,
  posZ = 0
): void {
  const { parent, countryCode, regGeo, materials } = ctx;
  const { matIronwork, matStoneTrim, matGlass, matRoofTrim } = materials;

  const floorCount = Math.floor(height / 4.8);

  if (countryCode === "hi") {
    // ----------------------------------------------------
    // INDIA: Overhanging Chhajjas & Jharokha Bay Balconies
    // ----------------------------------------------------
    // 1. Projecting Stone Chhajjas (Horizontal deep shade eaves between stories)
    const chhajjaGeo = regGeo(new THREE.BoxGeometry(width + 0.9, 0.32, depth + 0.9));
    for (let f = 1; f < floorCount; f++) {
      if (f % 2 === 0) {
        const chhajja = new THREE.Mesh(chhajjaGeo, matRoofTrim);
        chhajja.position.set(posX, f * 4.8 + 0.12, posZ);
        parent.add(chhajja);
      }
    }

    // 2. Cantilevered Jharokhas (Ornate bay balconies on South and North faces)
    const jharokhaW = 3.8;
    const jharokhaH = 2.8;
    const jharokhaD = 1.0;
    const jharokhaGeo = regGeo(new THREE.BoxGeometry(jharokhaW, jharokhaH, jharokhaD));
    const jharokhaBracketGeo = regGeo(new THREE.BoxGeometry(0.6, 0.6, 0.6));

    [-width * 0.22, width * 0.22].forEach((jx) => {
      [2, 4, 6].forEach((f) => {
        if (f * 4.8 < height - 6) {
          const jy = f * 4.8 + 1.4 + 0.12;

          // South Jharokha
          const jMeshS = new THREE.Mesh(jharokhaGeo, matStoneTrim);
          jMeshS.position.set(posX + jx, jy, posZ - depth / 2 - 0.45);
          parent.add(jMeshS);

          const bracketS = new THREE.Mesh(jharokhaBracketGeo, matRoofTrim);
          bracketS.position.set(posX + jx, jy - 1.5, posZ - depth / 2 - 0.45);
          parent.add(bracketS);

          // North Jharokha
          const jMeshN = new THREE.Mesh(jharokhaGeo, matStoneTrim);
          jMeshN.position.set(posX + jx, jy, posZ + depth / 2 + 0.45);
          parent.add(jMeshN);

          const bracketN = new THREE.Mesh(jharokhaBracketGeo, matRoofTrim);
          bracketN.position.set(posX + jx, jy - 1.5, posZ + depth / 2 + 0.45);
          parent.add(bracketN);
        }
      });
    });

  } else if (countryCode === "ja") {
    // ----------------------------------------------------
    // JAPAN: Koushi Timber Lattice & Intermediate Pagoda Eaves
    // ----------------------------------------------------
    // 1. Intermediate Cascading Pagoda Eaves (halfway up the tower)
    const midEaveY = height * 0.52 + 0.12;
    const midEaveGeo = regGeo(new THREE.BoxGeometry(width + 0.6, 0.45, depth + 0.6));
    const midEave = new THREE.Mesh(midEaveGeo, matRoofTrim);
    midEave.position.set(posX, midEaveY, posZ);
    midEave.castShadow = true;
    parent.add(midEave);

    // 2. Koushi Timber Grille Lattice Panels on window tiers
    const latticeGeo = regGeo(new THREE.BoxGeometry(width + 0.15, 0.8, depth + 0.15));
    for (let f = 1; f < floorCount; f++) {
      const lattice = new THREE.Mesh(latticeGeo, matIronwork);
      lattice.position.set(posX, f * 4.8 + 0.12, posZ);
      parent.add(lattice);

      // Vertical Timber Corner Framing Posts
      const postGeo = regGeo(new THREE.BoxGeometry(0.45, 4.8, 0.45));
      [-width / 2 + 0.2, width / 2 - 0.2].forEach((px) => {
        [-depth / 2 + 0.2, depth / 2 - 0.2].forEach((pz) => {
          const post = new THREE.Mesh(postGeo, matIronwork);
          post.position.set(posX + px, (f - 0.5) * 4.8 + 0.12, posZ + pz);
          parent.add(post);
        });
      });
    }

  } else if (countryCode === "fr") {
    // ----------------------------------------------------
    // FRANCE: Continuous Piano Nobile & Top Floor Wrought-Iron Balconies
    // ----------------------------------------------------
    // Piano Nobile (2nd Floor) Continuous Iron Balcony spanning entire facade
    const pianoNobileY = 2 * 4.8 + 0.12;
    const balconyGeo = regGeo(new THREE.BoxGeometry(width + 0.6, 0.55, depth + 0.6));
    const pianoBalcony = new THREE.Mesh(balconyGeo, matIronwork);
    pianoBalcony.position.set(posX, pianoNobileY, posZ);
    parent.add(pianoBalcony);

    // Top-Floor Continuous Iron Balcony
    const topBalconyY = (floorCount - 1) * 4.8 + 0.12;
    const topBalcony = new THREE.Mesh(balconyGeo, matIronwork);
    topBalcony.position.set(posX, topBalconyY, posZ);
    parent.add(topBalcony);

    // Intermediate Individual French Balconies
    const frenchBalconyGeo = regGeo(new THREE.BoxGeometry(2.2, 0.45, 0.4));
    for (let f = 3; f < floorCount - 1; f++) {
      [-width * 0.26, 0, width * 0.26].forEach((bx) => {
        const bMeshS = new THREE.Mesh(frenchBalconyGeo, matIronwork);
        bMeshS.position.set(posX + bx, f * 4.8 + 0.12, posZ - depth / 2 - 0.2);
        parent.add(bMeshS);

        const bMeshN = new THREE.Mesh(frenchBalconyGeo, matIronwork);
        bMeshN.position.set(posX + bx, f * 4.8 + 0.12, posZ + depth / 2 + 0.2);
        parent.add(bMeshN);
      });
    }

    // Carved Stone Cornices separating stories
    const corniceGeo = regGeo(new THREE.BoxGeometry(width + 0.35, 0.3, depth + 0.35));
    for (let f = 1; f < floorCount; f++) {
      const cornice = new THREE.Mesh(corniceGeo, matStoneTrim);
      cornice.position.set(posX, f * 4.8 + 0.3 + 0.12, posZ);
      parent.add(cornice);
    }

  } else if (countryCode === "it") {
    // ----------------------------------------------------
    // ITALY: Classical Roman Arched Loggias, Pediments & Olive Shutters
    // ----------------------------------------------------
    // 1. Classical Stringcourses separating horizontal stories
    const stringcourseGeo = regGeo(new THREE.BoxGeometry(width + 0.35, 0.35, depth + 0.35));
    for (let f = 1; f < floorCount; f++) {
      const stringcourse = new THREE.Mesh(stringcourseGeo, matStoneTrim);
      stringcourse.position.set(posX, f * 4.8 + 0.12, posZ);
      parent.add(stringcourse);
    }

    // 2. Classical Window Pediments with Green Shutters
    const pedimentGeo = regGeo(new THREE.BoxGeometry(1.6, 0.45, 0.35));
    const shutterGeo = regGeo(new THREE.BoxGeometry(0.35, 2.2, 0.2));

    for (let f = 1; f < Math.min(floorCount, 6); f++) {
      const wy = f * 4.8 + 2.0 + 0.12;
      [-width * 0.26, 0, width * 0.26].forEach((wx, i) => {
        // Pediment over window
        if ((f + i) % 2 === 0) {
          const pedS = new THREE.Mesh(pedimentGeo, matStoneTrim);
          pedS.position.set(posX + wx, wy + 1.3, posZ - depth / 2 - 0.15);
          parent.add(pedS);
        }

        // Olive Green Shutters flanking windows
        const shutterLeft = new THREE.Mesh(shutterGeo, matIronwork);
        shutterLeft.position.set(posX + wx - 0.9, wy, posZ - depth / 2 - 0.12);
        parent.add(shutterLeft);

        const shutterRight = new THREE.Mesh(shutterGeo, matIronwork);
        shutterRight.position.set(posX + wx + 0.9, wy, posZ - depth / 2 - 0.12);
        parent.add(shutterRight);
      });
    }

  } else {
    // ----------------------------------------------------
    // SPAIN (DEFAULT): Wrought-Iron Juliet Balconies & Stone Mouldings
    // ----------------------------------------------------
    const balconyGeo = regGeo(new THREE.BoxGeometry(width + 0.3, 0.42, depth + 0.3));
    for (let f = 1; f < floorCount; f++) {
      // Wrought-iron railings on balconies
      const railing = new THREE.Mesh(balconyGeo, matIronwork);
      railing.position.set(posX, f * 4.8 + 0.12, posZ);
      parent.add(railing);

      // Stone moulding trim band under balconies
      const stoneMoulding = new THREE.Mesh(
        regGeo(new THREE.BoxGeometry(width + 0.25, 0.22, depth + 0.25)),
        matStoneTrim
      );
      stoneMoulding.position.set(posX, f * 4.8 - 0.2 + 0.12, posZ);
      parent.add(stoneMoulding);
    }

    // Glass Window Bands
    const glassBandGeo = regGeo(new THREE.BoxGeometry(width + 0.1, 0.6, depth + 0.1));
    for (let f = 1; f < floorCount; f++) {
      const glass = new THREE.Mesh(glassBandGeo, matGlass);
      glass.position.set(posX, f * 4.8 + 1.4 + 0.12, posZ);
      parent.add(glass);
    }
  }
}

/**
 * Builds Plot-0-0: Grand Central Taxi Terminal & Transit Hub customized per country.
 */
export function buildCountryPlot00(ctx: BuildingBuildContext): void {
  const { plot, parent, regGeo, materials } = ctx;
  const { matFacadePrimary, matFacadeSecondary, matGlass, matRoofTrim } = materials;

  const bWidth = plot.width * (62.0 / 72.0); // 62.0m for 72m plot

  // 1. South Terminal Concourse Tower (height 46m, south edge of plot, local z in [-31, -13])
  const volS_W = bWidth;
  const volS_D = 18.0;
  const volS_Z = -22.0;
  const towerH = 46;

  const geoS = regGeo(new THREE.BoxGeometry(volS_W, towerH, volS_D));
  const meshS = new THREE.Mesh(geoS, matFacadePrimary);
  meshS.name = `${plot.id}-building-tower`;
  meshS.position.set(0, towerH / 2 + 0.12, volS_Z);
  meshS.castShadow = true;
  meshS.receiveShadow = true;
  parent.add(meshS);

  // Facade decoration on South Concourse
  decorateCountryFacade(ctx, volS_W, volS_D, towerH, 0, volS_Z);

  // Ground-level Terminal Glass Entrance / Passenger Lobby (south side)
  const lobbyGeo = regGeo(new THREE.BoxGeometry(volS_W * 0.5, 4.5, volS_D + 0.4));
  const lobbyMesh = new THREE.Mesh(lobbyGeo, matGlass);
  lobbyMesh.position.set(0, 2.25 + 0.12, volS_Z);
  parent.add(lobbyMesh);

  // South Concourse Rooftop Crown (Named plot-0-0-building-roof)
  buildCountryRoof(ctx, volS_W * 0.65, volS_D * 0.75, towerH, 0, volS_Z);

  // 2. North Terminal Portico Wing (height 42m, north edge of plot, local z in [19, 31])
  const volN_W = bWidth;
  const volN_D = 12.0;
  const volN_Z = 25.0;
  const porticoH = 42;

  const geoN = regGeo(new THREE.BoxGeometry(volN_W, porticoH, volN_D));
  const meshN = new THREE.Mesh(geoN, matFacadeSecondary);
  meshN.name = `${plot.id}-building-tower-portico`;
  meshN.position.set(0, porticoH / 2 + 0.12, volN_Z);
  meshN.castShadow = true;
  meshN.receiveShadow = true;
  parent.add(meshN);

  decorateCountryFacade(ctx, volN_W, volN_D, porticoH, 0, volN_Z);

  // 3. Elevated Glass Skybridge Concourse (spanning 24m to 32m height high above the taxi stand)
  const bridgeW = 16.0;
  const bridgeD = 32.0;
  const bridgeH = 8.0;
  const bridgeGeo = regGeo(new THREE.BoxGeometry(bridgeW, bridgeH, bridgeD));
  const bridgeMesh = new THREE.Mesh(bridgeGeo, matGlass);
  bridgeMesh.name = `${plot.id}-terminal-skybridge`;
  bridgeMesh.position.set(0, 28.0 + 0.12, 1.5);
  parent.add(bridgeMesh);

  // Structural support framing under skybridge in country accent
  const frameGeo = regGeo(new THREE.BoxGeometry(bridgeW + 0.4, 0.6, bridgeD));
  const frameMesh = new THREE.Mesh(frameGeo, matRoofTrim);
  frameMesh.position.set(0, 24.0 + 0.12, 1.5);
  parent.add(frameMesh);
}

/**
 * Builds Plot-1-0: Multi-story Parking Garage customized per country.
 */
export function buildCountryPlot10(ctx: BuildingBuildContext): void {
  const { plot, parent, regGeo, regMat, materials } = ctx;
  const { matFacadePrimary, matFacadeSecondary, matStoneTrim, matRoofTrim } = materials;

  const bWidth = plot.width * (62.0 / 72.0);
  const bDepth = plot.depth * (62.0 / 72.0);
  const deckHeight = 36;

  // 1. North Parking Garage Wing (spanning full width across north half)
  const volA_W = bWidth;
  const volA_D = plot.depth * (30.0 / 72.0);
  const volA_Z = plot.depth * (16.0 / 72.0);
  const geoA = regGeo(new THREE.BoxGeometry(volA_W, deckHeight, volA_D));
  const meshA = new THREE.Mesh(geoA, matFacadeSecondary);
  meshA.name = `${plot.id}-building-tower`;
  meshA.position.set(0, deckHeight / 2 + 0.12, volA_Z);
  meshA.castShadow = true;
  meshA.receiveShadow = true;
  parent.add(meshA);

  // Open-air parking floor slabs on North Volume (BoxGeometry height 0.6-0.8, width > 60)
  const floorCount = 4;
  const parkDeckMat = regMat(new THREE.MeshLambertMaterial({ color: 0xd8e0e8 }));
  const parkBarrierMat = regMat(new THREE.MeshLambertMaterial({ color: 0x475569 }));
  const parkPillarMat = matStoneTrim;

  for (let f = 1; f <= floorCount; f++) {
    const floorY = f * (deckHeight / (floorCount + 0.5));
    const slabGeo = regGeo(new THREE.BoxGeometry(volA_W + 0.3, 0.7, volA_D + 0.3));
    const slabMesh = new THREE.Mesh(slabGeo, parkDeckMat);
    slabMesh.position.set(0, floorY + 0.12, volA_Z);
    parent.add(slabMesh);

    // Safety barrier bands
    const barrierGeo = regGeo(new THREE.BoxGeometry(volA_W + 0.4, 0.9, volA_D + 0.4));
    const barrierMesh = new THREE.Mesh(barrierGeo, parkBarrierMat);
    barrierMesh.position.set(0, floorY + 0.9 + 0.12, volA_Z);
    parent.add(barrierMesh);
  }

  // Facade columns along the front face of North wing
  const colGeo = regGeo(new THREE.CylinderGeometry(0.45, 0.45, deckHeight, 8));
  [-26, -18, -10, -2, 6, 14, 22].forEach((cx) => {
    const col = new THREE.Mesh(colGeo, parkPillarMat);
    col.position.set(cx, deckHeight / 2 + 0.12, volA_Z - volA_D / 2);
    parent.add(col);
  });

  // 2. West Parking Garage Wing (spanning full 62m depth along west edge)
  const volB_W = 28.0;
  const volB_D = bDepth;
  const volB_X = -17.0;
  const wingH = 30;
  const geoB = regGeo(new THREE.BoxGeometry(volB_W, wingH, volB_D));
  const meshB = new THREE.Mesh(geoB, matFacadePrimary);
  meshB.name = `${plot.id}-building-tower-wing`;
  meshB.position.set(volB_X, wingH / 2 + 0.12, 0);
  meshB.castShadow = true;
  meshB.receiveShadow = true;
  parent.add(meshB);

  // Floor slabs on West Volume
  for (let f = 1; f <= 3; f++) {
    const floorY = f * 8.5;
    const wSlabGeo = regGeo(new THREE.BoxGeometry(volB_W + 0.3, 0.7, volB_D + 0.3));
    const wSlab = new THREE.Mesh(wSlabGeo, parkDeckMat);
    wSlab.position.set(volB_X, floorY + 0.12, 0);
    parent.add(wSlab);
  }

  // Ground-level Vehicular Entrance / Exit Portal (facing South road)
  const portalArchGeo = regGeo(new THREE.BoxGeometry(7.5, 4.2, 0.8));
  const portalArch = new THREE.Mesh(portalArchGeo, parkPillarMat);
  portalArch.position.set(volB_X, 2.1 + 0.12, -volB_D / 2 + 0.4);
  parent.add(portalArch);

  const portalVoidGeo = regGeo(new THREE.BoxGeometry(6.2, 3.4, 1.2));
  const portalVoid = new THREE.Mesh(portalVoidGeo, matRoofTrim);
  portalVoid.position.set(volB_X, 1.7 + 0.12, -volB_D / 2 + 0.4);
  parent.add(portalVoid);

  // Overhead clearance bar: "MAX 2.1M" with hazard stripes
  const clearBarGeo = regGeo(new THREE.BoxGeometry(6.0, 0.35, 0.25));
  const clearBar = new THREE.Mesh(clearBarGeo, regMat(new THREE.MeshLambertMaterial({ color: 0xfacc15 })));
  clearBar.position.set(volB_X, 3.2 + 0.12, -volB_D / 2 + 0.6);
  parent.add(clearBar);

  // Boom barrier gate arm
  const barrierArmGeo = regGeo(new THREE.BoxGeometry(3.6, 0.14, 0.14));
  const barrierArm = new THREE.Mesh(barrierArmGeo, regMat(new THREE.MeshBasicMaterial({ color: 0xef4444 })));
  barrierArm.position.set(volB_X + 0.8, 1.0 + 0.12, -volB_D / 2 + 0.6);
  parent.add(barrierArm);

  // Parking "P" Sign Totem
  const parkSignBlueMat = regMat(new THREE.MeshLambertMaterial({ color: 0x2563eb }));
  const parkSignWhiteMat = regMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const signTotemGeo = regGeo(new THREE.BoxGeometry(1.6, 2.4, 0.25));
  const signTotem = new THREE.Mesh(signTotemGeo, parkSignBlueMat);
  signTotem.position.set(volB_X + volB_W / 2 + 1.2, 4.0 + 0.12, -volB_D / 2 + 1.2);
  parent.add(signTotem);

  const pStemGeo = regGeo(new THREE.BoxGeometry(0.25, 1.4, 0.30));
  const pStem = new THREE.Mesh(pStemGeo, parkSignWhiteMat);
  pStem.position.set(volB_X + volB_W / 2 + 1.2 - 0.25, 4.0 + 0.12, -volB_D / 2 + 1.2);
  parent.add(pStem);

  const pLoopGeo = regGeo(new THREE.BoxGeometry(0.65, 0.7, 0.30));
  const pLoop = new THREE.Mesh(pLoopGeo, parkSignWhiteMat);
  pLoop.position.set(volB_X + volB_W / 2 + 1.2 + 0.1, 4.35 + 0.12, -volB_D / 2 + 1.2);
  parent.add(pLoop);

  // 3. North-West Stairwell & Elevator Vertical Tower Core
  const coreH = 44;
  const coreGeo = regGeo(new THREE.BoxGeometry(10.0, coreH, 10.0));
  const coreMesh = new THREE.Mesh(coreGeo, matFacadePrimary);
  coreMesh.position.set(-25.0, coreH / 2 + 0.12, 25.0);
  coreMesh.castShadow = true;
  parent.add(coreMesh);

  // Elevator Penthouse Crown (Named plot-1-0-building-roof)
  const crownGeo = regGeo(new THREE.BoxGeometry(8.0, 3.5, 8.0));
  const crownMesh = new THREE.Mesh(crownGeo, matRoofTrim);
  crownMesh.name = `${plot.id}-building-roof`;
  crownMesh.position.set(-25.0, coreH + 1.75 + 0.12, 25.0);
  crownMesh.castShadow = true;
  parent.add(crownMesh);

  // Rooftop Parapet Wall around North open roof deck
  const parapetNorthGeo = regGeo(new THREE.BoxGeometry(volA_W, 1.2, 0.4));
  const parapetNorth = new THREE.Mesh(parapetNorthGeo, parkBarrierMat);
  parapetNorth.position.set(0, deckHeight + 0.6 + 0.12, volA_Z + volA_D / 2);
  parent.add(parapetNorth);

  // 4. Parked Civilian Vehicles on Roof Deck (2x scale)
  const civilianCarColors = [0x94a3b8, 0x1d4ed8, 0xf1f5f9];
  civilianCarColors.forEach((color, idx) => {
    const carGroup = new THREE.Group();
    carGroup.name = `${plot.id}-roof-car-${idx + 1}`;
    carGroup.scale.set(2.0, 2.0, 2.0);
    carGroup.position.set(-16 + idx * 16, deckHeight + 0.12, volA_Z);

    const carBody = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(4.4, 0.72, 2.0)),
      regMat(new THREE.MeshLambertMaterial({ color }))
    );
    carBody.position.y = 0.55;
    carGroup.add(carBody);

    const carCabin = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(2.4, 0.62, 1.8)),
      materials.matGlass
    );
    carCabin.position.set(-0.2, 1.15, 0);
    carGroup.add(carCabin);

    parent.add(carGroup);
  });
}

/**
 * Builds Plot-1-2: L-Shaped High-Rise framing Transit Plaza customized per country.
 */
export function buildCountryPlot12(ctx: BuildingBuildContext): void {
  const { plot, parent, regGeo, materials } = ctx;
  const { matFacadePrimary, matFacadeSecondary } = materials;

  const bWidth = plot.width * (62.0 / 72.0);
  const bDepth = plot.depth * (62.0 / 72.0);
  const totalHeight = 58;

  // North Volume A (spanning full width across north half)
  const volA_W = bWidth;
  const volA_D = plot.depth * (30.0 / 72.0);
  const volA_Z = plot.depth * (16.0 / 72.0);
  const geoA = regGeo(new THREE.BoxGeometry(volA_W, totalHeight, volA_D));
  const meshA = new THREE.Mesh(geoA, matFacadePrimary);
  meshA.name = `${plot.id}-building-tower`;
  meshA.position.set(0, totalHeight / 2 + 0.12, volA_Z);
  meshA.castShadow = true;
  meshA.receiveShadow = true;
  parent.add(meshA);

  // East Wing Volume B (spanning full depth along east edge)
  const volB_W = 28.0;
  const volB_D = bDepth;
  const volB_X = 17.0;
  const wingH = 40;
  const geoB = regGeo(new THREE.BoxGeometry(volB_W, wingH, volB_D));
  const meshB = new THREE.Mesh(geoB, matFacadeSecondary);
  meshB.name = `${plot.id}-building-tower-wing`;
  meshB.position.set(volB_X, wingH / 2 + 0.12, 0);
  meshB.castShadow = true;
  meshB.receiveShadow = true;
  parent.add(meshB);

  // Facade decoration on North Volume
  decorateCountryFacade(ctx, volA_W, volA_D, totalHeight, 0, volA_Z);

  // Rooftop Crown on North Volume (Named plot-1-2-building-roof)
  buildCountryRoof(ctx, volA_W * 0.65, volA_D * 0.7, totalHeight, 0, volA_Z);
}

/**
 * Builds generic framing buildings (Archetypes 0, 1, 2, 3) customized per country.
 */
export function buildCountryGenericBuilding(ctx: BuildingBuildContext): void {
  const { plot, parent, seed, archetype, regGeo, materials } = ctx;
  const { matFacadePrimary, matFacadeSecondary, matFacadeBase, matGlass } = materials;

  if (archetype === 0) {
    // ----------------------------------------------------
    // ARCHETYPE 0: High-Rise with Stepped Urban Podium
    // ----------------------------------------------------
    const bWidth = plot.width * (0.88 + (seed % 3) * 0.015); // 63.4 to 65.5
    const bDepth = plot.depth * (0.88 + ((seed + 1) % 3) * 0.015);
    const totalHeight = 52 + seed * 3.5; // 52 to 80 units

    // Ground Podium (height 10) in country base stone
    const podiumHeight = 10;
    const podiumGeo = regGeo(new THREE.BoxGeometry(bWidth, podiumHeight, bDepth));
    const podiumMesh = new THREE.Mesh(podiumGeo, matFacadeBase);
    podiumMesh.name = `${plot.id}-building-tower-podium`;
    podiumMesh.position.set(0, podiumHeight / 2 + 0.12, 0);
    podiumMesh.castShadow = true;
    podiumMesh.receiveShadow = true;
    parent.add(podiumMesh);

    // Glass Retail / Portal Band
    const lobbyBandGeo = regGeo(new THREE.BoxGeometry(bWidth + 0.2, 2.5, bDepth + 0.2));
    const lobbyBandMesh = new THREE.Mesh(lobbyBandGeo, matGlass);
    lobbyBandMesh.position.set(0, 3 + 0.12, 0);
    parent.add(lobbyBandMesh);

    // Main Tower rising from podium (82% setback)
    const towerW = bWidth * 0.82;
    const towerD = bDepth * 0.82;
    const towerH = totalHeight - podiumHeight - 8;
    const towerGeo = regGeo(new THREE.BoxGeometry(towerW, towerH, towerD));
    const towerMesh = new THREE.Mesh(towerGeo, matFacadePrimary);
    towerMesh.name = `${plot.id}-building-tower`;
    towerMesh.position.set(0, podiumHeight + towerH / 2 + 0.12, 0);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    parent.add(towerMesh);

    // Country-specific facade decoration on main tower
    decorateCountryFacade(ctx, towerW, towerD, towerH, 0, 0);

    // Country-specific roof crown
    buildCountryRoof(ctx, towerW, towerD, podiumHeight + towerH, 0, 0);

  } else if (archetype === 1) {
    // ----------------------------------------------------
    // ARCHETYPE 1: Heritage Boulevard Palace / Corporate Headquarters
    // ----------------------------------------------------
    const bWidth = plot.width * (0.89 + (seed % 3) * 0.015); // 64.1 to 66.2
    const bDepth = plot.depth * (0.88 + ((seed + 1) % 3) * 0.015);
    const towerH = 48 + seed * 3.2; // 48 to 74 units tall

    // Main Palace Tower
    const towerGeo = regGeo(new THREE.BoxGeometry(bWidth, towerH, bDepth));
    const towerMesh = new THREE.Mesh(towerGeo, matFacadePrimary);
    towerMesh.name = `${plot.id}-building-tower`;
    towerMesh.position.set(0, towerH / 2 + 0.12, 0);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    parent.add(towerMesh);

    // Rusticated base tier (first 6m)
    const baseH = 6.0;
    const baseGeo = regGeo(new THREE.BoxGeometry(bWidth + 0.2, baseH, bDepth + 0.2));
    const baseMesh = new THREE.Mesh(baseGeo, matFacadeBase);
    baseMesh.position.set(0, baseH / 2 + 0.12, 0);
    parent.add(baseMesh);

    // Country facade decoration
    decorateCountryFacade(ctx, bWidth, bDepth, towerH, 0, 0);

    // Country roof crown
    buildCountryRoof(ctx, bWidth, bDepth, towerH, 0, 0);

  } else if (archetype === 2) {
    // ----------------------------------------------------
    // ARCHETYPE 2: Dual-Volume / Corner Landmark
    // ----------------------------------------------------
    const bWidth = plot.width * (0.88 + (seed % 3) * 0.015);
    const bDepth = plot.depth * (0.88 + ((seed + 1) % 3) * 0.015);
    const towerH = 50 + seed * 3.0; // 50 to 74 units
    const wingH = towerH * 0.65;    // 32.5 to 48 units

    // Primary Volume A (north half +Z)
    const volA_W = bWidth - 0.2;
    const volA_D = bDepth * 0.58;
    const volA_OffsetX = 0.1;
    const volA_OffsetZ = bDepth / 2 - volA_D / 2;
    const geoA = regGeo(new THREE.BoxGeometry(volA_W, towerH, volA_D));
    const meshA = new THREE.Mesh(geoA, matFacadePrimary);
    meshA.name = `${plot.id}-building-tower`;
    meshA.position.set(volA_OffsetX, towerH / 2 + 0.12, volA_OffsetZ);
    meshA.castShadow = true;
    meshA.receiveShadow = true;
    parent.add(meshA);

    // Intersecting Wing Volume B (west half -X)
    const volB_W = bWidth * 0.55;
    const volB_D = bDepth - 0.2;
    const volB_OffsetX = -bWidth / 2 + volB_W / 2;
    const volB_OffsetZ = -0.1;
    const geoB = regGeo(new THREE.BoxGeometry(volB_W, wingH, volB_D));
    const meshB = new THREE.Mesh(geoB, matFacadeSecondary);
    meshB.name = `${plot.id}-building-tower-wing`;
    meshB.position.set(volB_OffsetX, wingH / 2 + 0.12, volB_OffsetZ);
    meshB.castShadow = true;
    meshB.receiveShadow = true;
    parent.add(meshB);

    // Facade decoration on Primary Volume
    decorateCountryFacade(ctx, volA_W, volA_D, towerH, volA_OffsetX, volA_OffsetZ);

    // Country roof crown on Primary Volume
    buildCountryRoof(ctx, volA_W * 0.65, volA_D * 0.75, towerH, volA_OffsetX, volA_OffsetZ);

  } else {
    // ----------------------------------------------------
    // ARCHETYPE 3: Stepped Monumental Multi-Tier Tower
    // ----------------------------------------------------
    const bWidth = plot.width * (0.89 + (seed % 3) * 0.012);
    const bDepth = plot.depth * (0.89 + ((seed + 1) % 3) * 0.012);
    const baseH = 14;
    const midH = 26;
    const upperH = 22 + seed * 2.0;

    // Tier 1: Base in country base material
    const baseGeo = regGeo(new THREE.BoxGeometry(bWidth, baseH, bDepth));
    const baseMesh = new THREE.Mesh(baseGeo, matFacadeBase);
    baseMesh.name = `${plot.id}-building-tower`;
    baseMesh.position.set(0, baseH / 2 + 0.12, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    parent.add(baseMesh);

    // Tier 2: Mid Tower (76% setback)
    const midW = bWidth * 0.76;
    const midD = bDepth * 0.76;
    const midGeo = regGeo(new THREE.BoxGeometry(midW, midH, midD));
    const midMesh = new THREE.Mesh(midGeo, matFacadeSecondary);
    midMesh.position.set(0, baseH + midH / 2 + 0.12, 0);
    midMesh.castShadow = true;
    midMesh.receiveShadow = true;
    parent.add(midMesh);

    decorateCountryFacade(ctx, midW, midD, midH, 0, 0);

    // Tier 3: Upper Tower (56% setback)
    const upperW = bWidth * 0.56;
    const upperD = bDepth * 0.56;
    const upperGeo = regGeo(new THREE.BoxGeometry(upperW, upperH, upperD));
    const upperMesh = new THREE.Mesh(upperGeo, matFacadePrimary);
    upperMesh.position.set(0, baseH + midH + upperH / 2 + 0.12, 0);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    parent.add(upperMesh);

    // Country roof crown on Upper Tier
    buildCountryRoof(ctx, upperW, upperD, baseH + midH + upperH, 0, 0);
  }
}
