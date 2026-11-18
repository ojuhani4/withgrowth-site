# tools

`phone-qa.mjs` drives headless Chrome over the DevTools protocol with iPhone emulation
(real viewport, touch, DPR 2, running animation frames), scrolls to the given positions
and saves a JPEG for each. Plain `--window-size` and the GUI window both clamp to
~500px wide on macOS, so this is the only reliable way to QA phone widths from the CLI.

    cd site && python3 -m http.server 4174 &
    node tools/phone-qa.mjs "http://localhost:4174/?v=1" 390 844 0 600 1200 1800 2400

## tools/slice-phone.sh
Rebuilds `site/assets/frames/mobile/` from `source/art2m/phone-final.mp4` (16 fps, 720px, WebP q46). Bump the `?v=` on the mobile frame URL in `site/config.js` afterwards.

## tools/slice-desktop.sh
Same for the desktop set from `source/art2/opening-final.mp4` (16 fps, 1920px, WebP q66). Bump the `?v=` on the desktop frame URL afterwards.
