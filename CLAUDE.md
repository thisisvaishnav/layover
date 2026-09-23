# LAYOVER — Project Instructions

## What This Is
A voice-controlled travel language simulator for the AssemblyAI Voice Agent Hackathon (Sept 2026).
Users practice Spanish conversations in a 3D café using AssemblyAI's Voice Agent API.

## Tech Stack
- **Language:** TypeScript (strict mode)
- **Framework:** Next.js 14+ (App Router)
- **3D:** React Three Fiber + Drei (Phase 3 only)
- **Voice:** AssemblyAI Voice Agent API (single WebSocket)
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Deploy:** Vercel

## Build & Run
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Vitest
```

## Environment Variables
```bash
ASSEMBLYAI_API_KEY=  # Required. Get from https://www.assemblyai.com/dashboard
```

## Code Style
- File naming: kebab-case for directories, PascalCase for components, camelCase for utils
- Prefer `async/await` over raw promises
- Zustand stores: immutable updates, typed selectors
- WebSocket events: typed via `src/lib/voice-agent/events.ts`
- No `any` types without explicit justification comment

## Project Structure
```
src/app/          → Next.js pages and API routes
src/components/   → React components (voice/, scene/, hud/, ui/)
src/lib/          → Core logic (voice-agent/, game/, utils/)
src/scenarios/    → Scenario definitions (prompts, tools, objectives)
public/models/    → GLTF 3D assets
public/audio/     → Sound effects
tests/            → Vitest test files
```

## Key Patterns
- **Voice agent client** wraps the WebSocket; components consume via hooks
- **Tool calls** from AssemblyAI map to game state changes via `tool-handler.ts`
- **Scenario engine** is a state machine; one scenario per file in `src/scenarios/`
- **3D scene** reads Zustand store; tool calls never touch Three.js directly
- **Audio capture** uses AudioContext with PCM16 encoding at 16kHz mono

## Critical Rules
- Never commit `.env.local` (contains API key)
- Push-to-talk must be implemented before any voice testing
- Barge-in events must use transactional state rollback
- 3D is optional — 2D fallback must always work

## Conventions
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- One concern per file, <400 lines max
- Tests live in `tests/` mirroring `src/` structure
