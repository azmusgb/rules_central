#!/usr/bin/env python3
"""Fail if JS references IDs not present in templates."""
import glob, re, sys
html_ids = re.findall(r'id="([^"]+)"', ''.join(open(f).read() for f in glob.glob('templates/**/*.html', recursive=True)))
js_refs = re.findall(r'getElementById\(["\']([^"\']+)["\']\)|querySelector\(["\']#([^"\']+)["\']\)', ''.join(open(f).read() for f in glob.glob('static/js/**/*.js', recursive=True)))
missing = {a or b for a,b in js_refs} - set(html_ids)
if missing:
    print('Missing IDs:', ', '.join(sorted(missing)))
    sys.exit(1)
