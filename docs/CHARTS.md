# 图表与表格方案说明

## 库选型结论

| 方案 | 体积 | 适用场景 | 本项目 |
|------|------|----------|--------|
| **[echarts-for-weixin](https://github.com/ecomfe/echarts-for-weixin)** | ~1MB（可 [在线定制](https://echarts.apache.org/zh/builder.html) 缩减） | 柱状/折线/饼图、Tooltip、交互 | **已集成**（报表页工资趋势） |
| **uCharts** | ~200KB | 跨端、轻量 | 未采用（原生小程序文档较弱） |
| **wx-charts** | ~50KB | 极简图表 | 未采用（功能较少） |
| **WeUI Cells + 自研表格** | 无额外依赖 | 设置、列表、工资明细表 | **已采用** |

工资**表格**在小程序中无 HTML `<table>`，采用 `styles/ui-kit.wxss` 中的 `ui-table`（表头 + 行 flex 布局），适合明细只读展示。

完整考勤导出仍使用设置页的 **CSV / TXT**（Excel 打开或分享）。

## 项目内图表组件

- `components/ec-canvas/`：官方 ECharts 小程序画布（来自 echarts-for-weixin）
- `components/wage-chart/`：工资柱状图封装
- `utils/chart-option.js`：柱状图 option 构建（可在 Node 中单测）

报表页 `pages/report` 使用：

```xml
<wage-chart stats="{{stats}}" avg-wage="{{overview.avgWage}}" />
```

## 体积优化（可选）

若包体积超限，可在 [ECharts 在线构建](https://echarts.apache.org/zh/builder.html) 仅勾选「柱状图」相关模块，替换 `components/ec-canvas/echarts.js`。

## 验证

```bash
npm test   # 含 utils/chart-option 用例
```

在微信开发者工具打开 **报表** Tab，需基础库 ≥ 2.9.0（Canvas 2d）。
