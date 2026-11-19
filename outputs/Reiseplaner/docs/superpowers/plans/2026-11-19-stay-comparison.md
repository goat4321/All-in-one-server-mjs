# Unterkunftsfilter und Direktvergleich – Implementierungsplan

> Execute inline with superpowers:executing-plans. Autonomous work without user approval stops is authorized. Request one independent read-only code review before local completion.

**Goal:** Make P3.3/P3.4 practical for the existing Swiss main trip: combine source/cancellation/kitchen/beds/price/walk criteria and compare two to four stays with honest group totals, dates, status and missing fields.

**Architecture:** Reuse the existing browse/search/sort, lodgingPriceInsight, self-review and comparison selection. Add a focused pure facet model/UI; extend existing comparison rows. No new data provider, no new dependency, no external writes. Keep known currency/party limitations explicit.

**Spec:** Master V7 §8.1/8.5 and CHECKLIST_V2 P3.1–P3.4/P3.6. All 61 requirements remain in scope; photo sourcing and confirmed 2027 offers cannot be inferred from this functionality.

## Constraints and review focus

- Preserve all four routes and original sources; comparison/filtering must not select, book or charge a stay.
- A three-person search total is unusable as a four-person group total. CHF never silently becomes EUR. Unknown prices must not pass a price cap.
- Cancellation false, true, descriptive terms and unknown remain distinct; own review is no provider confirmation.
- Provider filtering uses parsed hostnames, never substring matching; a general operator source is not a dated room offer.
- Combined criteria use AND. Search, filters and sorting cannot silently remove chosen comparison candidates. Clear/reset and variant/city changes must have predictable scope.
- Two, three and four candidates remain readable at 1440/820/390, native keyboard/focus works, fifth selection is refused, and other variants/state/budget are unchanged.

## Steps

- [x] Read current requirements/code/data. Previous goal turn is progress:634ffde,515/494 tests plus real Chrome/clean-export evidence. No live blocking process.
- [x] Reproduce missing group/date/status facts and test party-mismatch protection; add failing combined-facet/cancellation/source/unknown-price cases.
- [x] Implement focused facet model+controls, integrate filter/reset/variant handling, and correct comparison price and terms representation; run targeted and full suites.
- [x] Exercise existing real Barcelona candidates in Chrome:2–4 comparison, limit/remove/clear, combined filters+empty/reset, sort/search retention, source links, keyboard,3 widths, variant isolation and reload. Capture baseline/current evidence.
- [x] Independently review/correct, run portable clean export and regressions, update truthful STATUS/DECISIONS/CHECKLIST/CHANGELOG/acceptance, save artifacts and prepare the verified increment for local commit. No merge/publish.

## Ledger

- Baseline634ffde clean. Current comparison primarily shows person/night; group totals, exact dates and booking status absent. String/false cancellation terms collapse to open. Initial suspicion about assessStay ignoring party was disproved: groupPrice already guards mismatched group quotes. No redundant production change made.
- RED: seven model cases fail for missing row facts/cancellation/valid unique candidates/facets; existing party guard passes.16 targeted old/new model tests now pass. Real Chrome fails at missing combined filter entry before UI integration.
- Existing comparison selects from scope before search/filter, so chosen candidates already survive search; retain this behavior. Source scope/city changes clear the selection. New facet state is view-only and reset on variant changes.
- Visual review found the dated Swiss research block preceding all lodging controls even in Barcelona. A failing real Chrome entry-position case supports moving it to a named native disclosure after the ordinary list, preserving all20 dated searches and eight sourced candidates. It remains accessible without remote data changes.
- Missing hotel photos in the direct comparison previously fell back to unrelated city scenes. A failing model case now requires an explicit missing-object-photo label; actual licensed object photos retain their source/credit. No new image rights are inferred.
- First native Enter attempt omitted the CDP text input used by the existing data-browser helper; corrected test input, no production workaround. A later real focus regression after facet changes was reproduced separately and fixed by restoring the changed control by its stable ID.
- Independent review found two real P2 issues: false free_cancellation was mislabeled as no cancellation; native per-person fallback bypassed party protection. Both reproduced RED then fixed;18/18 focused tests pass, follow-up review reports no remaining actionable issue and independently passes31+6 focused regressions.
- Flat text contrast revealed light hints4.45:1 and inherited near-black dark text around1.03:1. Scoped color corrections pass142 measured text elements per view:5.95:1 light at1440/820/390 and6.61:1 dark at1440. This does not cover all site pages/forms/focus states. Comparison and filter sections now scroll below the fixed header for review/navigation.
- Follow-through of party review: group-scope assessment was already protected, but a newly reproduced per-person quote mismatch also affected old assessment/sorting. Explicit party guard now applies there too. A separate RED test for lodging price sort demonstrates CHF previously preceding EUR by bare numeric amount; price now reuses EUR-only stay sorting and is labeled Preisreferenz(EUR). Original currencies remain visible in comparison, with no silent FX.
- Clean fallback exposed an additional focus race after delayed station-walk cache answers. A deterministic real Chrome case holds actual/api/walk requests, focuses a source filter, releases them and observes DOM replacement+lost focus. Central render now restores only the active stay facet by stable ID on every rerender; the redundant immediate-only handler restoration is removed. No general form/dialog focus policy changed.
- Further review caught an uncommitted numeric draft disappearing despite focus restoration. RED confirmed; keep the native input node only for unchanged committed cap and same variant/page. A real mouse reset with an unfinished draft already passes, so no speculative reset workaround was added.19 focused model tests and full526/portable505 passed before this last UI-only fix; final full and clean Chrome rerun are tracked separately.
- The held-request test now uses Nizza and Appenzell, where both original and seed-only catalogs have actual arrival coordinates and genuine saved station walks. Barcelona fallback has no arrival point; Kandersteg has no matching saved station walk. Those data absences were inspected directly, not filled with synthetic coordinates or provider responses. All comparison assertions still use the real Barcelona candidates afterward.
- Native disclosure timing was independently reproduced: details.open changed before its queued toggle callback, then an incidental render closed controls. Same-context render now reads actual disclosure state before replacing DOM. This applies only to the two lodging disclosures. Final main Chrome flow including both held waves, numeric draft, native mouse reset, native Enter/Tab, comparison and4 unchanged states passes.
- Final visual pass opened mobile filters, aligned desktop comparison and dark comparison. Removed duplicate outer heading/clear action for lodging because the comparison board already contains them; the activities summary remains. No unrelated controls removed.
- Final full suite526/526, original portable505/505, clean-export portable505/505 with zero skips; map and HTTP checks pass. Final original and clean Chrome both pass the exact same two held-request cycles, unfinished draft/native mouse reset,2–4 comparison and variant-isolation flow. Full existing Chrome regression passes. Latest read-only follow-up has no remaining actionable concerns and independently verifies19 focused tests.
- Final preview serves new CSS/facet/app modules with200 and actual input/disclosure preservation code. Visual evidence contains33 unchanged-baseline plus33 current main-page views and seven focused flow images for each original/clean dataset. Measured142 comparison/filter-hint texts per view remain5.95 light/6.61 dark. Artifacts copied locally; no private source staged, no purchase/booking/external write/merge/deployment.
