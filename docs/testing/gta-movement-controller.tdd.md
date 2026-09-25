# TDD Evidence Report: GTA San Andreas Third-Person Movement Controller

## 1. Source Plan & Core Architecture

Production-quality third-person movement controller inspired by GTA San Andreas:
1. **Camera-Relative Locomotion**: W/S/A/D keyboard input is projected onto the camera's flattened horizontal ground plane (XZ plane). Vertical pitch of the elevated camera never causes vertical drift or ground penetration.
2. **FREE_ROAM Mode (Default)**:
   - Avatar moves in camera-relative input direction.
   - Turning instead of strafing: character smoothly rotates to face movement direction using shortest-path angular damping.
   - Idle retention: character maintains last facing direction when standing still (no rotation on zero input).
3. **AIMING Mode (Right Mouse Button)**:
   - Triggered by holding Right Mouse Button (configurable).
   - Character rotation locks to camera horizontal yaw.
   - Strafing enabled: W (forward), S (backward), A (left), D (right) relative to camera while avatar continuously faces camera view.
4. **State Transitions & Priority**:
   - Clean transitions between `FREE_ROAM` and `AIMING`.
   - Keyboard input immediately overrides and cancels click-to-move destination.
5. **Kinematics & Frame-Rate Independence**:
   - Frame-rate independent delta-time integration.
   - Normalized diagonal vectors to prevent speed boost.
   - Configurable acceleration and deceleration.
6. **Physics & Gravity**:
   - Downward gravity integration while airborne.
   - Ground collision clamping and downward stick velocity (-0.5 units/s) while grounded.
7. **Animation / Blend Tree Hooks**:
   - Clean export of `speed`, `movementSpeed`, `isMoving`, `isAiming`, `moveX`, and `moveY`.

## 2. Task Report & Validation

- **RED Phase Command**: `npm test` -> Verified 24 failing test assertions against unimplemented GTA mechanics in checkpoint `c1823aa`.
- **GREEN Phase Command**: `npm test` -> 90/90 tests passing (5 test suites, 0 failed).
- **Typecheck Command**: `npx tsc --noEmit` -> Exited 0 with zero type errors.
- **Lint Command**: `npm run lint` -> `eslint` exited 0 with zero errors and zero warnings.
- **Build Command**: `npm run build` -> Next.js production build succeeded with static page generation for `/` and `/map`.

## 3. Test Specification & Guarantees

| # | What is guaranteed | Test File & Name | Type | Result | Evidence |
|---|--------------------|------------------|------|--------|----------|
| 1 | W moves toward camera horizontal forward | `tests/gta-movement-controller.test.ts:TDD 1` | unit | PASS | `npm test` |
| 2 | S moves opposite camera forward | `tests/gta-movement-controller.test.ts:TDD 2` | unit | PASS | `npm test` |
| 3 | A moves camera-relative left | `tests/gta-movement-controller.test.ts:TDD 3` | unit | PASS | `npm test` |
| 4 | D moves camera-relative right | `tests/gta-movement-controller.test.ts:TDD 4` | unit | PASS | `npm test` |
| 5 | W+D produces normalized diagonal movement | `tests/gta-movement-controller.test.ts:TDD 5` | unit | PASS | `npm test` |
| 6 | Character rotates toward movement direction in FREE_ROAM | `tests/gta-movement-controller.test.ts:TDD 6` | unit | PASS | `npm test` |
| 7 | Character does not rotate while idle in FREE_ROAM | `tests/gta-movement-controller.test.ts:TDD 7` | unit | PASS | `npm test` |
| 8 | Camera pitch does not affect movement Y | `tests/gta-movement-controller.test.ts:TDD 8` | unit | PASS | `npm test` |
| 9 | Rotating camera changes movement direction | `tests/gta-movement-controller.test.ts:TDD 9` | unit | PASS | `npm test` |
| 10 | Character faces camera yaw when AIMING is active | `tests/gta-movement-controller.test.ts:TDD 10` | unit | PASS | `npm test` |
| 11 | In AIMING: W moves forward while maintaining camera-facing rotation | `tests/gta-movement-controller.test.ts:TDD 11` | unit | PASS | `npm test` |
| 12 | In AIMING: S moves backward while maintaining camera-facing rotation | `tests/gta-movement-controller.test.ts:TDD 12` | unit | PASS | `npm test` |
| 13 | In AIMING: A strafes left while maintaining camera-facing rotation | `tests/gta-movement-controller.test.ts:TDD 13` | unit | PASS | `npm test` |
| 14 | In AIMING: D strafes right while maintaining camera-facing rotation | `tests/gta-movement-controller.test.ts:TDD 14` | unit | PASS | `npm test` |
| 15 | In AIMING: W+A diagonal strafe maintains camera facing | `tests/gta-movement-controller.test.ts:TDD 15` | unit | PASS | `npm test` |
| 16 | Character does not rotate toward movement direction while aiming | `tests/gta-movement-controller.test.ts:TDD 16` | unit | PASS | `npm test` |
| 17 | In AIMING: Rotating camera changes character facing | `tests/gta-movement-controller.test.ts:TDD 17` | unit | PASS | `npm test` |
| 18 | State transition: FREE_ROAM -> AIMING | `tests/gta-movement-controller.test.ts:TDD 18` | unit | PASS | `npm test` |
| 19 | State transition: AIMING -> FREE_ROAM | `tests/gta-movement-controller.test.ts:TDD 19` | unit | PASS | `npm test` |
| 20 | Keyboard movement overrides click-to-move | `tests/gta-movement-controller.test.ts:TDD 20` | unit | PASS | `npm test` |
| 21 | Movement remains frame-rate independent across delta times | `tests/gta-movement-controller.test.ts:TDD 21` | unit | PASS | `npm test` |
| 22 | Diagonal movement is normalized (not faster than cardinal) | `tests/gta-movement-controller.test.ts:TDD 22` | unit | PASS | `npm test` |
| 23 | Gravity works when airborne | `tests/gta-movement-controller.test.ts:TDD 23` | unit | PASS | `npm test` |
| 24 | Ground detection works correctly and clamps to surface | `tests/gta-movement-controller.test.ts:TDD 24` | unit | PASS | `npm test` |
| 25 | getCameraHorizontalVectors projects camera onto XZ plane and computes yaw | `tests/gta-movement-controller.test.ts:TDD 25` | unit | PASS | `npm test` |
| 26 | getCameraRelativeDirection converts input to normalized world direction | `tests/gta-movement-controller.test.ts:TDD 26` | unit | PASS | `npm test` |
| 27 | getAnimationData exposes blend tree data including speed, isAiming, and move axes | `tests/gta-movement-controller.test.ts:TDD 27` | unit | PASS | `npm test` |
