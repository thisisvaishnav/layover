# LAYOVER — Project Instructions

## What This Is
A travel language simulator: a walkable 3D district where learners approach NPCs and
practice conversations before a trip. Interaction starts from the "Talk to NPC — press E" prompt.

## Tech Stack
- **Language:** TypeScript (strict mode)
- **Framework:** Next.js 14+ (App Router)
- **3D:** React Three Fiber + Drei (Phase 3 only)
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Deploy:** Vercel

## Build & Run
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # tsx --test (Node test runner)
```

## Environment Variables
None — the app runs with no server-side secrets.

## Code Style
- File naming: kebab-case for directories, PascalCase for components, camelCase for utils
- Prefer `async/await` over raw promises
- Zustand stores: immutable updates, typed selectors
- No `any` types without explicit justification comment

## Project Structure
```
src/app/          → Next.js pages
src/components/   → React components (conversation/, map/, character/)
src/lib/          → Core logic (conversation/, audio/)
src/scenarios/    → Scenario definitions (prompts, objectives, dialogue)
public/models/    → GLTF 3D assets
public/audio/     → Sound effects
tests/            → Node test runner files (tsx --test)
```

## Key Patterns
- **Interaction prompt** (`InteractionPrompt`) gates NPC contact; `E` is the interact key
- **Conversation store** (Zustand) holds proximity, dialogue steps, and reply feedback
- **Scenario engine** is a state machine; one scenario per file in `src/scenarios/`
- **3D scene** reads the Zustand store for proximity only

## Critical Rules
- Never commit `.env.local`
- The conversation overlay is intentionally removed — only the press-E prompt remains
- 3D is optional — 2D fallback must always work

## Conventions
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- One concern per file, <400 lines max
- Tests live in `tests/` mirroring `src/` structure

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
