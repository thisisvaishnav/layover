# Graph Report - layover  (2026-09-25)

## Corpus Check
- 75 files · ~55,101 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 508 nodes · 920 edges · 27 communities (18 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16d57d15`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scene-builder.ts
- store.ts
- compilerOptions
- dependencies
- devDependencies
- Cafe3DWorld.tsx
- voice-agent/types.ts
- LAYOVER — Project Instructions
- Cafe3DScene
- LoadingScreen.tsx
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
- TDD Evidence Report: 3D Maps Game Transition Loading Screen
- TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection
- TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD
- city-scene.ts
- MAPLE HOLLOW MASTER SPECIFICATION (SINGLE SOURCE OF TRUTH)
- LAYOVER — Project Information & Comprehensive Architecture Guide

## God Nodes (most connected - your core abstractions)
1. `Cafe3DScene` - 29 edges
2. `useGameStore` - 22 edges
3. `VoiceAgentClient` - 18 edges
4. `CityScene` - 16 edges
5. `CitySubsystem` - 16 edges
6. `Traffic` - 16 edges
7. `compilerOptions` - 16 edges
8. `Park` - 15 edges
9. `Cafe3DWorld()` - 14 edges
10. `RoadNetwork` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Cafe3DScene` --references--> `CityScene`  [EXTRACTED]
  src/lib/world/scene-builder.ts → src/city/city-scene.ts
- `HeaderProps` --references--> `ConnectionStatus`  [EXTRACTED]
  src/components/navigation/Header.tsx → src/lib/voice-agent/types.ts
- `Header()` --calls--> `useGameStore`  [EXTRACTED]
  src/components/navigation/Header.tsx → src/lib/game/store.ts
- `VoiceControlsProps` --references--> `ConnectionStatus`  [EXTRACTED]
  src/components/voice/VoiceControls.tsx → src/lib/voice-agent/types.ts
- `Cafe3DWorld()` --calls--> `useGameStore`  [EXTRACTED]
  src/components/world/Cafe3DWorld.tsx → src/lib/game/store.ts

## Import Cycles
- None detected.

## Communities (27 total, 8 thin omitted)

### Community 0 - "scene-builder.ts"
Cohesion: 0.15
Nodes (26): MinimapHUD, MinimapHUDHandle, MinimapHUDProps, CAMERA_VIEW_CONFIG, CarSpec, computeCarPosition(), DAYLIGHT_CONFIG, EXPANDED_WORLD_BOUNDS (+18 more)

### Community 1 - "store.ts"
Cohesion: 0.12
Nodes (26): PlayGameContent(), FeedbackModal(), ObjectivesHUD(), OrderReceipt(), TranscriptHUD(), Header(), VoiceControls(), GameState (+18 more)

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
Nodes (32): Cafe3DWorld(), Cafe3DWorldProps, HotspotPrompt(), HotspotPromptProps, VocabularyModalProps, computeAvatarKinematics(), ControlsCallbacks, WorldControlsManager (+24 more)

### Community 6 - "voice-agent/types.ts"
Cohesion: 0.07
Nodes (30): HeaderProps, VoiceControlsProps, AudioQueuePlayer, base64ToInt16(), calculateRms(), float32ToInt16(), int16ToBase64(), int16ToFloat32() (+22 more)

### Community 7 - "LAYOVER — Project Instructions"
Cohesion: 0.17
Nodes (11): Build & Run, Code Style, Conventions, Critical Rules, Environment Variables, graphify, Key Patterns, LAYOVER — Project Instructions (+3 more)

### Community 9 - "LoadingScreen.tsx"
Cohesion: 0.07
Nodes (27): UnifiedFlowHomePage(), getLoadingScreenMetadata(), LOADING_STAGES, LoadingScreen(), LoadingScreenMetadata, LoadingScreenProps, LoadingStage, InteractiveLearningModal() (+19 more)

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "TDD Evidence Report: 3D Madrid Café Interactive World"
Cohesion: 0.25
Nodes (7): 1. User Journeys Covered, 2. TDD Execution Log, 3. Test Specification & Guarantees Table, 4. Build & Lint Verification, GREEN Phase, RED Phase, TDD Evidence Report: 3D Madrid Café Interactive World

### Community 19 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 21 - "TDD Evidence Report: 3D Maps Game Transition Loading Screen"
Cohesion: 0.33
Nodes (5): 1. Source Plan & Requirements, 2. User Journeys, 3. Task Report & Validation, 4. Test Specification, TDD Evidence Report: 3D Maps Game Transition Loading Screen

### Community 22 - "TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection"
Cohesion: 0.33
Nodes (5): 1. Source Plan & Requirements, 2. User Journeys, 3. Task Report & Validation, 4. Test Specification, TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection

### Community 23 - "TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD"
Cohesion: 0.29
Nodes (6): 1. Source & Intent, 2. User Journeys Covered, 3. Task Report & Execution Summary, 4. Test Specification, 5. Coverage and Quality, TDD Evidence Report: 3D Grand City Expansion, Traffic Boulevard, Daytime Atmosphere & Live Minimap HUD

### Community 24 - "city-scene.ts"
Cohesion: 0.05
Nodes (20): Buildings, CityScene, CityConfig, CitySubsystem, AvatarKinematics, computePedestrianKinematics(), Park, ActivePedestrian (+12 more)

### Community 25 - "MAPLE HOLLOW MASTER SPECIFICATION (SINGLE SOURCE OF TRUTH)"
Cohesion: 0.22
Nodes (8): 1. Core Principles, 2. City Layout, 3. Building Dimensions & Minimum Counts, 4. Bus Stops & Routes, 5. Road Cross-Section, 6. Traffic Specification, 7. Pedestrian Specification, MAPLE HOLLOW MASTER SPECIFICATION (SINGLE SOURCE OF TRUTH)

### Community 26 - "LAYOVER — Project Information & Comprehensive Architecture Guide"
Cohesion: 0.07
Nodes (29): 10. Summary of Key Achievements, 1. Executive Summary, 2. System Architecture & High-Level Flow, 3. Technology Stack & Key Dependencies, 4. Repository & Directory Structure, 5.1 AssemblyAI Voice Agent & Web Audio Pipeline, 5.2 Tool Calling & Game State Synchronization, 5.3 3D Interactive World & Kinematics Engine (+21 more)

## Knowledge Gaps
- **170 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CityScene` connect `city-scene.ts` to `scene-builder.ts`, `Cafe3DScene`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `Cafe3DScene` connect `Cafe3DScene` to `scene-builder.ts`, `city-scene.ts`, `Cafe3DWorld.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `useGameStore` connect `store.ts` to `Cafe3DWorld.tsx`, `voice-agent/types.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `scene-builder.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1497326203208556 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11585365853658537 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._