# TDD Evidence Report: Clean Two-Color Onboarding Layout & Language Selection

## 1. Source Plan & Requirements
- **Goal**: Transform the onboarding page into a clean, minimalist two-color (black & white) layout.
- **Key Changes**:
  1. Restrict color palette to strictly two colors (`#000000` and `#ffffff`).
  2. Change language picker to "Pick a country" (Spain, India, Japan, France, Italy).
  3. Replace Telugu with Hindi (`hi` / हिन्दी) for India, with full bilingual scenarios across all 3 unified plaza zones (cafe, bus stop, airport).
  4. Remove "Choose your starting place" because all places exist in one unified walkable map (defaulting spawn to `cafe`).
  5. Provide a simple "Language you are comfortable in" section where learners select their spoken/native tongue.
  6. Remove all noisy game clutter:
     - `READY FOR DEPARTURE`
     - `Spanish 🇪🇸 · Café de la Luna`
     - `Taught in: Japanese 🇯🇵 · Full Walkable 3D Plaza with Animated Character`
     - `Where would you like to spawn? (All places are in the same walkable 3D world!)`
     - `Your native tongue: We explain grammar, vocabulary, and phonetics in this language.`
     - `SCORE 002600`
     - `🪙 x14`
     - `STAGE METRO PLAZA`

## 2. User Journeys
1. **As a language learner**, I want an onboarding page styled in only two colors without arcade game clutter, so that my onboarding experience is clean, calm, and focused.
2. **As a traveler**, I want to pick a destination country instead of picking a language, with India offering Hindi instead of Telugu.
3. **As a traveler**, I do not want to choose a starting place because all places are in the same walkable map, so the app should default to the unified map without asking me where to spawn.
4. **As a learner**, I want to select the language I am comfortable speaking/learning in.
5. **As a learner practicing Hindi (`hi`)**, I want the multilingual scenario system to support Hindi dialogues and translations across the unified plaza locations.

## 3. Task Report & Validation
- **Phase 1: RED Gate**:
  - Test file: `tests/onboarding.test.ts`
  - Validation command: `npm test`
  - Observed Failures:
    - `ONBOARDING_COUNTRIES must be an array`
    - `Single map starting place should default to 'cafe'`
    - `Expected values to be strictly equal: 'Español' - 'हिन्दी'`
    - `Onboarding page must not contain 'READY FOR DEPARTURE'`
- **Phase 2: Minimal Implementation & GREEN Gate**:
  - Files modified:
    - `src/scenarios/catalog.ts` (added `ONBOARDING_COUNTRIES`, `DEFAULT_STARTING_PLACE`)
    - `src/scenarios/multilingual.ts` (added `hi` scenarios for `cafe`, `bus_stop`, `airport`)
    - `src/app/page.tsx` (redesigned two-color onboarding page, removed starting place selector, removed all game clutter)
  - Validation command: `npm test` (all 26 tests passed)
  - Typecheck command: `npm run type-check` (passed with 0 errors)
  - Lint command: `npx eslint src/app/page.tsx tests/onboarding.test.ts src/scenarios/catalog.ts src/scenarios/multilingual.ts` (passed with 0 errors)

## 4. Test Specification

| # | What is guaranteed | Test Target | Test Type | Result | Evidence |
|---|--------------------|-------------|-----------|--------|----------|
| 1 | Onboarding countries list includes India with Hindi, not Telugu | `tests/onboarding.test.ts` | Unit | PASS | `npm test` |
| 2 | Starting place defaults to unified map spawn ('cafe') | `tests/onboarding.test.ts` | Unit | PASS | `npm test` |
| 3 | Multilingual scenario catalog supports Hindi (`hi`) across all zones | `tests/onboarding.test.ts` | Integration | PASS | `npm test` |
| 4 | Clutter strings (`READY FOR DEPARTURE`, `SCORE`, `STAGE`, etc.) are removed and contract met | `tests/onboarding.test.ts` | Integration | PASS | `npm test` |
| 5 | Scaffolding languages include English and Hindi | `tests/onboarding.test.ts` | Unit | PASS | `npm test` |
