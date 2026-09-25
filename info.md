# LAYOVER — Project Information & Comprehensive Architecture Guide

> **Project Name:** Layover  
> **Repository:** `thisisvaishnav/layover`  
> **Primary Purpose:** Voice-Controlled Travel Language Simulator & 3D Walkable Urban World  
> **Hackathon:** AssemblyAI Voice Agent Hackathon (September 2026)  
> **Status:** Production-Ready & Tested (44/44 Unit & Integration Tests Passing)  

---

## 1. Executive Summary

**Layover** is an immersive, voice-first travel language learning simulation web application. It combines **AssemblyAI's Voice Agent API** (low-latency bidirectional WebSocket streaming, natural voice interaction, and server-side function/tool calling) with a **custom Three.js 3D open-world engine** and an **autonomous city simulation** (the *Maple Hollow* urban specification).

Instead of traditional flashcards or multiple-choice quizzes, Layover places learners into real-world travel scenarios (such as Madrid's *Café de la Luna*, a municipal transit bus stop, or an international airport terminal). Learners speak naturally using their voice, receive real-time spoken responses from virtual NPCs with lip and limb animations, order food or tickets, solve unexpected travel mishaps (such as out-of-stock items or transit delays), and view live receipts and fluency evaluations.

The application features:
1. **Live Bidirectional Voice AI:** Low-latency 24kHz/16kHz streaming with push-to-talk, barge-in (interruption) handling, and transactional state rollbacks.
2. **Interactive 3D Walkable Plaza:** Third-person over-the-shoulder chase camera, WASD/arrow keyboard movement, circle-to-AABB collision boundaries, and proximity hotspots.
3. **Maple Hollow City Simulation:** A 2000m × 2000m procedural city layout with concentric ring roads, radial boulevards, 150 active vehicles with follow-gap logic, 30 animated pedestrians with human locomotion kinematics, 110+ instanced bus shelters, and a central park.
4. **Multilingual Scaffolding:** Comprehensive target-to-native language learning matrices supporting languages like Spanish, Hindi, Japanese, French, German, and Italian, complete with phonetic romanization and contextual prompts.
5. **Zero-API-Key Simulator Mode:** Intelligent fallback mode that enables developers and evaluators to run, test, and experience the complete game flow without an AssemblyAI API key.
6. **Zero-Dependency 8-Bit Retro Audio Engine:** Pure Web Audio API synthesizer generating Mario-inspired sound effects (coins, 1-ups, warps, selections) without external audio asset bloat.

---

## 2. System Architecture & High-Level Flow

```mermaid
flowchart TD
    subgraph Client ["Client Browser (Next.js 16 + React 19)"]
        UI["Page UI & Onboarding (/ & /play)"]
        Canvas3D["Three.js 3D WebGL Canvas\n(Cafe3DScene & CityScene)"]
        Minimap["MinimapHUD (2D Canvas Radar)"]
        ZStore["Zustand Game Store (useGameStore)"]
        RetroAudio["RetroAudioManager (Web Audio Synth)"]
        
        subgraph AudioPipeline ["Voice & Audio Pipeline"]
            Mic["Microphone Input (MediaStream)"]
            PCM["PCM Audio Processor (ScriptProcessorNode)\nFloat32 <-> Int16 / Resample to 16-24kHz"]
            Speaker["AudioQueuePlayer (Web Audio API)"]
        end
    end

    subgraph BackendAPI ["Next.js Server API Routes"]
        TokenRoute["/api/assemblyai/token (POST)"]
    end

    subgraph AssemblyAI ["AssemblyAI Cloud"]
        LiveWS["AssemblyAI Voice Agent WebSocket\n(wss://agents.assemblyai.com/v1/ws)"]
        LLMToolCaller["Voice Agent Engine & Tool Calling"]
    end

    %% Audio & Voice Flows
    Mic -->|Raw Audio| PCM
    PCM -->|Base64 PCM16| LiveWS
    LiveWS -->|Streaming Audio Chunks| Speaker
    TokenRoute -->|Ephemeral Token| Client
    LiveWS <-->|Session Config & Barge-in| Client

    %% Tool Call Flow
    LiveWS -->|Tool Calls: order_item, modify_order...| ZStore
    ZStore -->|State: order, baristaAction, objectives| Canvas3D
    ZStore -->|HUD Updates: Receipt, Objectives, Transcripts| UI

    %% 3D World & Simulation Flow
    Canvas3D -->|Pos & Heading (60fps)| Minimap
    Canvas3D <-->|Proximity & Hotspots| ZStore
    RetroAudio -.->|Chimes & Sound FX| UI
```

---

## 3. Technology Stack & Key Dependencies

| Layer | Technology | Version | Purpose / Role |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) | `16.3.6` (App Router) | React server/client orchestration, fast routing, static/dynamic asset serving |
| **UI Library** | [React](https://react.dev/) & React DOM | `19.2.8` | Component rendering, state binding, hooks |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5.0` (Strict Mode) | Full-stack end-to-end type safety across stores, events, and 3D math |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.0` with PostCSS | Minimalist 2-color aesthetic, high-contrast HUD components, responsive layout |
| **3D Engine** | [Three.js](https://threejs.org/) | `^0.186.0` | Imperative OOP 3D scene graph, WebGL rendering, custom materials, instanced meshes |
| **State Management**| [Zustand](https://github.com/pmndrs/zustand) | `^5.0.15` | Immutable game state, dialogue history, barista emotions, objectives, orders |
| **Voice AI API** | [AssemblyAI Voice Agent API](https://www.assemblyai.com/) | v1 WebSocket | Real-time speech recognition, LLM dialogue reasoning, tool calling, text-to-speech |
| **Audio Synthesizer**| Web Audio API | Native Browser | Custom PCM manipulation, resamplers, and retro chimes without external audio assets |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.47.0` | Modern, clean vector iconography |
| **Visual Effects** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) | `^1.9.4` | Particle celebration upon mission completion |
| **Test Runner** | [tsx](https://github.com/privatenumber/tsx) / Node Test | `^4.23.15` | Fast native TypeScript test runner for unit and integration testing |
| **Knowledge Graph** | Graphify | AST Engine | AST-based structural code analysis, god node identification, and token reduction |

---

## 4. Repository & Directory Structure

```
layover/
├── .agents/                      # Agent rules, workflows, and graphify configuration
├── city-config.json              # Single source of truth for Maple Hollow city simulation
├── MAPLE_HOLLOW_SPEC.md          # Formal engineering specification for the 3D urban world
├── CLAUDE.md / GEMINI.md         # Assistant guidelines and knowledge graph instructions
├── package.json                  # Dependencies, scripts, and build metadata
├── tsconfig.json                 # TypeScript compiler options (strict, ESNext, Next.js plugins)
├── graphify-out/                 # Graphify knowledge graph (graph.json, GRAPH_REPORT.md, manifest)
│
├── docs/                         # Project documentation and specifications
│   └── testing/                  # TDD execution evidence and test reports
│       ├── 3d-world.tdd.md       # Madrid Café 3D world test report
│       ├── city-expansion.tdd.md # City boulevard and minimap radar test report
│       └── onboarding.tdd.md     # Two-color onboarding and multilingual test report
│
├── public/                       # Static web assets
│   ├── favicon.ico
│   └── ...
│
├── src/                          # Application source code
│   ├── app/                      # Next.js App Router routes & pages
│   │   ├── api/assemblyai/token/ # Ephemeral token generation route for AssemblyAI WebSocket
│   │   ├── dashboard/            # Alias route pointing to main onboarding
│   │   ├── play/                 # Full-screen 3D interactive simulation & HUD (/play)
│   │   ├── globals.css           # Tailwind CSS imports and utility layers
│   │   ├── layout.tsx            # Global layout with Geist typography
│   │   └── page.tsx              # Minimalist two-color onboarding & country picker (/)
│   │
│   ├── components/               # React UI and HUD components
│   │   ├── hud/                  # Game HUD overlays
│   │   │   ├── FeedbackModal.tsx # End-of-mission fluency scorecard with confetti
│   │   │   ├── ObjectivesHUD.tsx # Stage quest checklist with native/target hints
│   │   │   ├── OrderReceipt.tsx  # Dynamic itemized billing ticket
│   │   │   └── TranscriptHUD.tsx # Live chat transcript with translation toggles
│   │   ├── navigation/
│   │   │   └── Header.tsx        # Top status navigation bar with connection indicator
│   │   ├── voice/
│   │   │   └── VoiceControls.tsx # Push-to-talk dock, mute, level meter, and simulation controls
│   │   └── world/
│   │       ├── Cafe3DWorld.tsx   # 3D canvas mount, movement loop, and input manager
│   │       ├── HotspotPrompt.tsx # In-world floating interaction pill ("Press E to talk")
│   │       ├── InteractiveLearningModal.tsx # Step-by-step dialogue modal with translations
│   │       ├── MinimapHUD.tsx    # 60fps 2D radar HUD with districts, roads, and traffic
│   │       └── VocabularyModal.tsx # Dedicated reference glossary modal
│   │
│   ├── lib/                      # Core business logic, engine, and utilities
│   │   ├── audio/
│   │   │   ├── pcm.ts            # Float32/Int16 PCM conversion, resampling, Base64, and RMS
│   │   │   └── retro-audio.ts    # Web Audio retro sound effects synthesizer
│   │   ├── game/
│   │   │   ├── store.ts          # Zustand master state store (useGameStore)
│   │   │   ├── tool-handler.ts   # Maps AssemblyAI function calls to game state mutations
│   │   │   └── types.ts          # Game levels, orders, emotions, and evaluation interfaces
│   │   ├── voice-agent/
│   │   │   ├── client.ts         # AssemblyAI WebSocket client, audio loop & simulator fallback
│   │   │   ├── events.ts         # Strongly-typed WebSocket message interfaces
│   │   │   ├── types.ts          # Connection status, transcript messages, audio options
│   │   │   └── useVoiceAgent.ts  # React hook wrapping VoiceAgentClient for components
│   │   └── world/                # 3D math, physics, kinematics, and procedural geometry
│   │       ├── avatar-kinematics.ts     # Walking, vertical bobbing, and idle limb kinematics
│   │       ├── city-expansion.tdd.ts    # Expansion configuration specs
│   │       ├── city-expansion.ts        # World bounds, daylight parameters, boulevard layout
│   │       ├── controls.ts              # WASD and Arrow key listener with smooth damping
│   │       ├── hotspots.ts              # Pre-configured interactive points of interest
│   │       ├── math.ts                  # Velocity vector resolution, AABB collision, clamping
│   │       ├── scene-builder.ts         # Cafe3DScene master Three.js orchestrator
│   │       ├── town-park-expansion.ts   # Chase camera, park coordinates, pedestrian specs
│   │       ├── types.ts                 # Position3D, BoundingBox, Hotspot data models
│   │       └── unified-plaza.ts         # Contiguous bounds & zones (Café, Bus Stop, Airport)
│   │
│   ├── scenarios/                # Language learning scenarios & curriculum
│   │   ├── catalog.ts            # Destinations, countries, language options, starting place
│   │   ├── multilingual.ts       # Multilingual dialogue matrix (Hindi, Spanish, Japanese, etc.)
│   │   └── spain-cafe.ts         # Madrid Café scenario: system prompts, tools, menu, NPC specs
│   │
│   ├── city/                     # Maple Hollow city orchestrator
│   │   ├── city-scene.ts         # CityScene composite manager managing all 5 subsystems
│   │   └── types.ts              # CitySubsystem interface, lifecycle hooks
│   ├── roads/                    # Subsystem 1: Road graph, rings, radials, lanes, waypoints
│   ├── park/                     # Subsystem 2: Central park, pond, trees, benches, paths
│   ├── buildings/                # Subsystem 3: Instanced bus shelters, houses, apartments, facilities
│   ├── traffic/                  # Subsystem 4: 150 active vehicles with follow gap and lights
│   └── pedestrians/              # Subsystem 5: 30 active walking pedestrians with idle pauses
│
└── tests/                        # Vitest / tsx automated test suite (44 passing tests)
    ├── audio-pcm.test.ts         # PCM encoding, downsampling, and RMS testing
    ├── city-expansion-world.test.ts # City boulevard, sky, and radar coordinate mapping
    ├── maple-hollow-city.test.ts # Maple Hollow 5-subsystem master specification tests
    ├── onboarding.test.ts        # Two-color onboarding layout and language matrix tests
    ├── spatial-world.test.ts     # Kinematics, collision boxes, and hotspot detection
    ├── tdd-evidence.test.ts      # Madrid Café scene structure and rendering guarantees
    ├── tool-handler.test.ts      # AssemblyAI tool call execution and state transitions
    ├── town-park-camera.test.ts  # Chase camera pitch, Central Park access, vehicle traffic
    └── unified-world.test.ts     # Unified Plaza bounds, dynamic zone detection, and spawn points
```

---

## 5. Detailed Subsystem Breakdown

### 5.1 AssemblyAI Voice Agent & Web Audio Pipeline

The voice integration is built on AssemblyAI's cutting-edge bidirectional WebSocket Voice Agent API.

1. **Token Authentication Route (`/api/assemblyai/token`):**
   - Implements a Next.js server route that exchanges the private `ASSEMBLYAI_API_KEY` for an ephemeral streaming token via `https://streaming.assemblyai.com/v3/token?expires_in_seconds=600`.
   - **Graceful Simulator Fallback:** If the API key is unset or set to the default placeholder, the endpoint returns `{ mode: "simulation" }`. The client detects this and seamlessly switches into interactive simulation mode without failing or crashing.

2. **Client-Side WebSocket Manager (`VoiceAgentClient`):**
   - Connects to `wss://agents.assemblyai.com/v1/ws?token=...`.
   - Sends a comprehensive `session.update` handshake that defines:
     - Voice identity (accent, language code, speed).
     - System prompt containing scenario rules, barista personality, and cultural nuances.
     - Function declarations (`CAFE_TOOLS`): JSON schema definitions for tools that the agent can call.
   - Listens for server events:
     - `session.updated`: Confirms agent configuration.
     - `transcript`: Delivers partial and final user/NPC speech for real-time captions.
     - `audio`: Base64 PCM audio buffers streamed back from the NPC.
     - `tool_call`: AssemblyAI requests execution of an in-game action.
     - `interruption`: Triggers immediate flush of audio queues when the user speaks over the agent.

3. **Audio Capture, Resampling & Playback (`pcm.ts`):**
   - Uses native `AudioContext` and `ScriptProcessorNode` to capture raw user voice.
   - Resamples arbitrary browser microphone rates (typically 44.1kHz or 48kHz) down to the target 16kHz or 24kHz.
   - Converts `Float32Array` values (-1.0 to 1.0) into `Int16Array` PCM format and encodes to Base64.
   - Computes Root Mean Square (RMS) audio energy to drive live visual volume meters.
   - `AudioQueuePlayer` queues incoming base64 chunks, decodes them to Float32, and plays them seamlessly through the Web Audio API with zero crackle or latency buildup.

---

### 5.2 Tool Calling & Game State Synchronization

AssemblyAI functions as both a speech partner and a game controller. When the conversation reaches key milestones, the Voice Agent triggers tools defined in `src/scenarios/spain-cafe.ts`:

```typescript
export const CAFE_TOOLS = [
  {
    type: "function",
    function: {
      name: "order_item",
      description: "Registers an item ordered by the user into the café bill.",
      parameters: { ... }
    }
  },
  {
    type: "function",
    function: {
      name: "modify_order",
      description: "Applies milk type, sugar, or temperature customizations.",
      parameters: { ... }
    }
  },
  {
    type: "function",
    function: {
      name: "trigger_unexpected",
      description: "Initiates a realistic travel surprise (e.g., out of oat milk, cash only).",
      parameters: { ... }
    }
  },
  {
    type: "function",
    function: {
      name: "finish_mission",
      description: "Concludes the simulation and provides a fluency evaluation.",
      parameters: { ... }
    }
  }
];
```

**State Mutation Pipeline (`tool-handler.ts` & `store.ts`):**
- Calling `order_item` appends the selected coffee/pastry to the receipt, advances Objective 1, sets `baristaAction` to `"brewing"`, and updates the barista's emotion to `"pleased"`.
- Calling `modify_order` customizes ingredients (e.g., oat milk, no sugar) and marks Objective 2 complete.
- Calling `trigger_unexpected` sets `baristaAction` to `"apologizing"` and tests the learner's improvisation skills (Objective 4).
- Calling `finish_mission` triggers the celebration confetti and displays the Fluency Evaluation modal with scorecards and feedback.

---

### 5.3 3D Interactive World & Kinematics Engine

The 3D environment is written in raw, imperative Three.js for optimal performance without the overhead of heavy declarative wrappers.

1. **Third-Person Chase Camera (`town-park-expansion.ts`):**
   - Configured with a `55°` field of view.
   - Sits slightly offset over the player's right shoulder (+0.8m) at a height of 2.6m and follow distance of 4.5m.
   - Maintains a downward pitch of 10° to 15°, ensuring both the player avatar and surrounding storefronts, traffic, and park foliage remain in panoramic view.
   - Smoothly damps position and look-at targets using lerp interpolation.

2. **Articulated Humanoid Avatar Kinematics (`avatar-kinematics.ts`):**
   - Both the player avatar and city pedestrians use articulated limb hierarchies (pivoted upper legs, lower legs, upper arms, and torso).
   - Locomotion calculations dynamically compute:
     - Sinusoidal leg rotation in opposition (`leftLeg = sin(t * freq)`, `rightLeg = -sin(t * freq)`).
     - Arm swing matching natural opposite-limb human locomotion.
     - Subtle vertical hip bobbing (`abs(cos(t * freq)) * bobHeight`).
     - Smooth damping transitions when entering or exiting idle states.

3. **Spatial Math & Collision Clamping (`math.ts`):**
   - `resolveVelocity(input)`: Combines WASD and arrow key states, normalizes diagonal movement vectors so diagonal walking does not exceed maximum speed.
   - `checkAABBCollision(circlePos, radius, box)`: Determines whether the player's bounding sphere penetrates obstacle bounding boxes.
   - `resolveMovement(...)`: Clamps the player inside the plaza walls and slides the player smoothly along counter and table edges.
   - `findActiveHotspot(...)`: Calculates Euclidean distance to all interactive points and returns the nearest hotspot when within triggering radius (e.g., 2.5m).

4. **Unified Plaza (`unified-plaza.ts`):**
   - Eliminates loading screens by housing three major travel scenarios in one contiguous coordinate space:
     - **Café de la Luna:** `X: -20m to -8m`
     - **Central Bus Stop & Transit Hub:** `X: -8m to +8m`
     - **Airport Concourse & Gate B12:** `X: +8m to +20m`
   - `getZoneFromPosition(pos)` dynamically updates ambient audio, HUD labels, and active NPC references as the player walks across zone boundaries.

---

### 5.4 The Maple Hollow City Simulation Engine

Built in accordance with the **Maple Hollow Master Specification (`MAPLE_HOLLOW_SPEC.md`)**, the city features a 2000m × 2000m procedural urban layout governed by a single configuration file (`city-config.json`).

The city is structured into **5 decoupled subsystems** unified under `CityScene`:

```
                           ┌────────────────────────┐
                           │       CityScene        │
                           └───────────┬────────────┘
         ┌───────────────────┬─────────┴─────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 1. RoadNetwork  │ │    2. Park      │ │  3. Buildings   │ │   4. Traffic    │ │ 5. Pedestrians  │
│ 3 Ring Roads    │ │ 180m Radius     │ │ Instanced Bus   │ │ 150 Vehicles    │ │ 30 Pedestrians  │
│ 8 Radial Roads  │ │ Central Pond    │ │ Shelters (110+) │ │ 55% Cars        │ │ Kinematic Limbs │
│ 24 Intersections│ │ Radial Pathways │ │ Houses, Towers, │ │ Speed & Follow  │ │ Idle Pauses &   │
│ Crossings       │ │ Trees & Benches │ │ Town Facilities │ │ Gap Rules       │ │ Street Crossings│
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

#### Subsystem 1: Road Network & Topology (`src/roads/`)
- **3 Concentric Ring Roads:** Inner (radius 220m), Middle (radius 460m), and Outer (radius 760m), each 12m wide.
- **8 Radial Boulevards:** Radiating every 45° from the inner ring to the 1000m perimeter, each 14m wide.
- **24 Intersections:** Ring-radial intersections featuring traffic lights at the inner ring and priority yield rules.
- **Pedestrian Crossings:** 2.5m wide footpaths flanking all roadways with designated zebra crossings.

#### Subsystem 2: Central Park (`src/park/`)
- A circular 180m-radius emerald park at the center of the world (`[1000, 1000]`).
- Includes a 32m-radius central pond with realistic stone rim, water shaders, and a fountain.
- Features perimeter gravel paths (165m radius), inner promenade (45m radius), and 8 radial connector pathways leading to the surrounding city.

#### Subsystem 3: Buildings & Facilities (`src/buildings/`)
- **Inner Ring (220–460m):** Low-density residential and commercial zone with 12 Type-A houses (pitched terracotta roofs), 8 Type-B houses, 10 shop units, 2 cafés, and 2 salons.
- **Middle Ring (460–760m):** Medium-to-high density civic zone with two 45m-tall apartment towers (15 floors), a church, a temple, a school, and a town hall/library.
- **Outer Ring (760–1000m):** Metropolitan infrastructure zone with a hospital, police station, international airport terminal, a 400m runway, train station, and bus depot.
- **Instanced Bus Shelters:** Over 110 shelters spaced every 135m along rings and radials, rendered using high-performance `THREE.InstancedMesh` with glass back-panels and benches.

#### Subsystem 4: Traffic Simulation (`src/traffic/`)
- Maintains exactly 150 active vehicles operating continuously.
- **Vehicle Mix:** 55% sedans, 15% taxis, 12% vans, 10% city buses, and 8% motorbikes.
- **Speed Regulations:** 30–45 km/h on radials, 20–30 km/h on rings; motorbikes travel +10 km/h faster; buses capped at 30 km/h.
- **Behaviors:** Waypoint following, 2-second follow gap enforcement, traffic light compliance, and 8–12 second bus stop dwelling.

#### Subsystem 5: Pedestrian Simulation (`src/pedestrians/`)
- Maintains 30 active pedestrians walking along the footpath network.
- Human walking speed of 1.2–1.5 m/s with ±10% individual variance.
- Equipped with random idle pauses (1–3 seconds), collision avoidance, and marked street crossing behaviors.

---

### 5.5 Live Minimap HUD (`MinimapHUD.tsx`)

Located on the game overlay, the Minimap HUD is a high-performance 2D HTML5 canvas radar that renders directly at 60fps with zero React re-render overhead:
- **World-to-Screen Mapping:** Maps the 3D world coordinate system to 2D radar pixels using affine transformations.
- **District Overlays:** Renders color-coded district bounds (High Street, Elm Park, Transit Boulevard, Airport Concourse).
- **Live Entity Tracking:** Real-time dots for vehicles (with headlights), pedestrians, and NPC hotspots.
- **Player Beacon:** Displays an animated pulsing beacon and a directional heading pointer showing the player avatar's orientation.
- **Expandable Viewport:** Toggle between compact (340×210px) and expanded (460×300px) views with live XYZ coordinate readouts.

---

### 5.6 Multilingual Scaffolding & Scenario Catalog

Layover supports a dual-axis language learning architecture:
1. **Target Language (What you want to learn):** Spanish (Spain), Hindi (India), Japanese, French, Italian.
2. **Learner Language (What you speak natively):** English, Hindi, Japanese, Spanish, French, German, Italian.

Each scenario provides a 4-step progressive learning ladder with:
- Target language NPC dialogue.
- Accurate phonetic transcription (e.g., Devanagari romanization, Romaji, or Spanish pronunciation guides).
- Instant translations into the learner's native language.
- Contextual suggested responses with audio practice prompts.

---

### 5.7 Zero-Dependency Retro Synthesizer (`retro-audio.ts`)

To provide rich audio feedback without adding megabytes of audio asset files, Layover includes a built-in chiptune synthesizer built directly on the Web Audio API:
- `playCoin()`: Classic high-frequency B5 → E6 square wave chirp.
- `play1Up()`: Ascending 6-note arpeggio (E4, G4, E5, C5, D5, G5).
- `playPowerUp()`: Rapid 6-note pentatonic sweep.
- `playPipe()`: Descending triangle wave pitch drop.
- `playSelect()`: Crisp dual-frequency confirmation beep.
- `playBump()`: Low frequency impact sound.

---

## 6. Data Specifications & Models

### 6.1 `city-config.json` Schema
```json
{
  "world": { "width": 2000, "height": 2000, "units": "meters" },
  "park": { "center": [1000, 1000], "radius": 180 },
  "rings": [220, 460, 760],
  "radialCount": 8,
  "roadWidths": { "ring": 12, "radial": 14 },
  "footpathWidth": 2.5,
  "busStop": { "spacing": 135, "shelterFootprint": [3, 2] },
  "busRoutes": ["innerRingLoop", "middleRingLoop", "outerRingLoop", "radialExpress"],
  "buildings": {
    "houseA": { "footprint": [10, 8], "height": 6, "floors": 2, "count": 12, "ring": "inner" },
    "houseB": { "footprint": [12, 9], "height": 6, "floors": 2, "count": 8, "ring": "inner" },
    "apartmentBig": { "footprint": [40, 25], "height": 45, "floors": 15, "count": 2, "ring": "middle" },
    "shop": { "footprint": [8, 10], "height": 5, "floors": 1, "count": 10, "ring": "inner" },
    "cafe": { "footprint": [9, 9], "height": 5, "floors": 1, "count": 2, "ring": "inner" },
    "salon": { "footprint": [8, 8], "height": 5, "floors": 1, "count": 2, "ring": "inner" },
    "church": { "footprint": [18, 30], "height": 22, "floors": 1, "count": 1, "ring": "middle" },
    "temple": { "footprint": [20, 20], "height": 18, "floors": 1, "count": 1, "ring": "middle" },
    "school": { "footprint": [40, 30], "height": 12, "floors": 3, "count": 1, "ring": "middle" },
    "townHall": { "footprint": [35, 25], "height": 14, "floors": 2, "count": 1, "ring": "middle" },
    "hospital": { "footprint": [50, 35], "height": 20, "floors": 5, "count": 1, "ring": "outer" },
    "police": { "footprint": [25, 20], "height": 10, "floors": 2, "count": 1, "ring": "outer" },
    "airportTerminal": { "footprint": [60, 30], "height": 12, "floors": 2, "count": 1, "ring": "outer" },
    "runway": { "footprint": [400, 45], "count": 1, "ring": "outer" },
    "trainStation": { "footprint": [40, 20], "height": 10, "floors": 1, "count": 1, "ring": "outer" },
    "busDepot": { "footprint": [30, 20], "height": 8, "floors": 1, "count": 1, "ring": "outer" }
  },
  "traffic": {
    "targetDensity": 150,
    "mix": { "car": 0.55, "taxi": 0.15, "van": 0.12, "bus": 0.10, "motorbike": 0.08 },
    "speedKmh": { "radial": [30, 45], "ring": [20, 30], "bus": 30 },
    "followGapSeconds": 2
  },
  "pedestrians": {
    "targetCount": 30,
    "walkSpeedMs": [1.2, 1.5],
    "idlePauseSeconds": [1, 3]
  }
}
```

---

## 7. Verification, Testing & Quality Assurance

Layover is built following a strict **Test-Driven Development (TDD)** discipline. All critical game systems, audio algorithms, mathematical models, and city specifications are backed by unit and integration tests.

### Test Execution Command
```bash
npm test
```

### Test Suite Summary (44 Tests, 100% Passing)

| Test File | Test Suite Focus | Tests | Status |
|---|---|:---:|:---:|
| `tests/audio-pcm.test.ts` | Float32 ↔ Int16 PCM conversion, downsampling (48k→24k), Base64, and RMS speech energy | 4 | ✅ Pass |
| `tests/city-expansion-world.test.ts` | World bounds, boulevard coordinates, daylight parameters, and minimap radar math | 5 | ✅ Pass |
| `tests/maple-hollow-city.test.ts` | Verification of the 5 Maple Hollow subsystems against the master spec | 7 | ✅ Pass |
| `tests/onboarding.test.ts` | Language selection matrix, Hindi dialogue support, and two-color UI compliance | 5 | ✅ Pass |
| `tests/spatial-world.test.ts` | Avatar locomotion kinematics, AABB collisions, movement clamping, and hotspots | 6 | ✅ Pass |
| `tests/tool-handler.test.ts` | AssemblyAI function calling: `order_item`, `modify_order`, `trigger_unexpected`, `finish_mission` | 5 | ✅ Pass |
| `tests/town-park-camera.test.ts` | Chase camera pitch (10°-15°), Central Park geometry, vehicle fleet, pedestrian locomotion | 6 | ✅ Pass |
| `tests/unified-world.test.ts` | Unified Plaza multi-zone boundaries, dynamic zone detection, and spawn locations | 6 | ✅ Pass |
| **Total** | **Full Project Verification** | **44** | **100% Pass** |

---

## 8. Developer Quick Start

### 8.1 Prerequisites
- **Node.js:** v20.x or higher
- **NPM:** v10.x or higher
- **AssemblyAI API Key:** (Optional for development; required for live cloud speech)

### 8.2 Environment Configuration
Create a `.env.local` file in the project root:
```bash
# Optional: Live AssemblyAI Voice Agent API Key
# If omitted or left as placeholder, the app runs in interactive Simulation Mode.
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

### 8.3 Available Scripts
```bash
# Start the local Next.js development server on http://localhost:3000
npm run dev

# Run the complete test suite (44 tests)
npm test

# Run TypeScript type check across the entire project
npm run type-check

# Run ESLint linting
npm run lint

# Build the production bundle
npm run build

# Start the production server
npm run start
```

---

## 9. Graphify Knowledge Graph Insights

The project includes an active code knowledge graph generated via `graphify` (located in `graphify-out/`):
- **Nodes & Edges:** 468 nodes, 877 edges across 26 distinct architectural communities.
- **Top God Nodes (Core Abstractions):**
  1. `Cafe3DScene` (29 connections) — Master 3D scene orchestrator.
  2. `useGameStore` (22 connections) — Unified Zustand state manager.
  3. `VoiceAgentClient` (18 connections) — WebSocket voice streaming manager.
  4. `CityScene` (16 connections) — Maple Hollow urban composite root.
  5. `CitySubsystem` (16 connections) — Lifecycle interface for urban subsystems.
  6. `Traffic` (16 connections) — 150-vehicle autonomous fleet manager.
  7. `Park` (15 connections) — Central Park procedural generator.
  8. `RoadNetwork` (14 connections) — Ring and radial road mesh builder.
- **Cross-Subsystem Bridges:** `CityScene` and `Cafe3DScene` connect the procedural urban simulation to the interactive player world, while `useGameStore` synchronizes speech tool calls with Three.js animations.

---

## 10. Summary of Key Achievements

1. **True Voice-First Language Learning:** Full integration of AssemblyAI's Voice Agent WebSocket with audio streaming, conversational tool calling, and speech barge-in.
2. **Seamless 3D Web Experience:** Third-person walkable 3D environment with smooth avatar kinematics, collision detection, and zero loading screens across zones.
3. **Comprehensive Urban Simulation:** Implementation of the complete Maple Hollow specification with 150 moving vehicles, 30 walking pedestrians, 110+ bus stops, and authentic traffic rules.
4. **Resilient Architecture:** Operates with live AssemblyAI services or in full simulation mode without API keys; 100% test coverage across audio, 3D math, and game mechanics.
