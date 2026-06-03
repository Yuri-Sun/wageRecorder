# wageRecorder 微信小程序 UI / 设计规范 Review 报告

> **审查日期**：2026-06-03  
> **代码基准**：分支 `cursor/ui-layout-fix-0905`  
> **依据**：[微信小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/)、[WeUI 组件库说明](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/extended/weui/)、[Skyline 迁移兼容说明](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/migration/compatibility.html)

---

## 1. 审查方法与布局理念对照

微信官方设计指南的核心可归纳为：

| 维度 | 官方要求（摘要） | 本工程应对方式 |
|------|------------------|----------------|
| **友好礼貌** | 每页有重点、流程不被打断 | 打卡 / 记录 / 报表 / 设置 四 Tab 分工清晰 |
| **清晰明确** | 导航明确、Tab 2–5 个、预留右上角胶囊区 | 自定义 `navigation-bar` + 底部 Tab（4 项） |
| **及时反馈** | 加载/结果反馈，慎用全屏模态加载 | 以 `wx.showToast`、编辑弹窗为主 |
| **便捷优雅** | 少输入、用热区足够的控件、用接口 | 时间/日期用 `picker`，导出可选范围 |
| **统一稳定** | 控件与交互跨页一致 | `styles/ui-kit.wxss` 统一卡片/列表/分段栏 |
| **视觉规范** | 字号阶梯、色板、列表/表单/按钮 | 主色 `#07C160`，分组白卡片 + 灰底 `#ededed` |

设计稿基准：指南建议 **375px 或 390px** 宽；工程使用 **rpx**（750 设计宽惯例），与微信开发工具一致，**合理**。

---

## 2. 项目 UI 架构概览

```
app.json          → TabBar(4) + navigationStyle: custom + Skyline + glass-easel
app.wxss          → @import ui-kit
components/
  navigation-bar/ → 适配胶囊区、安全区（类 WeUI 导航）
  wage-chart/     → ECharts 封装（ec-canvas + echarts.js ~1MB）
  ec-canvas/      → 图表底层
styles/ui-kit.wxss → 自研 WeUI 风格套件（非 npm WeUI）
pages/
  index/   打卡首页
  record/  记录列表 + 编辑弹窗
  report/  分段统计 + 日期/月份选择 + 图表 + 表格
  settings/ 时薪、导出范围、清空
utils/            → wage / report-range / chart-option / record-filter
```

**结论**：信息架构符合「工具类考勤」场景；**未使用** `useExtendedLib.weui`，而是 **自研 ui-kit + 部分 WeUI 导航结构**，在 Skyline 下是务实选择。

---

## 3. 符合规范的亮点

1. **Tab 导航**  
   - 4 个 Tab（打卡 / 记录 / 报表 / 设置），符合「不少于 2、不多于 5、建议不超过 4」的上限建议。  
   - 首页为 Tab 根页，`back="{{false}}"`，符合 Tab 场景无需返回键的习惯。

2. **自定义导航栏**  
   - `navigation-bar` 使用 `getMenuButtonBoundingClientRect()` 预留右侧胶囊区域，符合「勿与官方菜单冲突」的要求。  
   - 部分节点具备 `aria-role` / `aria-label`（返回、加载），优于多数仅视觉实现的项目。

3. **视觉统一**  
   - 设置 / 报表 / 记录 / 首页（wxss 已引 ui-kit）采用 **灰底 + 圆角白卡片 + 绿色主色**，与 WeUI/微信绿一致。  
   - 金额展示已统一为 **A$**（与产品澳元定位一致）。

4. **减少输入**  
   - 打卡依赖当前时间；记录编辑用 `picker`；报表按天/周/月选择；导出支持日期范围与「本周/本月/全部」预设。

5. **异常与危险操作**  
   - 删除记录、清空数据均有 **二次确认** `wx.showModal`，符合「异常可控、有路可退」。  
   - 空状态（`ui-empty`）在首页/记录/报表均有文案引导。

