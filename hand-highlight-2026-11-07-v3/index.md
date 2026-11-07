# Hand highlight - final measured sage-green (2026-11-07, v3)

**Application:** `nature-green-final` @ `2b45160` (includes `72c0505`, `a00766e`). Change limited to `HumanBody3D.vue` `applyHandVisuals()` (no README/Makefile/model/geometry/organs).  
**Base/unselected hand color:** `#b8c4b8` preserved (`REGION_COLORS`/anatomy unchanged). Selected hands use stronger sage-green material lerp with restrained emissive (SwiftShader-capture measured).  
**Rendering:** Playwright + Edge headless **SwiftShader** (GPU limitation disclosed). DOM title/callout asserted before each shot. Human visual confirmation recommended.  
**Checks:** 27 body tests PASS; `make test` 9 files/91 PASS; `make typecheck` PASS; `make verify` PASS.

## Screenshots
- Unselected (both hands): [hands-unselected-1440.png](hands-unselected-1440.png) - [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/hand-highlight-2026-11-07-v3/hand-highlight-2026-11-07-v3/hands-unselected-1440.png)
- Left hand selected: [hand-left-selected-1440.png](hand-left-selected-1440.png) - [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/hand-highlight-2026-11-07-v3/hand-highlight-2026-11-07-v3/hand-left-selected-1440.png)
- Right hand selected: [hand-right-selected-1440.png](hand-right-selected-1440.png) - [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/hand-highlight-2026-11-07-v3/hand-highlight-2026-11-07-v3/hand-right-selected-1440.png)
- Heart reference (red organ): [organ-heart-selected-1440.png](organ-heart-selected-1440.png) - [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/hand-highlight-2026-11-07-v3/hand-highlight-2026-11-07-v3/organ-heart-selected-1440.png)

## Assertions
[assertions.json](assertions.json) - [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/hand-highlight-2026-11-07-v3/hand-highlight-2026-11-07-v3/assertions.json)
