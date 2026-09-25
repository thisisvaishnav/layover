# Graph Report - layover  (2026-09-25)

## Corpus Check
- 33 files · ~23,874 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 233 nodes · 340 edges · 24 communities (14 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `473ea748`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scripts
- minimap-and-controls.test.ts
- compilerOptions
- dependencies
- devDependencies
- RetroAudioManager
- WorldCanvas.tsx
- LAYOVER — Project Instructions
- buildMapMeshes
- multilingual.ts
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- CameraController
- rules/graphify.md
- workflows/graphify.md
- GEMINI.md
- include
- README.md
- AGENTS.md
- TDD Evidence Report: Minimap + Player Control + Camera Polish
- TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection
- DestinationIndicator

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `WorldCanvas()` - 11 edges
3. `LAYOVER — Project Instructions` - 11 edges
4. `Vector2D` - 10 edges
5. `CameraController` - 9 edges
6. `RetroAudioManager` - 9 edges
7. `buildMapMeshes()` - 9 edges
8. `scripts` - 7 edges
9. `updatePlayerMovement()` - 7 edges
10. `updatePlayerKeyboard()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `WorldCanvas()` --calls--> `createCameraController()`  [EXTRACTED]
  src/components/map/WorldCanvas.tsx → src/camera/camera-controller.ts
- `WorldCanvas()` --calls--> `buildMapMeshes()`  [EXTRACTED]
  src/components/map/WorldCanvas.tsx → src/map/map-mesh-builder.ts
- `MinimapHUDProps` --references--> `GeneratedMap`  [EXTRACTED]
  src/components/map/MinimapHUD.tsx → src/map/map-generator.ts
- `MinimapHUDProps` --references--> `Vector2D`  [EXTRACTED]
  src/components/map/MinimapHUD.tsx → src/player/movement-controller.ts
- `MinimapHUD()` --calls--> `clampToMinimapCircle()`  [EXTRACTED]
  src/components/map/MinimapHUD.tsx → src/map/minimap-math.ts

## Import Cycles
- None detected.

## Communities (24 total, 10 thin omitted)

### Community 0 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 1 - "minimap-and-controls.test.ts"
Cohesion: 0.13
Nodes (23): CameraConfig, computeCameraElevation(), createCameraController(), DEFAULT_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE, MinimapHUD(), MinimapHUDProps (+15 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 3 - "dependencies"
Cohesion: 0.12
Nodes (17): canvas-confetti, lucide-react, next, dependencies, canvas-confetti, lucide-react, next, react (+9 more)

### Community 4 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 6 - "WorldCanvas.tsx"
Cohesion: 0.17
Nodes (21): WorldCanvas, WorldCanvas(), WorldCanvasProps, createDestinationIndicator(), createRaycastHandler(), RaycastHandler, generateMap(), ARRIVAL_THRESHOLD (+13 more)

### Community 7 - "LAYOVER — Project Instructions"
Cohesion: 0.17
Nodes (11): Build & Run, Code Style, Conventions, Critical Rules, Environment Variables, graphify, Key Patterns, LAYOVER — Project Instructions (+3 more)

### Community 8 - "buildMapMeshes"
Cohesion: 0.27
Nodes (7): PlotData, buildMapMeshes(), buildBuildingPlot(), buildParkPlot(), buildPortPlot(), regGeo(), MapMeshSystem

### Community 9 - "multilingual.ts"
Cohesion: 0.16
Nodes (12): retroAudio, DEFAULT_STARTING_PLACE, ONBOARDING_COUNTRIES, OnboardingCountry, BilingualDialogue, BilingualDialogueOptions, getBilingualDialogue(), LearnerLanguage (+4 more)

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 19 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 21 - "TDD Evidence Report: Minimap + Player Control + Camera Polish"
Cohesion: 0.40
Nodes (4): Source Plan & User Journeys, Task Report & Validation, TDD Evidence Report: Minimap + Player Control + Camera Polish, Test Specification & Guarantees

### Community 22 - "TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection"
Cohesion: 0.33
Nodes (5): 1. Source Plan & Requirements, 2. User Journeys, 3. Task Report & Validation, 4. Test Specification, TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection

## Knowledge Gaps
- **99 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+94 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `CameraController` connect `CameraController` to `minimap-and-controls.test.ts`, `WorldCanvas.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _99 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `minimap-and-controls.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13054187192118227 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._