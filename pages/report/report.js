// pages/report/report.js
const app = getApp()
const { getWeekRangeForAnchor, formatWeekRangeLabel } = require('../../utils/report-range.js')

/** 柱状图绘图区高度（仅柱体+柱顶金额） */
const CHART_PLOT_HEIGHT = 200
/** 柱体上方预留金额文字高度 */
const CHART_VALUE_RESERVE = 36
/** 柱体下方日期标签区域 */
const CHART_LABEL_AREA = 48

Page({
  data: {
    viewMode: 'month',
    anchorDate: '',
    maxDate: '',
    weekRangeLabel: '',
    periodLabel: '本月',
    chartPlotHeight: CHART_PLOT_HEIGHT,
    chartScrollHeight: CHART_PLOT_HEIGHT + CHART_LABEL_AREA,
    overview: { totalWage: 0, totalDuration: 0, totalCount: 0, avgWage: 0 },
    stats: [],
  },

  onLoad() {
    const today = app.getDateString()
    this.setData({ anchorDate: today, maxDate: today })
  },

  onShow() {
    const today = app.getDateString()
    if (!this.data.anchorDate) {
      this.setData({ anchorDate: today, maxDate: today })
    } else {
      this.setData({ maxDate: today })
    }
    this.loadStats()
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ viewMode: mode })
    this.loadStats()
  },

  onAnchorDateChange(e) {
    this.setData({ anchorDate: e.detail.value })
    this.loadStats()
  },

  loadWeekDailyStats(anchorDate, viewMode) {
    const { weekStart, weekEnd } = getWeekRangeForAnchor(anchorDate)
    let stats = app.getDailyStats(weekStart, weekEnd)
    stats = stats.sort((a, b) => a.date.localeCompare(b.date))

    const weekLabel = formatWeekRangeLabel(weekStart, weekEnd)
    const today = app.getDateString()
    let periodLabel
    if (viewMode === 'day') {
      periodLabel = anchorDate === today ? `今日 (${weekLabel})` : `${anchorDate} (${weekLabel})`
    } else {
      periodLabel = `本周 ${weekLabel}`
    }

    this.setData({ weekRangeLabel: weekLabel, periodLabel })
    return stats
  },

  formatStatsWithChart(stats, labelFn) {
    const maxWage = Math.max(...stats.map(s => s.wage), 0.01)
    const barMax = CHART_PLOT_HEIGHT - CHART_VALUE_RESERVE

    return stats.map(s => {
      const label = labelFn(s)
      return {
        ...s,
        keyId: s.date || s.month || label,
        label,
        barHeight: Math.max(4, Math.round((s.wage / maxWage) * barMax)),
      }
    })
  },

  loadStats() {
    const today = app.getDateString()
    const anchorDate = this.data.anchorDate || today
    let stats = []

    if (this.data.viewMode === 'day' || this.data.viewMode === 'week') {
      stats = this.loadWeekDailyStats(anchorDate, this.data.viewMode)
      stats = this.formatStatsWithChart(stats, s => s.date.substring(5))
    } else {
      let startDate = today.substring(0, 7) + '-01'
      let endDate = today
      stats = app.getMonthlyStats(startDate, endDate)
      if (stats.length === 0) {
        const allRecords = app.getRecords()
        if (allRecords.length > 0) {
          const dates = allRecords.map(r => r.date).sort()
          startDate = dates[0]
          endDate = dates[dates.length - 1]
          stats = app.getMonthlyStats(startDate, endDate)
        }
        this.setData({ periodLabel: '全部月份' })
      } else {
        this.setData({ periodLabel: '本月' })
      }
      stats = this.formatStatsWithChart(stats, s => s.month)
    }

    const totalWage = Math.round(stats.reduce((sum, s) => sum + s.wage, 0) * 100) / 100
    const totalDuration = Math.round(stats.reduce((sum, s) => sum + s.duration, 0) * 100) / 100
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0)
    const avgWage = stats.length > 0 ? Math.round((totalWage / stats.length) * 100) / 100 : 0

    this.setData({
      stats,
      overview: { totalWage, totalDuration, totalCount, avgWage },
    })
  },
})
