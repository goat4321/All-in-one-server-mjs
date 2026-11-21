# Data and deadlines performance implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. The user explicitly authorizes autonomous checklist work without approval stops. Request one independent read-only code review before completion.

**Goal:** Make Data & Deadlines immediately useful and generate long audit details only when deliberately requested, preserving every existing source, filter, export and variant.

**Architecture:** Extract the existing data page from `public/views.mjs` to a focused `public/data-page.mjs`. Native details groups load the existing audit renderers on opening and release their DOM on closing; open groups survive normal rerenders only in the same variant. Entry gap reasons are individually deferred. No catalogue, saved state, external service or source meaning changes.

**Tech stack:** Existing Node 24 ES modules, native HTML details, SQLite, Chrome CDP. No dependency.

**Spec:** Master V7 source/status transparency and usable UI; CHECKLIST_V2 P1.2/P1.7/P2.1/P7.4. UX basis already documented from Wanderlog/Tripsy: compact preparation status first, detailed evidence available separately.

## Global constraints

- Preserve all four route variants, selected items, paid/booked states, source links, missing-field reasons and export payloads.
- No approval checkpoint, merge, deployment, purchase, booking or external source write.
- Data disclosures are local view preferences, not persisted trip edits. Unknown facts remain unknown.
- Benchmark identical current catalogues and the same three viewport sizes sequentially; report DOM/render evidence without claiming universal load-time gains.

## Review focus

- HUD missing-field shortcut must open the deferred coverage group before applying filters and focusing the search.
- Delayed native toggle events must never load an old variant's content into the current page.
- Filtered coverage rows must retain every gap reason after expansion; HTML/IDs stay escaped.
- Deadline edits and existing import/export controls must work after deferred loading and rerenders.
- Keyboard Enter/Space, focus, mobile width and reopening must work without a pointer or external network.

## Tasks

- [x] Capture fresh current-HEAD data-page screenshots/DOM metrics at1440/820/390; record initial state as progress baseline.
- [x] Add failing renderer/browser checks for lightweight initial output, deadline-first layout, full on-demand sections, deferred individual reasons and complete source reachability.
- [x] Extract and split data renderers without duplicating data semantics; wire native toggles and HUD shortcut. Add small styling in an existing stylesheet and update existing browser flows to open the relevant detail group deliberately.
- [x] Exercise native keyboard, open/close/reopen, missing-field filter/export, deadline edit, variant switch and reload in real Chrome. Compare before/after and inspect images.
- [x] Run affected/full/portable checks, request independent review, correct findings, update STATUS/DECISIONS/CHECKLIST/CHANGELOG, refresh local preview and save the verified increment locally.

## Ledger

- Preflight19.11.2026: previous goal turn is progress: local commit13c0f9a,499 full/478 portable tests plus Chrome/race evidence. Current branch clean, no pending process wait. Full61-point objective remains active.
- Evidence: Data page currently eagerly calls entryCoveragePanel, source list and several large audit tables even inside closed native details. Prior full-page audit measured up to27,419 DOM nodes. Fresh baseline will use current meal catalogue and original local Tripsy copies.
- Approach: Native on-demand groups fit existing interaction patterns and avoid a new navigation model. Merely adding CSS containment would keep the unnecessary DOM; pagination alone would change source reachability/filter behavior. Use deferred groups plus individual reasons while retaining the existing row filters.
- Renderer gate: new tests failed first on eager individual reasons and missing on-demand API; seven focused tests passed after extraction. Existing direct entryCoveragePanel remains complete by default.
- Native browser gate: Enter requires a native character event in CDP, fixed the test helper rather than adding a synthetic product keyboard handler. Variant expectations use actual route membership; Appenzell may legitimately occur in a different Swiss route. Import changes its own log, not manual-state revision; the file test now observes the real import protocol and rendered rows.
- Final logic validation:502/502 full Node and481/481 portable tests,HTTP smoke,map report,complete existing Chrome flow and meal-race passed. New data flow passed all9 groups,full source/matrix/reason exports,Enter/Space,deadline/timezone/reload,real import/reimport and variant reset.
- Visual correction: actual before/after desktop and mobile images opened; removed inherited readiness shadow and fixed mobile header. Contrast test reproduced4.454:1 muted text and1.091:1 dark headings; scoped colors now yield minimum5.738:1 light and9.323:1 dark across47 initial text samples. Light summary focus7.385:1. This does not cover expanded tables/dialogs or all-page conformance.
- Review: independent read-only main review and follow-up found no remaining issues;10 targeted Node tests additionally passed. No code changes by reviewer. Fresh final33-page audit ran without parallel test load,with no JS exceptions or page overflow.
- Clean export gate: staged tracked files exported to a new directory,private Tripsy snapshots verified absent.481 portable tests,map/HTTP checks and new Chrome data flow passed using the actual seed fallback. Original snapshots were never moved or changed. Local preview restarted on4175 with the same user DB;HTTP200,new module,four variants and six meal cities verified.
