#!/bin/bash
# Rebuild the phone frame set from source/art2m/phone-final.mp4: 16 fps, 720px wide, WebP q46.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/source/art2m/phone-final.mp4"
OUT="$ROOT/site/assets/frames/mobile"
TMP="$(mktemp -d)"
ffmpeg -loglevel error -y -i "$SRC" -vf "fps=16,scale=720:-2" "$TMP/f_%04d.png"
N=$(ls "$TMP"/f_*.png | wc -l | tr -d ' ')
rm -rf "$OUT"; mkdir -p "$OUT"
for f in "$TMP"/f_*.png; do cwebp -quiet -q 46 -m 6 "$f" -o "$OUT/$(basename "${f%.png}").webp"; done
rm -rf "$TMP"
echo "frames: $N  size: $(du -sh "$OUT" | cut -f1)"
