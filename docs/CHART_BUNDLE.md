# 报表图表包体说明

## 当前方案

- 使用 Apache ECharts **`echarts.common.min.js`**（含柱状图、折线、饼图及 grid/tooltip 等常用组件）。
- 构建命令：`npm run build:echarts`（将 `node_modules/echarts/dist/echarts.common.min.js` 复制到 `components/ec-canvas/echarts.js`）。
- 相对原先整包 `echarts.min.js`（约 1MB）体积约减少 **35%**。

## 为何未做「报表分包」

- 报表页在 **TabBar 主包** 中，微信要求 Tab 页位于主包；图表组件随报表页加载，拆到独立分包对主包体积帮助有限，且需改造 Tab / 分包异步化。
- 若未来去掉报表 Tab 或采用分包异步化，可将 `components/ec-canvas` 迁入分包并配合按需构建。

## 维护

升级 `echarts` 版本后执行：

```bash
npm install
npm run build:echarts
npm test
```
