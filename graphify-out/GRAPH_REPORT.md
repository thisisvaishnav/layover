# Graph Report - layover  (2026-09-29)

## Corpus Check
- 82 files · ~93,498 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 595 nodes · 1104 edges · 39 communities (27 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4eaafcb2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 1. User Journeys & Acceptance Guarantees
- coffee-shop-interaction.test.ts
- compilerOptions
- dependencies
- devDependencies
- world-collision.ts
- movement-controller.ts
- LAYOVER — Project Instructions
- map-generator.ts
- createSunlightSystem
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- DestinationIndicator
- rules/graphify.md
- workflows/graphify.md
- GEMINI.md
- 2. Test Execution & Evidence
- README.md
- AGENTS.md
- TDD Evidence Report: Minimap + Player Control + Camera Polish
- TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection
- taxi-stand-and-parking.test.ts
- TDD Evidence Report: GTA San Andreas Third-Person Movement Controller
- map/page.tsx
- Frontend Design
- MinimapHUD.tsx
- feedback.ts
- multilingual.ts
- WorldCanvas.tsx
- TDD Evidence Report: Solid World Collision (Shops, Street Lights, Cars & Walls)
- createBusStop
- createCoffeeShop
- speak.ts
- Vector2D
- RetroAudioManager
- CameraController
- CursorAimIndicator

## God Nodes (most connected - your core abstractions)
1. `WorldCanvas()` - 30 edges
2. `buildMapMeshes()` - 20 edges
3. `Vector2D` - 16 edges
4. `compilerOptions` - 16 edges
5. `generateMap()` - 15 edges
6. `updatePlayerMovementState()` - 14 edges
7. `createBarberShop()` - 13 edges
8. `ConversationActions` - 13 edges
9. `PlayerCollisionWorld` - 13 edges
10. `createSunlightSystem()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `walkThrough()` --calls--> `resolveCollisions()`  [EXTRACTED]
  tests/player-world-collision.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `selectMovementUpdate()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `updatePlayerMovement()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `updatePlayerMovementState()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `WorldCanvas()` --calls--> `createCameraController()`  [EXTRACTED]
  src/components/map/WorldCanvas.tsx → src/camera/camera-controller.ts

## Import Cycles
- None detected.

## Communities (39 total, 12 thin omitted)

### Community 0 - "1. User Journeys & Acceptance Guarantees"
Cohesion: 0.18
Nodes (10): 1. User Journeys & Acceptance Guarantees, 2. Test Execution & Evidence, 3. Human-Readable Test Guarantees, GREEN Gate Verification, Journey 1: Visual Base Color & Aesthetic (Terracotta #B94A2F - #C65A3A), Journey 2: Procedural Tile Grid, Visible Seams & Variation, Journey 3: Road-Side Edge Safety Detailing (Yellow Tactile Strip), Journey 4: Seamless Layering & Full Walkability (+2 more)

### Community 1 - "coffee-shop-interaction.test.ts"
Cohesion: 0.47
Nodes (3): BUS_STOP_SCENARIO, BUS_STOP_WORLD_POSITION, BusStopScenario

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (27): canvas-confetti, lucide-react, next, dependencies, canvas-confetti, lucide-react, next, react (+19 more)

### Community 4 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 5 - "world-collision.ts"
Cohesion: 0.22
Nodes (8): ObstacleCollider, boxOfObject(), buildObstacleColliders(), collectMeshes(), isNonBlockingName(), PlayerCollisionWorld, toBoxCollider(), unionBoxOf()

### Community 6 - "movement-controller.ts"
Cohesion: 0.08
Nodes (42): CharacterShowcase(), CharacterShowcaseProps, COUNTRY_GREETINGS, retroAudio, ARRIVAL_THRESHOLD, BoxCollider, calculateRotation(), CircleCollider (+34 more)

### Community 7 - "LAYOVER — Project Instructions"
Cohesion: 0.17
Nodes (11): Build & Run, Code Style, Conventions, Critical Rules, Environment Variables, graphify, Key Patterns, LAYOVER — Project Instructions (+3 more)

### Community 8 - "map-generator.ts"
Cohesion: 0.08
Nodes (38): buildCountryGenericBuilding(), buildCountryPlot00(), buildCountryPlot10(), buildCountryPlot12(), buildCountryRoof(), BuildingBuildContext, COUNTRY_BUILDING_PALETTES, CountryBuildingColors (+30 more)

### Community 9 - "createSunlightSystem"
Cohesion: 0.18
Nodes (8): createSunCoronaTexture(), createSunlightSystem(), createSunMoteTexture(), createSunRayTexture(), DEFAULT_SUN_COLOR, DEFAULT_SUN_POSITION, SunlightConfig, SunlightSystem

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "2. Test Execution & Evidence"
Cohesion: 0.29
Nodes (6): 1. User Journeys, 2. Test Execution & Evidence, TDD Evidence Report: Mouse-Direction Player Movement, Test Guarantees & Specification, Test Runner, Test Suite Summary

### Community 19 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 21 - "TDD Evidence Report: Minimap + Player Control + Camera Polish"
Cohesion: 0.40
Nodes (4): Source Plan & User Journeys, Task Report & Validation, TDD Evidence Report: Minimap + Player Control + Camera Polish, Test Specification & Guarantees

### Community 22 - "TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection"
Cohesion: 0.33
Nodes (5): 1. Source Plan & Requirements, 2. User Journeys, 3. Task Report & Validation, 4. Test Specification, TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection

### Community 23 - "taxi-stand-and-parking.test.ts"
Cohesion: 0.08
Nodes (19): createTaxiStand(), TaxiStandOptions, TaxiStandSystem, buildRoadCarModel(), BuiltCar, RoadCarOptions, MapBounds, RoadData (+11 more)

### Community 24 - "TDD Evidence Report: GTA San Andreas Third-Person Movement Controller"
Cohesion: 0.40
Nodes (4): 1. Source Plan & Core Architecture, 2. Task Report & Validation, 3. Test Specification & Guarantees, TDD Evidence Report: GTA San Andreas Third-Person Movement Controller

### Community 26 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 28 - "MinimapHUD.tsx"
Cohesion: 0.09
Nodes (28): CameraConfig, computeCameraElevation(), createCameraController(), DEFAULT_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE, DEFAULT_PLAYER_POSITION, MinimapHUD() (+20 more)

### Community 29 - "feedback.ts"
Cohesion: 0.07
Nodes (23): evaluateReply(), isCharLevelCandidate(), isNearMiss(), lcsPairs(), levenshtein(), mustRetry(), PathResult, ReplyFeedback (+15 more)

### Community 30 - "multilingual.ts"
Cohesion: 0.06
Nodes (49): OnboardingPage(), readStoredPref(), subscribePrefs(), writeStoredPref(), tokenize(), BARBER_LINES_CACHE, buildGlossIndex(), buildLessonLine() (+41 more)

### Community 31 - "WorldCanvas.tsx"
Cohesion: 0.23
Nodes (13): InteractionPrompt(), InteractionPromptProps, WorldCanvas(), WorldCanvasProps, isWithinBusStopRange(), isWithinInteractionRange(), createCursorAimIndicator(), createDestinationIndicator() (+5 more)

### Community 33 - "TDD Evidence Report: Solid World Collision (Shops, Street Lights, Cars & Walls)"
Cohesion: 0.14
Nodes (13): 1. User Journeys & Acceptance Guarantees, 2. Architecture, 3. Test Execution & Evidence, 4. Test Specification & Guarantees, 5. Walkability Regression Evidence (measured, not asserted), GREEN Gate Verification, Journey 1: Shops Are Solid, Journey 2: Street Lights & Park Lamps Are Solid (+5 more)

### Community 34 - "createBusStop"
Cohesion: 0.17
Nodes (3): BusStopNPC, BusStopSystem, createBusStop()

### Community 35 - "createCoffeeShop"
Cohesion: 0.17
Nodes (3): CoffeeShopNPC, CoffeeShopSystem, createCoffeeShop()

### Community 37 - "speak.ts"
Cohesion: 0.36
Nodes (10): cachedVoices, cancelPendingSpeak(), handleVoicesChanged(), isSpeechSupported(), LANG_TAGS, loadVoices(), pickVoice(), speakPhrase() (+2 more)

### Community 39 - "Vector2D"
Cohesion: 0.27
Nodes (7): DISTRICT_PLACES, MapPlacesDirectory(), MapPlacesDirectoryProps, PlacePOI, MinimapHUDProps, RaycastHandler, Vector2D

## Knowledge Gaps
- **181 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 281 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildMapMeshes()` connect `map-generator.ts` to `taxi-stand-and-parking.test.ts`, `movement-controller.ts`, `WorldCanvas.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `RetroAudioManager` connect `RetroAudioManager` to `movement-controller.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `WorldCanvas()` (e.g. with `.addDynamic()` and `.addStatic()`) actually correct?**
  _`WorldCanvas()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._