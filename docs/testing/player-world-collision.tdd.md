# TDD Evidence Report: Solid World Collision (Shops, Street Lights, Cars & Walls)

**Date**: 2026-09-26
**Feature**: Player ↔ World Solid Collision & Wall Resistance
**Status**: GREEN (227 tests passing)

---

## 1. User Journeys & Acceptance Guarantees

### Journey 1: Shops Are Solid
- **As a** player walking through the city,
- **I want** the coffee shop, bus stand, taxi stand and barber shop to be solid volumes,
- **So that** I can never walk through a stall, shelter, counter or salon.

### Journey 2: Street Lights & Park Lamps Are Solid
- **As a** player moving along sidewalks and across the park,
- **I want** street lamps, traffic-light masts and park lamps to resist me,
- **So that** thin street furniture behaves like real poles instead of being ghost geometry.

### Journey 3: Cars Are Solid And Track Their Motion
- **As a** player crossing a road,
- **I want** every traffic car to block me at its current position,
- **So that** the collider follows the moving car instead of staying where it spawned.

### Journey 4: Walls Resist (No Pass-Through, No Walk-in-Place)
- **As a** player steering into a building wall with WASD or click-to-move,
- **I want** the wall to push me back (with normal wall sliding) and, for click-to-move, to cancel an unreachable destination,
- **So that** the character never sinks into geometry and never animates walking on the spot against a wall.

---

## 2. Architecture

| Layer | File | Responsibility |
|---|---|---|
| Collider math (pre-existing, previously unwired) | `src/player/movement-controller.ts:70-168` | `resolveCircleCollision`, `resolveBoxCollision`, `resolveCollisions` |
| Sub-stepped integration (new) | `src/player/movement-controller.ts` → `integrateHorizontal` | Moves in ≤0.35-unit steps so a 14 u/s frame cannot tunnel through a lamp pole or wall; push-outs accumulate into wall sliding |
| Click-to-move blocker (new) | `src/player/movement-controller.ts` → `updatePlayerMovement(..., obstacles?)` | Resolves after clamping; cancels the target when a solid obstacle makes it unreachable |
| Keyboard blocker (new) | `src/player/movement-controller.ts` → `updatePlayerMovementState(..., obstacles?)` | Resolves every frame; velocity is kept so the player keeps pushing (resist) without entering geometry |
| Collider factory + world registry (new) | `src/player/world-collision.ts` | `buildObstacleColliders()` turns world-space meshes/structures into 2D boxes; `PlayerCollisionWorld` caches static roots and rebuilds dynamic roots per frame |
| Static registration | `src/map/map-mesh-builder.ts` | Building meshes, street-lamp/traffic-light poles **and park lamp poles (newly added)** |
| Static registration (shops) | `src/components/map/WorldCanvas.tsx` | `coffeeShop.group`, `busStop.group`, `taxiStand.group`, `barberShop.group` |
| Dynamic registration | `src/components/map/WorldCanvas.tsx` | `trafficSystem.vehicles[].group`, refreshed once per frame before movement |

**Collider rules** (`src/player/world-collision.ts`):
- Loose mesh → own box (walls, poles, bench seats, car parts).
- Child group → one merged box so a shelter / building / taxi row blocks as a single solid volume (no walk-through gaps).
- Skipped: ground plates, curbs, tactile strips, lawns, footpaths, pads, stripes, borders, dividers, porches, tiles, shadows, NPC and highlight meshes (NPCs stay reachable).
- Meshes whose world height is below `0.35` are stepped over rather than blocked.

---

## 3. Test Execution & Evidence

### RED Gate Verification
- **Command**: `npx tsx --test tests/player-world-collision.test.ts`
- **Output**:
  ```
  Error: Cannot find module '../src/player/world-collision'
  code: 'ERR_TEST_FAILURE'
  # fail 1
  ```

### GREEN Gate Verification
- **Command**: `npm test`
- **Output**:
  ```
  1..227
  # tests 227
  # pass 227
  # fail 0
  ```

### Validation Commands
| Check | Command | Result |
|---|---|---|
| Unit/TDD tests | `npm test` | 227 pass / 0 fail |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Production build | `npm run build` | `✓ Compiled successfully`, static pages generated |

---

## 4. Test Specification & Guarantees

| # | What is guaranteed | Test File & Name | Result |
|---|---|---|---|
| 1 | A player inside solid geometry is pushed fully outside it and a crossing attempt stops at the near face | `tests/player-world-collision.test.ts:TDD [Solid Obstacle Resolution]` | PASS |
| 2 | Coffee shop, bus stand, taxi stand and barber shop cannot be walked through from either direction | `tests/player-world-collision.test.ts:TDD [Shop Colliders]` | PASS |
| 3 | Street lamps, traffic-light masts and park lamps block the player and keep it outside their radius | `tests/player-world-collision.test.ts:TDD [Street Light Colliders]` | PASS |
| 4 | Walking into a building never places the player inside the building footprint | `tests/player-world-collision.test.ts:TDD [Wall Resistance]` | PASS |
| 5 | Cars block the player and their colliders move with the car (old position is vacated) | `tests/player-world-collision.test.ts:TDD [Traffic Car Colliders]` | PASS |
| 6 | Keyboard movement is resisted by a wall instead of passing through it | `tests/player-world-collision.test.ts:TDD [Keyboard Wall Resistance]` | PASS |
| 7 | Click-to-move stops at the wall, cancels the unreachable target, and does not walk in place | `tests/player-world-collision.test.ts:TDD [Click-to-Move Wall Stop]` | PASS |
| 8 | Static map obstacles + shops + dynamic cars are tracked together and statics stay cached | `tests/player-world-collision.test.ts:TDD [Collision World]` | PASS |

---

## 5. Walkability Regression Evidence (measured, not asserted)

| Sample | Blocked |
|---|---|
| Road centerline samples (1210 pts) | **0.0%** |
| Sidewalk band 1–5 units outside plot edges (3192 pts) | **0.0%** |
| Park perimeter footpath (120 pts) | 5.0% (park benches / lamps — walk around them) |
| NPC reachability (best approach path, radius 12) | coffee 4.0, bus 3.2, taxi 0.0, barber 3.1 — all in range |
| Player spawn (park south edge) | not inside any collider |
| Cost of `refreshDynamic()` + `resolveCollisions()` over 841 colliders | 0.126 ms/frame |
