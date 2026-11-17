# tools

`phone-qa.mjs` drives headless Chrome over the DevTools protocol with iPhone emulation
(real viewport, touch, DPR 2, running animation frames), scrolls to the given positions
and saves a JPEG for each. Plain `--window-size` and the GUI window both clamp to
~500px wide on macOS, so this is the only reliable way to QA phone widths from the CLI.

    cd site && python3 -m http.server 4174 &
    node tools/phone-qa.mjs "http://localhost:4174/?v=1" 390 844 0 600 1200 1800 2400
