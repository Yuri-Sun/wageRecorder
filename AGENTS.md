# AGENTS.md

## Project overview

**wageRecorder**：微信小程序，本地考勤与澳元（A$）工资计算。当前版本 **3.0.1**。

- 业务逻辑：`utils/wage.js` + `app.js`
- 界面：`styles/ui-kit.wxss`（WeUI 风格分组列表）
- 图表：`components/wage-chart` + `components/ec-canvas`（ECharts）
- 导出：`utils/export-format.js`（CSV / 微信友好 TXT）
- 说明：`docs/CHARTS.md`、`docs/CHART_BUNDLE.md`
- 手工回归：`TEST_CHECKLIST.md`
- App ID：`project.config.json`（`wx618c2a8d0fe1087e`）
- 基础库：`project.private.config.json`（`libVersion` 3.16.1）

## 开发命令

```bash
npm install
npm test
npm run lint
```

## 图表包体

- 报表使用 `components/ec-canvas/echarts.js`（由 `npm run build:echarts` 从 `echarts.common.min.js` 生成，约 650KB）。

## 下拉刷新

- 记录 / 报表 / 设置页已开启 `enablePullDownRefresh`，逻辑在 `utils/page-refresh.js`。

## 页面结构约定

| 类名 | 用途 |
|------|------|
| `ui-page` | 页面内边距容器 |
| `ui-section` + `ui-section-title` | 组外标题 |
| `ui-group` | 白底圆角卡片 |
| `ui-stats-grid` | 三列指标 |
| `ui-cell` | 列表行 |
| `ui-table` | 工资明细表 |
| `ui-segment-bar` | 顶部分段筛选 |

## Cursor Cloud specific instructions

### What runs in the cloud VM

仓库含 `package.json` 与 `tests/*.test.js`。Cloud agents 可无头验证：

| Check | Command |
|-------|---------|
| Unit tests | `npm test` |
| Lint | `npm run lint`（`.eslintrc.js` 已设 `ecmaVersion: 2020`） |
| JS syntax | `rg --files -g '*.js' -g '!node_modules' -0 \| xargs -0 -n1 node --check` |
| Asset integrity | Confirm `pages/*/*.{js,wxml,wxss,json}` and `images/tab_*.png` exist |

`npm install` 主要用于 devDependencies（eslint / echarts 构建）。无后端服务。

### Running the app (required for UI / E2E)

小程序须在 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（macOS/Windows）打开仓库根目录。按 `TEST_CHECKLIST.md` 手工回归。

- Hot reload：`project.private.config.json`（`compileHotReLoad`）
- Renderer：Skyline + glass-easel（`app.json`），建议基础库 3.x+
- 报表 ECharts 需基础库 ≥ 2.9.0
- 无 `npm run dev` / 本地 HTTP server

### Lint / test / build summary

| Task | How |
|------|-----|
| Lint | `npm run lint` |
| Test | `npm test` + 手工 `TEST_CHECKLIST.md` |
| Build / release | WeChat DevTools: Preview / Upload |

### Gotchas

- 不要期望在纯 Node 下调用 `wx` API；UI 流程需 DevTools 或真机。
- 午饭扣减 0.5h：打卡下班与记录编辑需写入 `mealDeducted`；`setHourlyRate` 按该标记重算。
- `saveRecords` 同步通知期间，页面 `onRecordsChanged` 不要再 `reloadRecordsFromStorage`。
- 导出失败时降级剪贴板；TXT 面向微信聊天阅读。
