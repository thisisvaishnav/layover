# Graph Report - layover  (2026-09-25)

## Corpus Check
- 60 files · ~39,184 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 378 nodes · 682 edges · 24 communities (14 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7acf362d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scene-builder.ts
- store.ts
- compilerOptions
- dependencies
- devDependencies
- Cafe3DWorld.tsx
- client.ts
- LAYOVER — Project Instructions
- Cafe3DScene
- catalog.ts
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- rules/graphify.md
- workflows/graphify.md
- GEMINI.md
- TDD Evidence Report: 3D Madrid Café Interactive World
- README.md
- AGENTS.md
- RetroAudioManager
- TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection
- TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD

## God Nodes (most connected - your core abstractions)
1. `Cafe3DScene` - 28 edges
2. `useGameStore` - 22 edges
3. `VoiceAgentClient` - 18 edges
4. `compilerOptions` - 16 edges
5. `Cafe3DWorld()` - 14 edges
6. `Position3D` - 13 edges
7. `ConnectionStatus` - 11 edges
8. `WorldControlsManager` - 11 edges
9. `LAYOVER — Project Instructions` - 11 edges
10. `AudioQueuePlayer` - 10 edges

## Surprising Connections (you probably didn't know these)
- `StreetLampSpec` --references--> `Position3D`  [EXTRACTED]
  src/lib/world/city-expansion.ts → src/lib/world/types.ts
- `TrafficLightSpec` --references--> `Position3D`  [EXTRACTED]
  src/lib/world/city-expansion.ts → src/lib/world/types.ts
- `CafeSceneHooks` --references--> `Position3D`  [EXTRACTED]
  src/lib/world/scene-builder.ts → src/lib/world/types.ts
- `DistrictBlockSpec` --references--> `AABB`  [EXTRACTED]
  src/lib/world/town-park-expansion.ts → src/lib/world/types.ts
- `HeaderProps` --references--> `ConnectionStatus`  [EXTRACTED]
  src/components/navigation/Header.tsx → src/lib/voice-agent/types.ts

## Import Cycles
- None detected.

## Communities (24 total, 9 thin omitted)

### Community 0 - "scene-builder.ts"
Cohesion: 0.16
Nodes (25): MinimapHUD, MinimapHUDProps, CAMERA_VIEW_CONFIG, CarSpec, computeCarPosition(), DAYLIGHT_CONFIG, EXPANDED_WORLD_BOUNDS, ROAD_SYSTEM_CONFIG (+17 more)

### Community 1 - "store.ts"
Cohesion: 0.08
Nodes (40): PlayGameContent(), FeedbackModal(), ObjectivesHUD(), OrderReceipt(), TranscriptHUD(), Header(), HeaderProps, VoiceControls() (+32 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (27): canvas-confetti, lucide-react, next, dependencies, canvas-confetti, lucide-react, next, react (+19 more)

### Community 4 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 5 - "Cafe3DWorld.tsx"
Cohesion: 0.08
Nodes (34): Cafe3DWorld(), Cafe3DWorldProps, HotspotPrompt(), HotspotPromptProps, MinimapHUDHandle, VocabularyModalProps, AvatarKinematics, computeAvatarKinematics() (+26 more)

### Community 6 - "client.ts"
Cohesion: 0.11
Nodes (16): AudioQueuePlayer, base64ToInt16(), calculateRms(), float32ToInt16(), int16ToBase64(), int16ToFloat32(), resampleAudio(), TARGET_SAMPLE_RATE (+8 more)

### Community 7 - "LAYOVER — Project Instructions"
Cohesion: 0.17
Nodes (11): Build & Run, Code Style, Conventions, Critical Rules, Environment Variables, graphify, Key Patterns, LAYOVER — Project Instructions (+3 more)

### Community 9 - "catalog.ts"
Cohesion: 0.10
Nodes (22): UnifiedFlowHomePage(), CATEGORY_TABS, PLACE_3D_PERKS, InteractiveLearningModal(), InteractiveLearningModalProps, retroAudio, DEFAULT_STARTING_PLACE, DestinationOption (+14 more)

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "TDD Evidence Report: 3D Madrid Café Interactive World"
Cohesion: 0.25
Nodes (7): 1. User Journeys Covered, 2. TDD Execution Log, 3. Test Specification & Guarantees Table, 4. Build & Lint Verification, GREEN Phase, RED Phase, TDD Evidence Report: 3D Madrid Café Interactive World

### Community 19 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 22 - "TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection"
Cohesion: 0.33
Nodes (5): 1. Source Plan & Requirements, 2. User Journeys, 3. Task Report & Validation, 4. Test Specification, TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection

### Community 23 - "TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD"
Cohesion: 0.29
Nodes (6): 1. Source & Intent, 2. User Journeys Covered, 3. Task Report & Execution Summary, 4. Test Specification, 5. Coverage and Quality, TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD

## Knowledge Gaps
- **130 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 154 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useGameStore` connect `store.ts` to `Cafe3DWorld.tsx`, `client.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Cafe3DScene` connect `Cafe3DScene` to `scene-builder.ts`, `Cafe3DWorld.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Cafe3DWorld()` connect `Cafe3DWorld.tsx` to `Cafe3DScene`, `store.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Cafe3DWorld()` (e.g. with `.destroy()` and `.getState()`) actually correct?**
  _`Cafe3DWorld()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0803633822501747 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._