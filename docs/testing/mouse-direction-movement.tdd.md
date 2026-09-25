# TDD Evidence Report: Mouse-Direction Player Movement

## 1. User Journeys
1. **Mouse Aim Direction**: As a player, moving the cursor over the 3D world determines the player's facing direction via camera-to-ground raycasting, rotating the avatar smoothly without snapping.
2. **Up Arrow Movement (Toward Cursor)**: As a player, pressing `↑` (or `W`) moves the avatar forward directly toward the mouse cursor's world-space position.
3. **Down Arrow Movement (Opposite Cursor)**: As a player, pressing `↓` (or `S`) moves the avatar backward away from the cursor while maintaining facing toward the cursor.
4. **Left / Right Arrow Movement (Strafing)**: As a player, pressing `←` / `→` (or `A` / `D`) strafes sideways perpendicularly relative to the cursor aim direction.
5. **Diagonal Movement Normalization**: As a player, combined inputs (e.g. `↑` + `→`) move at the exact same normalized speed as straight movement.
6. **Ground Reticle Visual**: A subtle, clean ground crosshair indicator tracks the cursor ground intersection point.
7. **Input Priority**: Arrow keys immediately cancel active click-to-move destinations.
8. **Edge Cases**: Out-of-bounds cursor, sky raycasts, and zero-distance deadzones are handled gracefully without NaN, jitter, or crash.

## 2. Test Execution & Evidence

### Test Runner
`npm test` (`tsx --test tests/*.test.ts`)

### Test Guarantees & Specification
| # | Guarantee | Test Target | Type | Result | Evidence |
|---|-----------|-------------|------|--------|----------|
| 1 | Accurate world-space direction, distance, and angle toward cursor | `tests/mouse-direction-movement.test.ts` | unit | PASS | `calculateAimDirection` returns normalized vector, angle, distance |
| 2 | Camera-to-ground plane raycasting | `tests/mouse-direction-movement.test.ts` | unit | PASS | `raycastHandler.getGroundIntersection` intersects ground plane $Y=0$ |
| 3 | Cursor to right turns player smoothly to face right | `tests/mouse-direction-movement.test.ts` | unit | PASS | `updatePlayerMouseAim` rotates toward $\pi/2$ without moving position |
| 4 | Cursor to left turns player smoothly to face left | `tests/mouse-direction-movement.test.ts` | unit | PASS | `updatePlayerMouseAim` rotates toward $-\pi/2$ without moving position |
| 5 | Up arrow moves forward in cursor direction | `tests/mouse-direction-movement.test.ts` | unit | PASS | `updatePlayerKeyboard` with cursor moves along aim vector |
| 6 | Down arrow moves backward relative to cursor while keeping facing | `tests/mouse-direction-movement.test.ts` | unit | PASS | Moves opposite cursor, preserves facing angle toward cursor |
| 7 | Left and Right arrows strafe sideways relative to cursor | `tests/mouse-direction-movement.test.ts` | unit | PASS | Perpendicular strafing relative to cursor angle |
| 8 | Diagonal cursor-relative movement has identical speed to straight | `tests/mouse-direction-movement.test.ts` | unit | PASS | Diagonal distance equals straight distance within 1e-3 |
| 9 | Ground intersection determines direction independent of camera forward | `tests/mouse-direction-movement.test.ts` | unit | PASS | Camera orientation/elevation does not corrupt ground aim direction |
| 10 | Handles missing cursor, out-of-bounds, sky raycasts, deadzones | `tests/mouse-direction-movement.test.ts` | unit | PASS | No NaN, no crash, fallback to current facing |
| 11 | Arrow keys immediately cancel click destination | `tests/mouse-direction-movement.test.ts` | unit | PASS | Target set to null on arrow key press, does not resume on release |

### Test Suite Summary
- Total Tests: 74
- Passed: 74
- Failed: 0
- Suites: 0
- Duration: ~350ms
