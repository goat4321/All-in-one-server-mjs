# Three-meal planner implementation plan

> **For agentic workers:** Execute inline using superpowers:executing-plans. The user has authorized autonomous implementation without a new approval stop. Review the completed increment independently once.

**Goal:** Plan breakfast, lunch and dinner against actual selected accommodation and pool every recipe ingredient into the existing per-variant shopping budget.

**Architecture:** Extend existing meal records and the existing grocery model. A small pure `public/meal-planner.mjs` module owns slot selection, accommodation context and draft generation. `lib/meal-catalog.mjs` extends the existing Barcelona catalogue with documented simple recipes for the six primary cities. Missing prices remain null; EUR/CHF and ingredient units remain separate. Existing IDs, routes, bookings, receipt replacement, stock and explicit pack overrides remain compatible.

**Tech stack:** Existing Node 24, ES modules, SQLite, native HTML forms and Chrome CDP tests. No new dependency.

**Spec:** Master V7 sections 8.4 and acceptance 16; CHECKLIST_V2.md P5.3–P5.9. Full source checklist remains authoritative and incomplete outside this increment.

## Global constraints

- Preserve all four original routes and their independent state; enrich the primary six cities first.
- No external mutation, purchase, booking, merge or deployment.
- No invented store price, availability, kitchen access or exact entrance.
- Price observations carry currency, pack/unit, date, source and an explicit online/reference status.
- Continue without asking for routine choices; keep STATUS.md and DECISIONS.md truthful.

## Review focus

- Cold meals contribute ingredients even though they require no stove.
- A missing ingredient price never becomes a complete zero-cost meal; known amounts remain visible.
- Breakfast uses the previous night's selected accommodation; destination arrival does not grant morning kitchen access.
- Replacing lunch must preserve breakfast and dinner, and must refuse replacing booked/paid meal records.
- A shopping stop adds time/location only; goods stay counted once in the basket.

## Tasks

1. [x] Write failing model tests for units/currencies, unknown prices, cold recipes and legacy override compatibility. Extend `public/model.mjs` and `lib/store.mjs`; run focused grocery/core tests.
2. [x] Add a source-dated ingredient/recipe catalogue with portions for three, explicit preparation steps/equipment and known/missing prices. Preserve existing Barcelona recipe IDs and references. Test scopes and source completeness.
3. [x] Write failing pure planner tests, then implement slot filtering, default times, selected accommodation and safe replacement. Extend existing forms/actions/views with three slot buttons, an all-day summary, recipe details and optional shopping-stop creation. Run focused tests.
4. [x] Add real browser cases: three meal slots, one pooled basket, no-heat meal, unknown manual price, date/variant changes, receipt protection, optional shopping stop, persistence, Undo and 1440/820/390 screenshots. Run full/portable suites and HTTP checks, independently review, correct defects and save the verified increment locally.

## Ledger

- 19.11.2026 preflight: previous goal turn produced three local commits and verified source/GUI evidence, therefore progress. Current worktree clean at f3581b3. Existing store already permits breakfast/lunch/dinner but food UI/form defaults to dinner. Basket currently requires `requiresKitchen=true`, EUR/g and known prices, so cold and unpriced recipes require a coherent model extension.
- Ruling: implement on the existing worktree and preserve current UI default of dinner for compatibility. Three explicit tabs expose the added slots. Recipe preparation amounts/times are labeled planning assumptions; official product observations remain separate.
- Model gate: three new failure cases reproduced cold-meal exclusion, unknown price becoming zero and lost units/currency. Corrected shared basket/store keys; core/grocery/planner focused run passed40 tests. A further renderer test covers the actual shared table export and the three reference totals.
- Ruling: preserve Barcelona's original pasta/restaurant ordering as well as IDs after a core regression demonstrated that the existing catalogue API consumes its first two entries. Other simple recipes are appended.
- Reference scope: nine official online product observations from19.11.2026, not verified city-specific offers. Nine further products remain explicit unpriced pack assumptions with reason and next source. No generic product search is labeled a verified quote.
- Review gate: independent read-only review identified incomplete checkout/time-window handling, duplicate-store selection and a stale dialog capable of overwriting a just-committed save. Regression tests first reproduced the defects; fixes passed re-review. A dedicated Chrome test holds a real PUT response to prove the old dialog is rejected. Final small search/currency follow-up passed20 independent targeted tests without findings.
- Integration gate: an additional failing test reproduced cold recipes missing from self-catering and appearing in restaurants. A shared recipe predicate now drives both filters, counters and card labels. The full Chrome flow checks the rendered result.
- Final validation:499/499 full Node tests,478/478 portable tests, map report, HTTP smoke, full Chrome flow and isolated meal-race browser test passed. Three meal slots, manual unknown price,200ml saved milk stock,receipt replacement,duplicate shop rejection,Undo,reload,date/variant isolation,CHF breakfast and native Enter/focus covered. Six additional screenshots at1440/820/390; mobile overview and scrollable comparison visually inspected. No remote CI/deployment claim.
- Documentation:STATUS,DECISIONS,CHECKLIST_V2,REQUIREMENTS_CHANGELOG and MEALS_ACCEPTANCE updated. National references do not close local chain/count/source gaps or the full61-point acceptance.
