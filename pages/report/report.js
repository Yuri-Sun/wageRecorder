// pages/report/report.js
const app = getApp()
const { getWeekRangeForAnchor, formatWeekRangeLabel } = require('../../utils/report-range.js')

const EMPTY_HINTS = {
  day: '当前所选日期所在周暂无打卡。请用上方日期切换其它周，或去首页打卡。',
  week: '当前所选周暂无打卡。请用上方日期切换其它周，或去首页打卡。',
  month: '本月暂无打卡。若其它月份有记录，将自动展示「全部月份」汇总；按天/按周可用上方日期选择器查看具体周。',
  none: '暂无任何打卡记录，请先去首页打卡。',
}

Page({
  data: {
    viewMode: 'month',
    anchorDate: '',
    maxDate: '',
    weekRangeLabel: '',
    periodLabel: '本月',
    showAllMonthsNote: false,
    emptyHint: '',
    highlightIndex: -1,
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
    this.setData({ viewMode: e.currentTarget.dataset.mode })
    this.loadStats()
  },

  onAnchorDateChange(e) {
    this.setData({ anchorDate: e.detail.value })
    this.loadStats()
  },

  /**
   * 图表/表格高亮下标：按天、按周 → 选中 anchorDate；按月 → 当前自然月（若有数据）
   */
  resolveHighlightIndex(stats, viewMode, anchorDate, today) {
    if (!stats.length) return -1
    if (viewMode === 'day' || viewMode === 'week') {
      const idx = stats.findIndex(s => s.date === anchorDate)
      return idx >= 0 ? idx : -1
    }
    if (viewMode === 'month') {
      const currentMonth = today.substring(0, 7)
      const idx = stats.findIndex(s => s.month === currentMonth)
      return idx >= 0 ? idx : -1
    }
    return -1
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

    this.setData({ weekRangeLabel: weekLabel, periodLabel, showAllMonthsNote: false })
    return stats
  },

  formatStats(stats, labelFn) {
    return stats.map(s => {
      const label = labelFn(s)
      return {
        ...s,
        keyId: s.date || s.month || label,
        label,
      }
    })
  },

  resolveEmptyHint(viewMode, hasAnyRecords) {
    if (!hasAnyRecords) return EMPTY_HINTS.none
    if (viewMode === 'day') return EMPTY_HINTS.day
    if (viewMode === 'week') return EMPTY_HINTS.week
    return EMPTY_HINTS.month
  },

  loadStats() {
    const today = app.getDateString()
    const anchorDate = this.data.anchorDate || today
    const viewMode = this.data.viewMode
    const allRecords = app.getRecords()
    const hasAnyRecords = allRecords.length > 0
    let stats = []
    let showAllMonthsNote = false
    let periodLabel = this.data.periodLabel

    if (viewMode === 'day' || viewMode === 'week') {
      stats = this.loadWeekDailyStats(anchorDate, viewMode)
      stats = this.formatStats(stats, s => s.date.substring(5))
    } else {
      let startDate = today.substring(0, 7) + '-01'
      let endDate = today
      stats = app.getMonthlyStats(startDate, endDate)
      if (stats.length === 0 && hasAnyRecords) {
        const dates = allRecords.map(r => r.date).sort()
        startDate = dates[0]
        endDate = dates[dates.length - 1]
        stats = app.getMonthlyStats(startDate, endDate)
        periodLabel = '全部月份'
        showAllMonthsNote = true
      } else if (stats.length > 0) {
        periodLabel = '本月'
        showAllMonthsNote = false
      } else {
        periodLabel = '本月'
        showAllMonthsNote = false
      }
      this.setData({ weekRangeLabel: '', periodLabel, showAllMonthsNote })
      stats = this.formatStats(stats, s => s.month)
    }

    const highlightIndex = this.resolveHighlightIndex(stats, viewMode, anchorDate, today)
    const totalWage = Math.round(stats.reduce((sum, s) => sum + s.wage, 0) * 100) / 100
    const totalDuration = Math.round(stats.reduce((sum, s) => sum + s.duration, 0) * 100) / 100
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0)
    const avgWage = stats.length > 0 ? Math.round((totalWage / stats.length) * 100) / 100 : 0
    const emptyHint = stats.length === 0 ? this.resolveEmptyHint(viewMode, hasAnyRecords) : ''

    this.setData({
      stats,
      highlightIndex,
      overview: { totalWage, totalDuration, totalCount, avgWage },
      emptyHint,
      showAllMonthsNote: viewMode === 'month' ? showAllMonthsNote : false,
    })
  },
})
