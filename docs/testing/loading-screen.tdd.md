# TDD Evidence Report: 3D Maps Game Transition Loading Screen

## 1. Source Plan & Requirements
- **Goal**: Add an immersive, branded loading screen when the user selects their country and comfortable language on the onboarding page, and clicks "Start", persisting until the 3D maps game is fully rendered and interactive.
- **Council Decision**:
  - The Council (Architect, Skeptic, Pragmatist, Critic) synthesized that a two-stage coordinated loader is required:
    1. Immediate tactile and visual feedback on the Onboarding page (`/`) when "Start" is clicked to prevent dead delays.
    2. A full-screen boarding pass / HUD loading curtain on the Play page (`/play`) that dissolves *only* when Three.js `Cafe3DScene` renders its first WebGL frame.
    3. Pure CSS compositor animations (`@keyframes`) so synchronous Three.js shader compilation does not stutter the spinner.
    4. A 4.5-second defensive safety watchdog timer to ensure the loading screen dissolves even on low-end GPUs or headless environments.
    5. Voice agent connection deferred until the 3D world is ready.

## 2. User Journeys
1. **As a language learner**, when I select my destination country (e.g. Spain, India, Japan) and the language I am comfortable in (e.g. English, Hindi), and click "Start", I want immediate feedback showing my flight departure preparation so I know the game is launching.
2. **As a player transitioning to `/play`**, I want to see a branded loading curtain displaying my destination country, flag, target language, comfortable native language, and simulation stages, so that I don't see unrendered blank canvases or layout pops.
3. **As a player entering the 3D world**, when the WebGL engine renders frame 1, the loading curtain should smoothly fade out and reveal the interactive city district.
4. **As a player on a restricted device or slow network**, if WebGL takes too long or fails, a safety watchdog timer should automatically reveal the scene after a timeout so I am never trapped behind an infinite loader.

## 3. Task Report & Validation
- **Phase 1: RED Gate**:
  - Test file: `tests/loading-screen.test.ts`
  - Validation command: `npm test`
  - Observed failure: `Error: Cannot find module '../src/components/ui/LoadingScreen'` (RED state confirmed)
- **Phase 2: Minimal Implementation & GREEN Gate**:
  - Created: `src/components/ui/LoadingScreen.tsx` with pure CSS animations, boarding pass styling, and metadata resolution.
  - Updated: `src/lib/world/scene-builder.ts` with `onReady` hook triggered on first rendered frame.
  - Updated: `src/components/world/Cafe3DWorld.tsx` with `onSceneReady` prop forwarded to `Cafe3DScene`.
  - Updated: `src/app/page.tsx` with `isStarting` state, `LoadingScreen` transition, and instant Start feedback.
  - Updated: `src/app/play/page.tsx` with `isSceneReady` state, `LoadingScreen` curtain, and safety watchdog timer.
  - Validation command: `npm test` (all 49 tests passed with 0 failures)
  - Typecheck command: `npm run type-check` (passed with 0 errors)
  - Lint command: `npm run lint` (passed with 0 errors)

## 4. Test Specification

| # | What is guaranteed | Test Target | Test Type | Result | Evidence |
|---|--------------------|-------------|-----------|--------|----------|
| 1 | Resolves country, language pair, and place metadata with fallbacks | `tests/loading-screen.test.ts` | Unit | PASS | `npm test` |
| 2 | Defines structured preparation stages (boarding, city, ready) | `tests/loading-screen.test.ts` | Unit | PASS | `npm test` |
| 3 | Onboarding page manages loading state on Start and renders loader | `tests/loading-screen.test.ts` | Contract | PASS | `npm test` |
| 4 | Play page holds full-screen loading curtain until scene is ready | `tests/loading-screen.test.ts` | Contract | PASS | `npm test` |
| 5 | Cafe3DScene invokes onReady hook upon rendering first WebGL frame | `tests/loading-screen.test.ts` | Integration | PASS | `npm test` |
