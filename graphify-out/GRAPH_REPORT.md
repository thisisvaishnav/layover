# Graph Report - layover  (2026-09-23)

## Corpus Check
- Corpus is ~18,152 words - fits in a single context window. You may not need a graph.

## Summary
- 246 nodes · 445 edges · 15 communities (10 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13

## God Nodes (most connected - your core abstractions)
1. `useGameStore` - 22 edges
2. `Cafe3DScene` - 20 edges
3. `VoiceAgentClient` - 18 edges
4. `compilerOptions` - 16 edges
5. `Cafe3DWorld()` - 12 edges
6. `ConnectionStatus` - 11 edges
7. `WorldControlsManager` - 11 edges
8. `AudioQueuePlayer` - 10 edges
9. `GameState` - 8 edges
10. `Hotspot` - 8 edges

## Surprising Connections (you probably didn't know these)
- `HeaderProps` --references--> `ConnectionStatus`  [EXTRACTED]
  src/components/navigation/Header.tsx → src/lib/voice-agent/types.ts
- `Header()` --calls--> `useGameStore`  [EXTRACTED]
  src/components/navigation/Header.tsx → src/lib/game/store.ts
- `VoiceControlsProps` --references--> `ConnectionStatus`  [EXTRACTED]
  src/components/voice/VoiceControls.tsx → src/lib/voice-agent/types.ts
- `Cafe3DWorld()` --calls--> `useGameStore`  [EXTRACTED]
  src/components/world/Cafe3DWorld.tsx → src/lib/game/store.ts
- `Cafe3DWorld()` --calls--> `Cafe3DScene`  [EXTRACTED]
  src/components/world/Cafe3DWorld.tsx → src/lib/world/scene-builder.ts

## Import Cycles
- None detected.

## Communities (15 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (21): Cafe3DWorld(), Cafe3DWorldProps, HotspotPrompt(), HotspotPromptProps, VocabularyModal(), VocabularyModalProps, ControlsCallbacks, WorldControlsManager (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (23): PlayGameContent(), FeedbackModal(), ObjectivesHUD(), OrderReceipt(), TranscriptHUD(), Header(), VoiceControls(), GameState (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (27): canvas-confetti, lucide-react, next, dependencies, canvas-confetti, lucide-react, next, react (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (8): HeaderProps, VoiceControlsProps, handleToolCall(), ToolCallPayload, ToolResult, VoiceAgentClient, VoiceAgentClientOptions, ConnectionStatus

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (8): AudioQueuePlayer, base64ToInt16(), calculateRms(), float32ToInt16(), int16ToBase64(), int16ToFloat32(), resampleAudio(), TARGET_SAMPLE_RATE

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): ClientEvent, InputAudioEvent, ReplyAudioEvent, ReplyDoneEvent, ServerEvent, SessionEndedEvent, SessionEndEvent, SessionErrorEvent (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.39
Nodes (5): DashboardPage(), DestinationOption, DESTINATIONS, LanguageOption, LANGUAGES

### Community 10 - "Community 10"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **78 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 90 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useGameStore` connect `Community 1` to `Community 0`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `Cafe3DScene` connect `Community 8` to `Community 0`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `Cafe3DWorld()` connect `Community 0` to `Community 8`, `Community 1`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Cafe3DWorld()` (e.g. with `.destroy()` and `.getState()`) actually correct?**
  _`Cafe3DWorld()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12685560053981107 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._