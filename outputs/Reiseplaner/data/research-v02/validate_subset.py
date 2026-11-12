#!/usr/bin/env python3
"""Prueft die kuratierten Reiseplaner-Kerndaten ohne externe Abhaengigkeiten."""
import json, pathlib, sys
P = pathlib.Path(__file__).resolve().parent
FILES = [
    'trips', 'destinations', 'group_preferences', 'activities_comparison_catalog',
    'group_activity_ranking', 'accommodation_comparison_catalog',
    'accommodation_market_quotes', 'transport', 'transport_research_queue',
    'transport_comparison_candidates', 'fares', 'budgets', 'budget_scenarios',
    'sources', 'data_quality', 'import_rules'
]
errors = []
def check(condition, message):
    if not condition: errors.append(message)

data = {}
for f in FILES:
    try: data[f] = json.loads((P / (f + '.json')).read_text(encoding='utf-8'))
    except Exception as exc: errors.append(f'Cannot parse {f}.json: {exc}')
if errors:
    print('ERROR:', '\nERROR: '.join(errors)); sys.exit(1)
trip_ids={x['id'] for x in data['trips']}
destination_ids={x['id'] for x in data['destinations']}
source_ids={x['id'] for x in data['sources']}
activity_ids={x['id'] for x in data['activities_comparison_catalog']}
quote_ids={x['id'] for x in data['accommodation_market_quotes']}
transport_ids={x['id'] for x in data['transport']}

def unique_ids(name, key='id'):
    ids=[x[key] for x in data[name]]
    check(len(ids)==len(set(ids)),f'Duplicate IDs in {name}')
for n in FILES:
    if isinstance(data[n],list) and data[n] and 'id' in data[n][0]: unique_ids(n)
check(len(trip_ids)==4, 'Expected four independent Tripsy trips')
for t in data['trips']:
    check(all(d in destination_ids for d in t.get('ordered_destination_ids',[])), f'Unknown route destination: {t["id"]}')
    check(t.get('travellers') in (3,4), f'Unexpected party size: {t["id"]}')
for n in ('activities_comparison_catalog','accommodation_comparison_catalog','transport','transport_research_queue','transport_comparison_candidates','budgets','budget_scenarios'):
    for x in data[n]:
        tid=x.get('trip_id')
        check(tid is None or tid in trip_ids, f'{n}: unknown trip_id {tid}')
for n in ('activities_comparison_catalog','accommodation_comparison_catalog','accommodation_market_quotes'):
    for x in data[n]:
        check(x.get('destination_id') in destination_ids, f'{n}: unknown destination {x.get("destination_id")}')
for x in data['group_activity_ranking']:
    check(x['activity_id'] in activity_ids, f'Ranking references unknown activity {x["activity_id"]}')
for x in data['transport_research_queue']:
    check(x['original_segment_id'] in transport_ids, f'Queue references unknown transport {x["original_segment_id"]}')
for x in data['budget_scenarios']:
    for q in x.get('lodging_ids', []):
        check(q in quote_ids, f'Budget scenario references unknown quote {q}')
for n in ('activities_comparison_catalog','accommodation_market_quotes','transport_comparison_candidates','fares','data_quality'):
    for x in data[n]:
        for s in x.get('source_ids',[]):
            check(s in source_ids, f'{n}: missing source {s}')
for x in data['accommodation_market_quotes']:
    check(x.get('booking_status') in ('unbooked','requested','booked','cancelled'), f'Quote booking status invalid: {x["id"]}')
    check(x.get('is_selected') is False, f'Quote preselected: {x["id"]}')
    check(x.get('group_stay_total_cents') is None or isinstance(x['group_stay_total_cents'],int), f'Quote not in cents: {x["id"]}')
    for tid in x.get('trip_ids_applicable',[]):
        check(tid in trip_ids, f'Quote references unknown trip: {tid}')
if errors:
    print(f'{len(errors)} ERROR(S)')
    print('\n'.join('- '+e for e in errors[:50])); sys.exit(1)
print(f'OK: {len(FILES)} JSON datasets parsed; {len(trip_ids)} trips, {len(activity_ids)} activity candidates, {len(quote_ids)} price quotes, {len(transport_ids)} transport legs; IDs and relations consistent.')