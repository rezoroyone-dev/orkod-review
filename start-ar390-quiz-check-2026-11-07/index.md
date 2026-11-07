# /start Arabic 390 quiz-preview check (nature-green-final @ 4c2d20b)

Concern (from `start_ar_390.png`): quiz preview (card 02) appeared blank at **390×844, Arabic RTL**. Accepted 4:5 containers/source images not changed.

## Investigation (live `http://localhost:5173/start`, Edge/Playwright, `orkod.locale=ar`, 390×844)
- **Quiz image is painted/visible (not just loaded):** `imgOk=true, complete=true, naturalWidth=366, naturalHeight>0, rect 330×415` (in view of layout), `painted` confirmed.
- **Computed styles (no hiding):** `img` `display:block, visibility:visible, opacity:1, transform:none, clipPath:none, filter:none, zIndex:auto, object-fit:contain, position:static`. Preview `display:flex, visibility:visible, opacity:1, overflow:hidden, transform/clipPath:none`. Card `start-choice--quiz` `opacity:1, transform:none, visibility:visible, animation:none` (no stuck reveal). Parent chain opacity/visibility/display normal.
- **No RTL/mobile CSS hiding found.** AR `dir=rtl lang=ar`, overflow false, 0 page errors, 0 failed requests. Compared to **EN 390**: identical quiz `imgOk/naturalWidth/src/painted/styles` behavior; only expected y-offset differs (AR text length). `src=orkod-quiz-preview-mobile.png` in both.
- **Waited for `img.decode()` + animation/render settle** before capture.
- **Pixel evidence (fresh):** AR quiz element screenshot variance 563.4 (not blank/uniform), extrema `(17,255),(31,255),(21,255)`; full-page variance 9393.1. EN quiz element variance 563.4 (comparable).

## Conclusion
**No genuine display defect reproduced in the current running app at 390×844 AR.** The quiz preview is loaded, decoded, painted, visible, and content-bearing. The earlier “blank” appearance in the reviewed screenshot is consistent with a capture/timing/rendering artifact (not observed after decode+settle) rather than a CSS/RTL/reveal bug. **No application code changed; no commit/push.**

## Fresh evidence (post-decode/wait)
| Evidence | Raw |
|---|---|
| AR 390 fresh full-page | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-ar390-quiz-check-2026-11-07/start_ar_390_fresh.png) |
| AR 390 quiz preview element | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-ar390-quiz-check-2026-11-07/start_ar_390_quiz_element.png) |
| AR 390 investigation full | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-ar390-quiz-check-2026-11-07/start_ar_390_investigation_full.png) |
| EN 390 comparison full | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-ar390-quiz-check-2026-11-07/start_en_390_comparison_full.png) |
| results.json | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-ar390-quiz-check-2026-11-07/results.json) |
