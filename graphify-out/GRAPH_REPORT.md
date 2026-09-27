# Graph Report - layover  (2026-09-27)

## Corpus Check
- 85 files · ~104,150 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 702 nodes · 1284 edges · 45 communities (32 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df182e64`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 1. User Journeys & Acceptance Guarantees
- coffee-shop-interaction.test.ts
- compilerOptions
- devDependencies
- mic-lifecycle.test.ts
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
- MinimapHUD.tsx
- TDD Evidence Report: GTA San Andreas Third-Person Movement Controller
- store.ts
- Frontend Design
- voice-protocol.test.ts
- format.ts
- WorldCanvas.tsx
- ConversationUI.tsx
- TDD Evidence Report: Solid World Collision (Shops, Street Lights, Cars & Walls)
- createBusStop
- createCoffeeShop
- ui-strings.ts
- multilingual.ts
- app/page.tsx
- Vector2D
- RetroAudioManager
- CameraController
- CursorAimIndicator
- DestinationIndicator
- barber-shop-scenario.ts

## God Nodes (most connected - your core abstractions)
1. `WorldCanvas()` - 33 edges
2. `createVoiceAgentClient()` - 22 edges
3. `buildMapMeshes()` - 20 edges
4. `Vector2D` - 16 edges
5. `compilerOptions` - 16 edges
6. `generateMap()` - 15 edges
7. `ConversationUI()` - 14 edges
8. `ConversationActions` - 14 edges
9. `updatePlayerMovementState()` - 14 edges
10. `createBarberShop()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `makeClient()` --calls--> `createVoiceAgentClient()`  [EXTRACTED]
  tests/voice-protocol.test.ts → src/lib/voice-agent/voice-agent-client.ts
- `walkThrough()` --calls--> `resolveCollisions()`  [EXTRACTED]
  tests/player-world-collision.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `updatePlayerMovement()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `selectMovementUpdate()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts
- `stepFrame()` --calls--> `updatePlayerMovementState()`  [EXTRACTED]
  tests/click-to-move-dispatch.test.ts → src/player/movement-controller.ts

## Import Cycles
- None detected.

## Communities (45 total, 11 thin omitted)

### Community 0 - "1. User Journeys & Acceptance Guarantees"
Cohesion: 0.18
Nodes (10): 1. User Journeys & Acceptance Guarantees, 2. Test Execution & Evidence, 3. Human-Readable Test Guarantees, GREEN Gate Verification, Journey 1: Visual Base Color & Aesthetic (Terracotta #B94A2F - #C65A3A), Journey 2: Procedural Tile Grid, Visible Seams & Variation, Journey 3: Road-Side Edge Safety Detailing (Yellow Tactile Strip), Journey 4: Seamless Layering & Full Walkability (+2 more)

### Community 1 - "coffee-shop-interaction.test.ts"
Cohesion: 0.13
Nodes (8): DISTRICT_PLACES, CoffeeShopScenario, BUS_STOP_SCENARIO, BUS_STOP_WORLD_POSITION, BusStopScenario, COFFEE_SHOP_ROTATION, COFFEE_SHOP_SCENARIO, COFFEE_SHOP_WORLD_POSITION

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (48): canvas-confetti, eslint, eslint-config-next, lucide-react, next, dependencies, canvas-confetti, lucide-react (+40 more)

### Community 4 - "mic-lifecycle.test.ts"
Cohesion: 0.10
Nodes (12): createMicrophoneCapture(), cleanup(), start(), stop(), stopTracks(), floatToPcm16(), MicrophoneCaptureOptions, NOTE: Do not pass sampleRate constraint to getUserMedia to prevent… (+4 more)

### Community 5 - "createVoiceAgentClient"
Cohesion: 0.07
Nodes (27): AgentUtterance, splitAgentUtterance(), MicrophoneCapture, AudioPlayback, AudioPlaybackOptions, createAudioPlayback(), getContext(), playChunk() (+19 more)

### Community 6 - "movement-controller.ts"
Cohesion: 0.06
Nodes (52): CharacterShowcase(), CharacterShowcaseProps, COUNTRY_GREETINGS, WorldCanvas(), retroAudio, ARRIVAL_THRESHOLD, BoxCollider, calculateRotation() (+44 more)

### Community 7 - "LAYOVER — Project Instructions"
Cohesion: 0.17
Nodes (11): Build & Run, Code Style, Conventions, Critical Rules, Environment Variables, graphify, Key Patterns, LAYOVER — Project Instructions (+3 more)

### Community 8 - "map-generator.ts"
Cohesion: 0.07
Nodes (40): buildCountryGenericBuilding(), buildCountryPlot00(), buildCountryPlot10(), buildCountryPlot12(), buildCountryRoof(), BuildingBuildContext, COUNTRY_BUILDING_PALETTES, CountryBuildingColors (+32 more)

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

### Community 23 - "MinimapHUD.tsx"
Cohesion: 0.06
Nodes (36): CameraConfig, computeCameraElevation(), createCameraController(), DEFAULT_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE, DEFAULT_PLAYER_POSITION, MinimapHUD() (+28 more)

### Community 24 - "TDD Evidence Report: GTA San Andreas Third-Person Movement Controller"
Cohesion: 0.40
Nodes (4): 1. Source Plan & Core Architecture, 2. Task Report & Validation, 3. Test Specification & Guarantees, TDD Evidence Report: GTA San Andreas Third-Person Movement Controller

### Community 25 - "store.ts"
Cohesion: 0.12
Nodes (5): ConversationStore, ConversationActions, ConversationMessage, ConversationState, ConversationStatus

### Community 26 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 29 - "voice-protocol.test.ts"
Cohesion: 0.09
Nodes (6): FakeAudioContext, FakeAudioNode, FakeWebSocket, makeClient(), Restore, SentMessage

### Community 30 - "format.ts"
Cohesion: 0.15
Nodes (19): BARBER_LINES_CACHE, buildGlossIndex(), findGloss(), findInNormalized(), getBarberLinesCached(), GLOSS_INDEX, GLOSSARY, GlossEntry (+11 more)

### Community 31 - "WorldCanvas.tsx"
Cohesion: 0.22
Nodes (7): WorldCanvas, InteractionPrompt(), InteractionPromptProps, WorldCanvasProps, createCursorAimIndicator(), createDestinationIndicator(), createRaycastHandler()

### Community 32 - "ConversationUI.tsx"
Cohesion: 0.18
Nodes (13): ConversationUI(), ConversationUIProps, findLastNpcMessage(), findLastUserMessage(), getMicCaption(), buildLessonLine(), useConversationStore, getConversationUiStrings() (+5 more)

### Community 33 - "TDD Evidence Report: Solid World Collision (Shops, Street Lights, Cars & Walls)"
Cohesion: 0.14
Nodes (13): 1. User Journeys & Acceptance Guarantees, 2. Architecture, 3. Test Execution & Evidence, 4. Test Specification & Guarantees, 5. Walkability Regression Evidence (measured, not asserted), GREEN Gate Verification, Journey 1: Shops Are Solid, Journey 2: Street Lights & Park Lamps Are Solid (+5 more)

### Community 34 - "createBusStop"
Cohesion: 0.15
Nodes (4): BusStopNPC, BusStopSystem, createBusStop(), isWithinBusStopRange()

### Community 35 - "createCoffeeShop"
Cohesion: 0.15
Nodes (4): CoffeeShopNPC, CoffeeShopSystem, createCoffeeShop(), isWithinInteractionRange()

### Community 36 - "ui-strings.ts"
Cohesion: 0.17
Nodes (11): CONVERSATION_UI_STRINGS, ConversationUiStrings, DE, EN, ES, FR, HI, IT (+3 more)

### Community 37 - "multilingual.ts"
Cohesion: 0.18
Nodes (10): BilingualDialogue, BilingualDialogueOptions, bilingualReplyRule(), LearnerLanguage, MultilingualScenarioConfig, PLACE_LABELS, PlaceInfo, ScenarioData (+2 more)

### Community 38 - "app/page.tsx"
Cohesion: 0.33
Nodes (7): OnboardingPage(), readStoredPref(), subscribePrefs(), writeStoredPref(), DEFAULT_STARTING_PLACE, ONBOARDING_COUNTRIES, OnboardingCountry

### Community 39 - "Vector2D"
Cohesion: 0.28
Nodes (6): MapPlacesDirectory(), MapPlacesDirectoryProps, PlacePOI, MinimapHUDProps, RaycastHandler, Vector2D

### Community 44 - "barber-shop-scenario.ts"
Cohesion: 0.50
Nodes (3): BARBER_SHOP_WORLD_POSITION, BarberShopScenarioConfig, DEFAULT_BARBER_SHOP_SCENARIO

## Knowledge Gaps
- **184 isolated node(s):** `Ground your designs in the subject matter`, `Design principles`, `Process: plan, review against the brief, build, critique`, `Restraint and self-critique`, `More on writing in design` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createVoiceAgentClient()` connect `createVoiceAgentClient` to `coffee-shop-interaction.test.ts`, `movement-controller.ts`, `multilingual-interaction.test.ts`, `voice-protocol.test.ts`, `WorldCanvas.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `WorldCanvas()` connect `movement-controller.ts` to `ConversationUI.tsx`, `createBusStop`, `createCoffeeShop`, `mic-lifecycle.test.ts`, `createVoiceAgentClient`, `map-generator.ts`, `createSunlightSystem`, `barber-shop.test.ts`, `MinimapHUD.tsx`, `WorldCanvas.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `WorldCanvas()` (e.g. with `.addDynamic()` and `.addStatic()`) actually correct?**
  _`WorldCanvas()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `createVoiceAgentClient()` (e.g. with `connect()` and `disconnect()`) actually correct?**
  _`createVoiceAgentClient()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Ground your designs in the subject matter`, `Design principles`, `Process: plan, review against the brief, build, critique` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `coffee-shop-interaction.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._