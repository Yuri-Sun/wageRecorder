# AGENTS.md

## Project overview

**wageRecorder** is a client-only WeChat Mini Program for punch in/out, work-hour tracking, and wage calculation. There is no backend, `package.json`, or automated test runner in the repository.

- Entry: `app.json`, `app.js`
- Manual regression: `TEST_CHECKLIST.md`
- App ID: `project.config.json` (`wx618c2a8d0fe1087e`)
- Base library: `project.private.config.json` (`libVersion` 3.16.1)

## Cursor Cloud specific instructions

### What runs in the cloud VM

This repo has **no npm dependencies** to install. Cloud agents can validate the project headlessly:

| Check | Command |
|-------|---------|
| JS syntax | `find . -name '*.js' -exec node --check {} \;` |
| ESLint | See note below — use ECMAScript 2020 parser because source uses `??` |
| Core logic smoke | Run `/tmp/verify-wage-recorder.mjs` (create once per session; see setup agent transcript) or re-run the inline checks from that script |
| Asset integrity | Confirm `pages/*/*.{js,wxml,wxss,json}` and `images/tab_*.png` exist |

**ESLint note:** `.eslintrc.js` sets `ecmaVersion: 2018`, but the code uses nullish coalescing (`??`). Until the config is updated, lint with:

```bash
npx --yes eslint@8 . --ext .js --parser-options '{"ecmaVersion":2020}'
```

### Running the app (required for UI / E2E)

The mini program **must** be opened in [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) (macOS/Windows). Point the tool at the repo root (`/workspace`). Use the simulator and follow `TEST_CHECKLIST.md` for manual regression.

- Hot reload: enabled in `project.private.config.json` (`compileHotReLoad`)
- Renderer: Skyline + glass-easel (`app.json`) — use a recent DevTools base library (3.x+)
- There is no `npm run dev` or local HTTP server

### Lint / test / build summary

| Task | How |
|------|-----|
| Lint | ESLint via editor extension or `npx eslint@8` (see parser note above) |
| Test | Manual only (`TEST_CHECKLIST.md`) |
| Build / release | WeChat DevTools: Preview / Upload (minify flags in `project.config.json`) |

### Gotchas

- Do not expect `wx` APIs to work under plain Node — UI flows need DevTools or a real device preview.
- Meal deduction subtracts **0.5h** from duration on punch-out (`pages/index/index.js`) and in record edits (`pages/record/record.js`).
- Export from settings uses clipboard fallback when file APIs are unavailable in the simulator.
