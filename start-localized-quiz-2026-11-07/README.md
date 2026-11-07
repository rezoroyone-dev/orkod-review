# /start localized quiz preview verification (2026-11-07)

App commit: `nature-green-final@827da8a` `fix(start): localize quiz preview by locale (en/fr/ar/id, AR RTL)` (pushed to `rezoroyone-dev/pranichealing`). Evidence branch: `visual-review/final-release-2026-11-07-2b45160`.

## Change
- `frontend/src/views/StartJourney.vue`: quiz preview image selected by i18n `locale` (`quizLocale` computed) → `orkod-quiz-preview-{en,fr,ar,id}.png` / `-mobile.png` (8 assets, 1000×1250/800×1000, real Quiz Q1 + 6 answers from `frontend/src/data/quiz.ts` + `frontend/src/locales/*.json`).
- Body preview, 4:5 containers, 01→`/body`, 02→`/quiz` (auth-gated), Skip→`/home`, chrome-free capture, 7 organ colors — preserved.

## Automated verification (Edge/Playwright, live `http://localhost:5173/start`)
Method: set `localStorage['orkod.locale']=<locale>`, reload, wait, capture full-page screenshot + DOM metrics. (Note: an earlier init-script/clear approach overwrote the stored locale to `fr` and produced false negatives; resolved with set+reload.)

| locale | 1440×900 quiz | 390×844 quiz | 360×800 quiz | lang/dir | overflow |
|---|---|---|---|---|---|
| en | `orkod-quiz-preview-en.png` nw560 | `-en.png` nw366 | `-en.png` nw336 | en/ltr | no |
| fr | `orkod-quiz-preview-fr.png` nw560 | `-fr.png` nw366 | `-fr.png` nw336 | fr/ltr | no |
| ar | `orkod-quiz-preview-ar.png` nw560 | `-ar.png` nw366 | `-ar.png` nw336 | ar/rtl | no |
| id | `orkod-quiz-preview-id.png` nw560 | `-id.png` nw366 | `-id.png` nw336 | id/ltr | no |

All 12 shots: correct locale-specific `quizSrc`, `stored`/`lang`/`dir` match, 0 horizontal overflow.

## Interactions (390×844)
- 01 → `http://localhost:5173/body`
- 02 → `http://localhost:5173/login?redirect=/quiz` (auth gate preserved)
- Skip → `http://localhost:5173/home`

## Validation
- `npx eslint src/views/StartJourney.vue` clean (targeted).
- `make test`: 9 files / 91 tests PASS.
- `make build`: PASS.
- `make verify`: PASS (typecheck + test-unit + frontend-build).

## Screenshots
`start_{en,fr,ar,id}_{1440,390,360}_full.png` + `results.json` in this folder.