6. **工程化**  
   - 业务逻辑抽离 `utils/wage.js`、`report-range.js` 等，UI 与计算分离。  
   - 具备 `npm test` / ESLint，利于重构 UI 时不破坏逻辑。

---

## 4. 问题与风险（按优先级）

### P0 — 建议优先处理

| # | 问题 | 规范关联 | 建议 |
|---|------|----------|------|
| 1 | **Skyline 全局开启，但未验证 WebView 回退** | 低版本微信 / 部分端仍可能走 WebView | 在 `app.json` 评估 `rendererOptions` 或按页降级；真机矩阵测试 |
| 2 | **ECharts 整包 ~1MB** | 性能/首包体积 | 使用 [echarts.custom.js](https://echarts.apache.org/handbook/zh/best-practices/cross-platform/) 按需引入，或报表页再懒加载；监控主包大小 |
| 3 | **未使用 `useExtendedLib.weui` 且 Skyline 下扩展库不稳定** | 统一稳定 | **维持自研 ui-kit 即可**；若引入 WeUI，应用 **npm + 构建**，勿仅依赖扩展库 |

### P1 — 体验与规范差距

| # | 问题 | 规范关联 | 建议 |
|---|------|----------|------|
| 4 | **列表页无下拉刷新** | 页面下拉刷新（官方标准能力） | 记录/报表 `enablePullDownRefresh` + `onPullDownRefresh` 调 `reloadRecordsFromStorage` |
| 5 | **数据加载无局部/骨架反馈** | 减少等待焦虑 | `loadStats` / `loadRecords` 时轻量 loading（导航栏 `loading` 或列表 skeleton） |
| 6 | **记录页筛选：日期嵌在 segment 内** | 导航简单、点击热区 | 与报表一致，独立一行「筛选日期」；segment 仅保留 全部/本周/本月 |
| 7 | **编辑弹窗为自定义 mask，非 WeUI Dialog** | 模态反馈 | 可复用 `mp-dialog`（npm weui）或统一 `ui-dialog` 组件，保证安全区与滚动锁定 |
| 8 | **报表页信息密度高** | 重点突出 | 总览 + 图 + 表三段合理；可考虑默认折叠表格或「仅图表」切换 |

### P2 — 优化项

| # | 问题 | 建议 |
|---|------|------|
| 9 | 无 Dark Mode | 根节点 `data-weui-theme="dark"` + ui-kit 暗色变量（若目标用户夜间使用多） |
| 10 | 无障碍不完整 | 按钮/列表项补充 `aria-role`；图表提供表格备选（已有表格，可强调） |
| 11 | README / 设计说明薄弱 | 链接本报告与 `TEST_CHECKLIST.md` |
| 12 | `scroll-view` + `type="list"` 混用 | 核对 Skyline 下 scroll-view 文档，避免双滚动条 |

---

## 5. 分页面布局 Review

### 5.1 首页（打卡）

| 项 | 评价 |
|----|------|
| 布局 | 时钟 Hero → 三列统计 → 打卡区 → 最近记录，**层次清楚**，符合「重点突出」 |
| 热区 | 主按钮 `btn-primary` 全宽，满足点击区域建议 |
| 反馈 | 打卡成功/失败 Toast；上班中实时刷新工资 |
| 改进 | 最近记录可考虑 swipe 删除入口说明；跨天重置逻辑宜在 UI 上提示一次 |

### 5.2 记录

| 项 | 评价 |
|----|------|
| 布局 | 顶部分段筛选 + 汇总网格 + 列表，模式清晰 |
| 问题 | 日期 picker 与 segment 混排，**可发现性弱**；编辑弹窗内字段多，小屏略挤 |
| 改进 | 日期行独立；表单项错误态（如下班早于上班）原位提示（规范：表单报错） |

### 5.3 报表

| 项 | 评价 |
|----|------|
| 布局 | 分段（天/周/月）+ 日期条 + Hero 总览 + 图表 + 表格，**功能完整** |
| 规范 | 时间维度与导出能力对齐，空状态文案已区分模式 |
| 问题 | 图表依赖 ECharts，弱网/低端机首绘慢；按月/周明细行多时横向标签旋转依赖 chart-option |
| 改进 | 打开报表 Tab 时考虑 `chartRevision` 已有；可加「数据更新时间」脚注 |

### 5.4 设置

| 项 | 评价 |
|----|------|
| 布局 | 时薪表单 + 数据概览 + 导出范围 + 危险操作，**符合设置页惯例** |
| 规范 | 导出范围选择减少全量误导出；清空二次确认 |
| 改进 | 时薪未保存离开页时可提示；导出成功除 Toast 外可显示条数摘要 |

---

## 6. 是否引入现有 UI 库？

### 6.1 官方 WeUI（`weui-miniprogram` / `weui-wxss`）

| 优点 | 缺点 |
|------|------|
| 与微信视觉一致 | 工程已 **Skyline + 自研 ui-kit**，扩展库在 Skyline 下曾有「不显示」反馈 |
| Dialog、Actionsheet、Form 现成 | 全量引入样式冗余；需 npm 构建 |

**建议**：**不必整体迁移**。按需引入 **`mp-dialog` / `mp-actionSheet`** 等 1–2 个组件即可；样式继续以 ui-kit 为主。

### 6.2 第三方（Vant / TDesign）

| 库 | Skyline | 建议 |
|----|---------|------|
| Vant Weapp | 支持不完善 | **不推荐**为主 UI（除非改 WebView 或等官方适配） |
| TDesign Miniprogram | 有 Skyline 讨论/迭代 | 可作为 **长期备选**；迁移成本高，当前规模不必换 |

### 6.3 图表库

| 方案 | 评价 |
|------|------|
| 当前 `echarts-for-weixin` | 功能强，**体积大** |
| 简易 canvas 自绘柱图 | 体积小，已废弃，**不推荐回退** |
| 按需 ECharts | **推荐**：仅注册 bar + tooltip |

### 6.4 结论（库选型）

```
保留：ui-kit（主 UI） + navigation-bar + wage-chart（按需瘦身 ECharts）
可选引入：weui-miniprogram 的 dialog / half-screen-dialog（npm）
不建议：全量 Vant/TDesign 替换、useExtendedLib.weui 直引（Skyline）
```

---

## 7. UI 布局合理性总评

| 维度 | 评分（5 分制） | 说明 |
|------|----------------|------|
| 信息架构 | 4.5 | Tab 划分合理，路径短 |
| 视觉一致性 | 4.0 | ui-kit 已统一；历史页面需防回退旧样式 |
| 规范符合度 | 3.5 | 缺下拉刷新、加载反馈、表单错误态 |
| 可维护性 | 4.0 | 样式集中；组件文档可加强 |
| 性能/包体 | 3.0 | ECharts 拖累；Skyline 需持续验证 |
| **综合** | **3.8 / 5** | 实用可用，接近微信官方体验，仍有规范与性能优化空间 |

---

## 8. 推荐行动计划（建议顺序）

1. **包体**：ECharts 按需构建，或仅报表分包加载（若未来开分包）。  
2. **体验**：记录/报表/设置 `onPullDownRefresh` + 轻量 loading。  
3. **布局**：记录页筛选区与报表日期条对齐；编辑表单增加校验提示。  
4. **兼容**：真机测试 Skyline / 非 Skyline；记录 `renderer` 差异。  
5. **文档**：README 增加「设计约定」：主色、字号、ui-kit 类名索引。  
6. **可选**：npm 引入 `mp-dialog` 替换手写 modal-mask。

---

## 9. 参考资料

- [微信小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/)  
- [WeUI 组件库](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/extended/weui/)  
- [weui-wxss（GitHub）](https://github.com/Tencent/weui-wxss)  
- [Skyline 常见兼容问题](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/migration/compatibility.html)  
- 工程内：`styles/ui-kit.wxss`、`docs/CHARTS.md`（若存在）、`TEST_CHECKLIST.md`

---

*本报告为静态代码审查 + 官方公开文档对照，未替代真机走查与无障碍专项测试。*
