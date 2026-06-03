# AGENTS.md

## 项目概览

**wageRecorder**：微信小程序，本地考勤与澳元（A$）工资计算。

- 业务逻辑：`utils/wage.js` + `app.js`
- 界面：`styles/ui-kit.wxss`（WeUI 风格分组列表）
- 图表：`components/wage-chart` + `components/ec-canvas`（ECharts）
- 说明：`docs/CHARTS.md`

## 开发命令

```bash
npm install
npm test
npm run lint
```

## Cursor Cloud

- VM 更新脚本：`npm install`
- UI 需在 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 预览
- Skyline：`app.json` + `skylineRenderEnable: true`
- 报表 ECharts 需基础库 ≥ 2.9.0

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

手工回归：`TEST_CHECKLIST.md`
