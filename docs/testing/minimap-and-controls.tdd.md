# TDD Evidence Report: Minimap + Player Control + Camera Polish

## Source Plan & User Journeys

Derived according to the specification for GTA V Minimap, Responsive Locomotion, and Stable Camera:
1. **Responsive & Precise Locomotion**: Immediate response on key press, minimal deceleration on key release (no sliding), delta-time frame-rate independence.
2. **Smooth Directional Facing & Diagonal Normalization**: Normalized diagonals so diagonal movement is not faster than straight; smooth rotation to face movement direction (forward, backward, left, right, diagonals).
3. **Movement States & Input Priority**: Clean transitions between `IDLE` and `MOVING`. Arrow keys immediately override and cancel click-to-move destination; releasing keys stops player without resuming old target.
4. **GTA V Style Circular Fixed North-Up Minimap**: Bottom-right HUD rendering existing map data (roads, buildings, central park, port) with smooth player marker tracking and heading rotation. Independent of 3D camera zoom.
5. **Stable Elevated Perspective & Bounded Manual Zoom**: Elevated ~37° third-person/isometric camera with smooth follow, zero auto-zoom on walking, manual mouse wheel zoom strictly bounded between MIN (16) and MAX (65) distances, and obstacle clearance preventing camera clipping through buildings.

## Task Report & Validation

- **RED Phase Command**: `npm test` -> Failed as expected (`Cannot find module '../src/map/minimap-math'`).
- **GREEN Phase Command**: `npm test` -> 50/50 tests passing (2 test suites, 0 failed).
- **Typecheck Command**: `npm run type-check` -> `tsc --noEmit` exited 0 with zero type errors.
- **Lint Command**: `npm run lint` -> `eslint` exited 0 with zero warnings and zero errors.
- **Build Command**: `npm run build` -> Next.js production build succeeded with static page generation for `/` and `/map`.

## Test Specification & Guarantees

| # | What is guaranteed | Test file & Name | Test Type | Result | Evidence |
|---|--------------------|-------------------|-----------|--------|----------|
| 1 | State transitions IDLE ↔ MOVING on key press/release | `tests/minimap-and-controls.test.ts:Movement State` | unit | PASS | `npm test` |
| 2 | Quick stop on release without sliding (<0.15u) | `tests/minimap-and-controls.test.ts:Movement Stopping` | unit | PASS | `npm test` |
| 3 | Cardinal keys move in correct 3D axes (+Z, -Z, -X, +X) | `tests/minimap-and-controls.test.ts:Cardinal Movement` | unit | PASS | `npm test` |
| 4 | Diagonal movement is normalized (not faster than straight) | `tests/minimap-and-controls.test.ts:Diagonal Normalization` | unit | PASS | `npm test` |
| 5 | Character smoothly faces movement direction for all directions | `tests/minimap-and-controls.test.ts:Player Rotation` | unit | PASS | `npm test` |
| 6 | Arrow keys override click destination; release does not resume it | `tests/minimap-and-controls.test.ts:Input Priority` | unit | PASS | `npm test` |
| 7 | Movement scales linearly with delta time | `tests/minimap-and-controls.test.ts:Delta Time` | unit | PASS | `npm test` |
| 8 | Clamps player strictly inside map bounds on all 4 borders | `tests/minimap-and-controls.test.ts:Map Boundary Constraints` | unit | PASS | `npm test` |
| 9 | Accurately maps world position to circular minimap coordinates | `tests/minimap-and-controls.test.ts:Minimap Coordinates` | unit | PASS | `npm test` |
| 10 | Converts 3D rotation to fixed North-up minimap marker rotation | `tests/minimap-and-controls.test.ts:Minimap Heading` | unit | PASS | `npm test` |
| 11 | Tests and clamps coordinates to circular boundary perimeter | `tests/minimap-and-controls.test.ts:Minimap Bounds` | unit | PASS | `npm test` |
| 12 | Elevated third-person angle between 25° and 55° (not horizontal/top-down) | `tests/minimap-and-controls.test.ts:Camera Perspective` | unit | PASS | `npm test` |
| 13 | Manual zoom strictly bounded between MIN (16) and MAX (65) distance | `tests/minimap-and-controls.test.ts:Camera Zoom Bounds` | unit | PASS | `npm test` |
| 14 | Walking does NOT automatically zoom the camera in or out | `tests/minimap-and-controls.test.ts:Camera Stability` | unit | PASS | `npm test` |
| 15 | 16-plot city generation, mesh building, and avatar procedural geometry | `tests/map-and-player.test.ts` (30 tests) | integration | PASS | `npm test` |
