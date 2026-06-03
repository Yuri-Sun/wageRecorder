# AGENTS.md

## 项目概览

**wageRecorder**：纯前端微信小程序，本地存储考勤与工资数据。业务计算集中在 `utils/wage.js`，`app.js` 负责 `wx` 存储与页面 API。

## Cursor Cloud 说明

### 依赖与脚本

```bash
npm install
npm test      # Node 内置 test runner，覆盖 utils/wage.js
npm run lint  # ESLint，ecmaVersion 2020
```

VM 启动更新脚本建议：`npm install`（见 `package.json`）。

### 运行 UI

须使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开仓库根目录。`app.json` 使用 Skyline；`project.private.config.json` 中 `skylineRenderEnable` 应为 `true`。

### 扣饭逻辑

统一通过 `utils/wage.js` 的 `applyMealDeduction` / `calcDurationAndWageWithMeal`；记录上持久化字段 `mealDeducted`，改时薪时 `recalcAllWages` 会保留扣饭。

### 手工回归

见 `TEST_CHECKLIST.md`。
