# Map pins and multi-stop route acceptance plan

> **For agentic workers:** Execute inline with superpowers:executing-plans. User authorizes autonomous implementation and correction without approval stops. Request independent read-only review before the increment is complete.

**Goal:** Make own map pins directly usable and verify the Swiss main variant's full2–8-stop route flow, including stale responses and safe itinerary adoption.

**Architecture:** Reuse the existing Leaflet map, source catalogue and per-variant SQLite state. Add a small pure own-pin patch helper plus a focused form. Add request-generation/snapshot protection to the existing route queue; keep original routes and bookings. Existing edit, selection, undo and budget paths remain authoritative.

**Tech stack:** Node24, ES modules, SQLite, native forms, Leaflet, Chrome CDP. No dependency.

**Spec:** Master V7 map/timeline/CRUD/source transparency; CHECKLIST_V2 P2.6–P2.9/P2.11 and P3.6. Existing Wanderlog/Tripsy UX basis is already documented. Own points are manual/unverified and start as unselected alternatives.

## Global constraints

- All four original routes/variants and source snapshots are preserved. Work only in this local branch; no purchase/booking/merge/deployment or external write.
- No inferred exact entrance, invented street geometry or claimed2027 timetable. Reference geometry and live observations carry their real source/date.
- Router errors and unavailable modes remain explicit; schematic paths never gain measured times.
- New pins do not become timed/paid/verified stops automatically. Editing a point must invalidate any old coordinate evidence.

## Review focus

- A held route response after reorder/clear/city/date/variant change, or a newer request, must never populate the current draft or overwrite its status.
- Route adoption must reject duplicate IDs/excess routes, booked/locked/already active targets and time conflicts, retaining existing plan and Undo.
- Own pin edits preserve a previously chosen time and all other trip data; moving a pin removes stale coordinate-evidence claims.
- Pin removal and variant switching must keep it out of other variants and map modes; empty/invalid coordinates must not be guessed.
- Real Chrome flows exercise both2 and8 stops, order/focus, timing, persistence and native keyboard, at1440/820/390.

## Tasks

- [x] Read and inventory current implementation and fresh baseline screenshots. Existing browser only proves2 schematic stops; previous goal turn is progress via commitab26f9b and502/481 tests.
- [x] Write failing pure and held-response browser cases for queue invalidation, route count/identity and safe adoption; implement the coherent gate and patch checks.
- [x] Write failing pin-model cases; add direct create/edit/remove entry points, manual provenance and optional click-to-place while retaining keyboard coordinate entry. Use existing per-variant save/Undo.
- [x] Obtain a bounded real public foot-route observation between existing catalogue points, preserve source/date/geometry and distinguish deterministic fixtures from live availability. Real HTTP negative cases cover missing foot routes, non-walking provider answers and transit outside the actual schedule period. Bike routing and broader transit acceptance remain open.
- [x] Run full real Chrome2/8-stop+pin flows, deferred request races, current regression and clean-export fallback, inspect screenshots, independently review/correct, update STATUS/DECISIONS/CHECKLIST/CHANGELOG and prepare the verified increment for local commit.

## Ledger

- Initial inspection19.11.2026: branch clean atab26f9b. fetchDayQueueRoutes currently appends asynchronous results into global queue without a request/snapshot guard. Existing model rechecks endpoints but does not reject extra route results or duplicate stop IDs. These conditions will be reproduced before changes.
- Existing generic activity form can store manual coordinates but immediately selects the point into the day. Add a clearly manual unselected own-pin flow for map use; retain generic activity behavior elsewhere.
- No current blocking wait. Local previewPID20256 on4175 uses private/checklist-v2-preview.sqlite; do not use it for destructive fixture tests.
- Fresh baseline: exported unchanged Git index atab26f9b and copied identical private raw files by verifiedSHA256; captured33 pages at three widths. Existing sources and route order never moved or overwritten.
- RED evidence: actual Chrome held walk response marked a cleared draft computed; new generation/snapshot gate fixes it. Final race script covers clear,reorder,newer request,variant anddate change,with no saved trip changes.
- Real routing observation: one public FOSSGIS request19.11.2026,8 existing catalogue points,7 walking legs,754 overview points,10,155.5m,8,129.3sec. All steps walking; all derived leg endpoints meet75m snapping bound. Raw semantic responseSHA256 preserved in fixture withsource URL,ODbL attribution andpolicy URL. Tests replay this observation,not continuous live availability.
- Own pin flow: unselected manual/unverified alternatives,coordinates oractual Leaflet click,typed draft preserved throughEscape,rename/move/soft removal+Undo. Pin edits preserve selected start times and clear old coordinate evidence. Category/saved/search filters reset only when explicitly revealing a saved pin.
- Review corrections: deleted queued pin could be resurrected; now removed from draft and rejected byfetch/model/adoption. Own pin was hidden under category filters; now reveal resets them. Pure adoption extracted tocheck actual end/duration across midnight andtrain intervals,including incoming walks. Missing transport end/duration still limits conflict completeness; no invented arrival is used.
- Visibility correction: simple-map-mode CSS hid the entire route builder. It now appears for selected stops,with directRoute(n/8) header action. Keep the old source-review panel directly below the map; own-pin management belongs inside the map's place drawer.
- Schedule/focus corrections: changing onlyclock time preserves valid walking geometry; reorder/removal follow place identity. Horizontal focus realigns onrender andresize,including820→390 without crossing the910 breakpoint. NativeEnter,selected bounds andreal control visibility are checked.
- Final evidence:515/515 full tests and494/494 portable tests, map report and HTTP smoke pass. Full existing Chrome flow, data/download/import Chrome and held meal PUT pass. Own-pin/2-and8-stop Chrome and all five held walking-response cases pass. No new dependencies or external source writes.
- Independent review and follow-up find no remaining actionable issues after protecting incoming walking intervals. Fullscreen toolbar wraps with categories beneath it and close in the mobile first row; actual buttons and pin form are checked at1440/820/390.
- Clean staged-index export contains zero private Tripsy raw files and passes494/494 portable tests, map/HTTP checks, own-pin/multi-stop Chrome and all five route races. The seed-only conflict case uses an explicitly named isolated test appointment; it does not alter preview state or claim a real booking.
- Before/after audit:33 screenshots each, no reported runtime exceptions or positive horizontal page overflow. Captures block external media and basemap tiles, and do not prove live provider availability or every visual state. Preview returns200 for main page/new modules/bootstrap,with all four variants preserved.
