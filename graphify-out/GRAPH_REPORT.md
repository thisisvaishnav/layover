# Graph Report - layover  (2026-09-26)

## Corpus Check
- 79 files · ~99,410 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 563 nodes · 1006 edges · 30 communities (22 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f2b9ed6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 1. User Journeys & Acceptance Guarantees
- coffee-shop-interaction.test.ts
- compilerOptions
- dependencies
- devDependencies
- createVoiceAgentClient
- movement-controller.ts
- LAYOVER — Project Instructions
- map-generator.ts
- createSunlightSystem
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- barber-shop.test.ts
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
- ConversationUI.tsx
- Frontend Design
- multilingual-interaction.test.ts
- WorldCanvas.tsx

## God Nodes (most connected - your core abstractions)
1. `WorldCanvas()` - 28 edges
2. `buildMapMeshes()` - 19 edges
3. `Vector2D` - 16 edges
4. `compilerOptions` - 16 edges
5. `ConversationActions` - 14 edges
6. `updatePlayerMovementState()` - 13 edges
7. `createVoiceAgentClient()` - 13 edges
8. `generateMap()` - 13 edges
9. `createBarberShop()` - 12 edges
10. `createSunlightSystem()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `stepFrame()` --calls--> `selectMovementUpdate()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `updatePlayerMovement()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `updatePlayerMovementState()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `WorldCanvas()` --calls--> `createCameraController()`  [EXTRACTED]
  src/components/map/WorldCanvas.tsx → src/camera/camera-controller.ts
- `WorldCanvas()` --calls--> `createBarberShop()`  [EXTRACTED]
  src/components/map/WorldCanvas.tsx → src/interaction/barber-shop.ts

## Import Cycles
- None detected.

## Communities (30 total, 7 thin omitted)

### Community 0 - "1. User Journeys & Acceptance Guarantees"
Cohesion: 0.18
Nodes (10): 1. User Journeys & Acceptance Guarantees, 2. Test Execution & Evidence, 3. Human-Readable Test Guarantees, GREEN Gate Verification, Journey 1: Visual Base Color & Aesthetic (Terracotta #B94A2F - #C65A3A), Journey 2: Procedural Tile Grid, Visible Seams & Variation, Journey 3: Road-Side Edge Safety Detailing (Yellow Tactile Strip), Journey 4: Seamless Layering & Full Walkability (+2 more)

### Community 1 - "coffee-shop-interaction.test.ts"
Cohesion: 0.06
Nodes (33): CameraConfig, CameraController, computeCameraElevation(), createCameraController(), DEFAULT_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE, DISTRICT_PLACES (+25 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (27): canvas-confetti, lucide-react, next, dependencies, canvas-confetti, lucide-react, next, react (+19 more)

### Community 4 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 5 - "createVoiceAgentClient"
Cohesion: 0.11
Nodes (15): createMicrophoneCapture(), cleanup(), start(), stop(), floatToPcm16(), MicrophoneCapture, MicrophoneCaptureOptions, NOTE: Do not pass sampleRate constraint to getUserMedia to prevent… (+7 more)

### Community 6 - "movement-controller.ts"
Cohesion: 0.07
Nodes (42): CharacterShowcase(), CharacterShowcaseProps, COUNTRY_GREETINGS, retroAudio, RetroAudioManager, ARRIVAL_THRESHOLD, BoxCollider, calculateRotation() (+34 more)

### Community 7 - "LAYOVER — Project Instructions"
Cohesion: 0.17
Nodes (11): Build & Run, Code Style, Conventions, Critical Rules, Environment Variables, graphify, Key Patterns, LAYOVER — Project Instructions (+3 more)

### Community 8 - "map-generator.ts"
Cohesion: 0.09
Nodes (37): buildCountryGenericBuilding(), buildCountryPlot00(), buildCountryPlot10(), buildCountryPlot12(), buildCountryRoof(), BuildingBuildContext, COUNTRY_BUILDING_PALETTES, CountryBuildingColors (+29 more)

### Community 9 - "createSunlightSystem"
Cohesion: 0.18
Nodes (8): createSunCoronaTexture(), createSunlightSystem(), createSunMoteTexture(), createSunRayTexture(), DEFAULT_SUN_COLOR, DEFAULT_SUN_POSITION, SunlightConfig, SunlightSystem

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 14 - "barber-shop.test.ts"
Cohesion: 0.20
Nodes (8): BarberShopOptions, BarberShopSystem, createBarberPoleTexture(), createBarberShop(), createBarberSignTexture(), getBarberSalonHeading(), getBarberSalonSubHeading(), isWithinBarberShopRange()

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
Nodes (19): createTaxiStand(), isWithinTaxiStandRange(), TaxiStandOptions, TaxiStandSystem, buildRoadCarModel(), BuiltCar, RoadCarOptions, MapBounds (+11 more)

### Community 24 - "TDD Evidence Report: GTA San Andreas Third-Person Movement Controller"
Cohesion: 0.40
Nodes (4): 1. Source Plan & Core Architecture, 2. Task Report & Validation, 3. Test Specification & Guarantees, TDD Evidence Report: GTA San Andreas Third-Person Movement Controller

### Community 25 - "ConversationUI.tsx"
Cohesion: 0.05
Nodes (18): ConversationUI(), ConversationUIProps, getVoiceStatusContent(), StatusContent, VoiceStatusBar(), ConversationStore, ConversationActions, ConversationMessage (+10 more)

### Community 26 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 28 - "multilingual-interaction.test.ts"
Cohesion: 0.10
Nodes (11): DEFAULT_STARTING_PLACE, ONBOARDING_COUNTRIES, OnboardingCountry, BilingualDialogue, BilingualDialogueOptions, LearnerLanguage, MultilingualScenarioConfig, ScenarioData (+3 more)

### Community 31 - "WorldCanvas.tsx"
Cohesion: 0.05
Nodes (23): WorldCanvas, InteractionPrompt(), InteractionPromptProps, WorldCanvas(), WorldCanvasProps, BusStopNPC, BusStopSystem, createBusStop() (+15 more)

## Knowledge Gaps
- **151 isolated node(s):** `WorldCanvasProps`, `Vector3D`, `MovementState`, `MovementMode`, `MovementConfig` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 278 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createVoiceAgentClient()` connect `createVoiceAgentClient` to `ConversationUI.tsx`, `multilingual-interaction.test.ts`, `coffee-shop-interaction.test.ts`, `WorldCanvas.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `buildMapMeshes()` connect `map-generator.ts` to `taxi-stand-and-parking.test.ts`, `movement-controller.ts`, `WorldCanvas.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `WorldCanvasProps`, `Vector3D`, `MovementState` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `coffee-shop-interaction.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05683060109289618 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._