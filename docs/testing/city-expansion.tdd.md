# TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD

## 1. Source & Intent
- **User Intent**: Expand the unified 3D world into a grand, large urban district, add roadside curbs, streetlamps, traffic lights, and moving cars along the road, switch environment to bright daytime with a vivid blue sky, move the camera further backwards for a wide panoramic view, and render an interactive live minimap radar in the corner showing real-time player location and district landmarks.
- **Planning Input**: Decision Council synthesis (Architect, Skeptic, Pragmatist, Critic) establishing emissive daytime street furniture, decoupled 60fps canvas radar rendering, and backwards-compatible zone coordinates.

## 2. User Journeys Covered
- **Journey 1 (Urban Scale & Daylight Sky)**: As a language learner, I want to explore an expansive 3D city scene (100m x 44m) illuminated under a bright daytime Mediterranean sky with a pulled-back panoramic third-person camera.
- **Journey 2 (Roadway & Animated Traffic)**: As a player walking along the promenade, I want to see a multi-lane roadway with streetlamps, traffic signals, crosswalks, and animated cars (taxis, city buses, sedans, sports coupes, shuttle vans) cruising past in real-time.
- **Journey 3 (Real-Time Live Minimap Radar)**: As an explorer, I want a prominent, large minimap HUD in the bottom corner of my screen that tracks my avatar's live position and heading, displays district zones (Café, Bus Hub, Airport), and runs at 60fps without UI lag.
- **Journey 4 (Backwards Compatibility)**: As a system, all existing hotspot curricula, spawn points, and zone detection logic continue to work without regression.

## 3. Task Report & Execution Summary
1. **Defined City Expansion & Traffic Kinematics**:
   - Implemented `EXPANDED_WORLD_BOUNDS` (100m x 44m), `DAYLIGHT_CONFIG` (sky 0x60a5fa, sun intensity 1.8), `CAMERA_VIEW_CONFIG` (fov 55, height 15.0, zOffset 17.5), `ROAD_SYSTEM_CONFIG`, `computeCarPosition`, and `worldToMinimapCoords`.
   - Command: `npm test` -> verified RED gate on reproducer test, then GREEN after implementation.
2. **Three.js Daylight & Boulevard Construction**:
   - Refactored `Cafe3DScene` to use bright Mediterranean sky, soft atmospheric fog, wide DirectionalLight shadow camera (frustum [-60, 60] x [-35, 35]), multi-lane asphalt road, zebra crosswalks, curbs, emissive streetlamps, traffic lights, and animated 3D cars.
3. **High-Performance 2D Minimap HUD**:
   - Created `MinimapHUD` component with an unmanaged 2D HTML5 `<canvas>` that updates at 60fps via imperative ref, avoiding React reconciliation overhead while rendering live player pulse, orientation pointer, moving cars, and district landmarks.
4. **Zero-Regression Verification**:
   - All 31 test cases (PCM audio, multilingual curricula, physics collisions, unified plaza bounds, kinematics, tool calls, and city expansion) pass with 100% green.

## 4. Test Specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|--------------------|----------------------|-----------|--------|----------|
| 1 | World bounds expand to at least 80m x 36m while maintaining zone detection | `tests/city-expansion-world.test.ts` | Unit | PASS | `npm test` |
| 2 | Road configuration defines multi-lane road, streetlamps, traffic signals, and moving cars | `tests/city-expansion-world.test.ts` | Unit | PASS | `npm test` |
| 3 | Car kinematics advance along travel direction and loop seamlessly via modulo wrapping | `tests/city-expansion-world.test.ts` | Unit | PASS | `npm test` |
| 4 | Daylight config sets vivid blue sky (0x60a5fa) and bright solar illumination | `tests/city-expansion-world.test.ts` | Unit | PASS | `npm test` |
| 5 | Camera configuration is elevated (height >= 12) and pulled back (zOffset >= 14, fov >= 50) | `tests/city-expansion-world.test.ts` | Unit | PASS | `npm test` |
| 6 | Minimap transformation accurately maps 3D world coords to 2D radar pixels with clamping | `tests/city-expansion-world.test.ts` | Unit | PASS | `npm test` |
| 7 | All existing unified plaza spawn points, zone detection, and dialogue curricula remain intact | `tests/unified-world.test.ts` | Regression | PASS | `npm test` |

## 5. Coverage and Quality
- **Test Runner**: Node.js test runner with `tsx` (`npm test`)
- **Suite Pass Rate**: 31 passed / 31 total (100% PASS)
- **TypeScript**: `npm run type-check` passed with 0 errors
- **Linter**: `npm run lint` passed with 0 errors
- **Production Build**: `npm run build` compiled successfully (Turbopack Next.js 16.3.6)
