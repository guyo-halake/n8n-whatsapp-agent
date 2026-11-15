import os
import urllib.request
import re
from datetime import datetime

url = 'https://p133-caldav.icloud.com/published/2/MjE0NjgyMTc1NDQyMTQ2OEFsTaOMgZOnjo_eiajsXAfXKu2fcxXZTkELSLHDssc2gSMeo6LcBNqvxzrguhygL6C1pNypIWMfYp-tvku8-Z0'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
raw = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

events = []
current = {}
for line in raw.splitlines():
    line = line.strip()
    if line == 'BEGIN:VEVENT':
        current = {}
    elif line == 'END:VEVENT':
        if current.get('SUMMARY'):
            events.append(current)
    elif line.startswith('SUMMARY:'):
        current['SUMMARY'] = line[8:]
    elif 'DTSTART' in line:
        current['DTSTART'] = line.split(':')[-1]
    elif 'DTEND' in line:
        current['DTEND'] = line.split(':')[-1]
    elif 'RRULE' in line:
        current['RRULE'] = line.split(':')[-1]

print(f"Total events found in Apple Calendar: {len(events)}")
unique_classes = set()
for e in events:
    title = e.get('SUMMARY', '')
    unique_classes.add(title)

print("\n--- Unique Classes / Subjects in your Apple Calendar ---")
for c in sorted(unique_classes):
    print(f"* {c}")

