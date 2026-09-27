# TDD Evidence Report: Terracotta Footpath Pavement & Road-Side Tactile Warning Strip

**Date**: 2026-09-25  
**Feature**: Visual Footpath & Pavement System Upgrade  
**Status**: GREEN (All 63 tests passing)

---

## 1. User Journeys & Acceptance Guarantees

### Journey 1: Visual Base Color & Aesthetic (Terracotta #B94A2F - #C65A3A)
- **As a** player navigating the urban environment and central park,
- **I want** the footpaths and sidewalks to display a warm terracotta / reddish-orange tile paving,
- **So that** the pedestrian areas have a distinctive, warm, low-poly aesthetic rather than generic flat gray/beige.

### Journey 2: Procedural Tile Grid, Visible Seams & Variation
- **As a** player observing the city from elevated and chase camera perspectives,
- **I want** clearly visible rectangular/square tile seams and subtle tile-to-tile tonal variation,
- **So that** the surface reads as real paving stones with matte rough texture without incurring heavy per-tile geometry overhead.

### Journey 3: Road-Side Edge Safety Detailing (Yellow Tactile Strip)
- **As a** player walking toward the curb and street crossing,
- **I want** a narrow, saturated-but-muted yellow tactile paving strip with a ribbed texture along road-facing edges,
- **So that** the boundary between sidewalk and street curb has a clear urban transition inspired by real-world transit paving.

### Journey 4: Seamless Layering & Full Walkability
- **As a** player interacting with the 3D world via keyboard locomotion and click-to-move,
- **I want** all sidewalks, park paths, and tactile edges to maintain clean height layering (no gaps, no floating meshes, zero z-fighting) and remain registered for raycasting,
- **So that** movement is continuous and responsive across all pedestrian surfaces.

---

## 2. Test Execution & Evidence

### RED Gate Verification
- **Command**: `npm test`
- **Output**:
  ```
  Error: Cannot find module '../src/map/pavement-textures'
  ✖ tests/footpath-style.test.ts (323.293792ms)
  ℹ fail 1
  ```

### GREEN Gate Verification
- **Command**: `npm test`
- **Output**:
  ```
  ✔ TDD [Footpath Base Color]: Base color is within #B94A2F to #C65A3A terracotta range (0.499834ms)
  ✔ TDD [Procedural Tile Texture]: Generates valid DataTexture with repeat wrapping and mipmaps (5.297791ms)
  ✔ TDD [Tile Grid & Grout Lines]: Texture has visible grout lines separating tiles (0.262208ms)
  ✔ TDD [Tile Variation]: Contains subtle color/brightness variation between individual tiles (0.284416ms)
  ✔ TDD [Tactile Yellow Color]: Yellow tactile strip color is saturated but slightly muted yellow (0.058416ms)
  ✔ TDD [Tactile Ribbed Pattern]: Generates repeating tactile ribbed bars (0.707ms)
  ✔ TDD [Matte Finish]: Footpath and tactile materials have matte rough surface rather than glossy (2.789667ms)
  ✔ TDD [3D Mesh Integration]: Building plots contain terracotta tiled sidewalks with road-facing tactile strips (11.30425ms)
  ✔ TDD [Park Footpath Integration]: Central Park uses terracotta pavement and tactile transition strips (8.60275ms)
  ✔ TDD [Walkability & Raycasting]: All sidewalks and tactile strips are registered as clickable (7.769542ms)
  ✔ TDD [Curb & Transition Heights]: Heights layer properly without z-fighting (5.151625ms)
  ...
  ℹ tests 63
  ℹ suites 0
  ℹ pass 63
  ℹ fail 0
  ℹ duration_ms 359.714
  ```

---

## 3. Human-Readable Test Guarantees

| # | What is guaranteed | Test file | Test type | Result | Evidence |
|---|--------------------|-----------|-----------|--------|----------|
| 1 | Footpath base color falls in `#B94A2F` to `#C65A3A` with $R > G > B$ | `tests/footpath-style.test.ts` | Unit | PASS | `r=189, g=79, b=51` |
| 2 | Procedural tile texture generates valid `THREE.DataTexture` with mipmaps | `tests/footpath-style.test.ts` | Unit | PASS | `256x256x4 RGBA RepeatWrapping` |
| 3 | Visible grout/seam lines separate square tiles | `tests/footpath-style.test.ts` | Unit | PASS | Seam $R=82$ vs tile center $R=189$ |
| 4 | Distinct brightness/warmth variation across individual tiles | `tests/footpath-style.test.ts` | Unit | PASS | $\ge 4$ distinct tile center variations |
| 5 | Road-facing tactile strip is saturated muted yellow (`#DCA81A`) | `tests/footpath-style.test.ts` | Unit | PASS | $R=220, G=168, B=26$ |
| 6 | Tactile strip features alternating raised ribs and shaded grooves | `tests/footpath-style.test.ts` | Unit | PASS | Contrast diff $> 25$ |
| 7 | Footpath & tactile materials are matte rough (roughness $\ge 0.8$) | `tests/footpath-style.test.ts` | Unit | PASS | `roughness: 0.88, metalness: 0.04` |
| 8 | Building plots generate terracotta sidewalks with 4 road-edge tactile strips | `tests/footpath-style.test.ts` | Integration | PASS | Meshes exist and positioned on perimeter |
| 9 | Central park loop and 4 connectors use terracotta and tactile transitions | `tests/footpath-style.test.ts` | Integration | PASS | Perimeter loop, connectors & tactile edges |
| 10 | All sidewalks and tactile strips are clickable for click-to-move | `tests/footpath-style.test.ts` | Integration | PASS | Registered in `clickableObjects` |
| 11 | Heights strictly ordered (`curb <= tactile <= pavement < superstructure`) | `tests/footpath-style.test.ts` | Integration | PASS | Zero z-fighting, flush transitions |
