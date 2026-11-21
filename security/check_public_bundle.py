#!/usr/bin/env python3
"""Fail-closed structural check for the public visitor bundle; no user data read."""
from pathlib import Path
import re, sys
if len(sys.argv) != 2:
    raise SystemExit('Usage: python check_public_bundle.py visitor.html')
p = Path(sys.argv[1])
text = p.read_text(encoding='utf-8')
expected = ['clock','compass','pd','family','plan','activities','safety','quality']
embedded = re.findall(r'<script\b[^>]*\bid=["\']embedded-([a-z0-9_-]+)["\'][^>]*>', text, re.I)
errors = []
if sorted(embedded) != sorted(expected):
    errors.append(f'Expected 8 public modules; found {embedded}')
for private in ('embedded-monitor','alhazm_supervisory_visits_2026_v1','private_data/','supervisory_visits/'):
    if private in text: errors.append(f'Private marker present: {private}')
if re.search(r'<script\b[^>]*\bid=["\']embedded-monitor["\']', text, re.I):
    errors.append('Supervisory code exposed')
print(f'Visitor bundle: {p.name}; expected modules: {len(expected)}; found: {len(embedded)}')
if errors:
    for err in errors: print('FAIL:', err)
    sys.exit(1)
print('PASS: structural check only. NOT proof of safe content, Firebase rules, or confidentiality.')
