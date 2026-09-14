#!/usr/bin/env bash
#
# Renders tools/og-card.html to public/og.png at exactly 1200x630 -- the size
# every social scraper expects. Run after editing the card or the palette:
#
#     npm run og
#
# Headless Chrome is used rather than a screenshot library so the repo gains no
# dependency for something that runs a handful of times a year.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CHROME=""
for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome || true)" \
    "$(command -v chromium || true)"
do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then CHROME="$candidate"; break; fi
done

if [ -z "$CHROME" ]; then
    echo "make-og: no Chrome or Chromium found. Install one, or open" >&2
    echo "         tools/og-card.html in a browser and screenshot it at 1200x630." >&2
    exit 1
fi

# --force-device-scale-factor=1 pins the output to 1200x630 on a Retina display,
# where the default would capture at 2x and produce a 2400x1260 file.
"$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --allow-file-access-from-files \
    --force-device-scale-factor=1 \
    --window-size=1200,630 \
    --virtual-time-budget=6000 \
    --screenshot="$ROOT/public/og.png" \
    "file://$ROOT/tools/og-card.html" 2>/dev/null

echo "make-og: wrote public/og.png"
