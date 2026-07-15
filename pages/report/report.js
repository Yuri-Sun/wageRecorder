// pages/report/report.js
const app = getApp()
const {
  getWeekRangeForAnchor,
  formatWeekRangeLabel,
  getMonthRangeForAnchor,
  formatMonthLabel,
  formatMonthPickerDisplay,
} = require('../../utils/report-range.js')
const { runPullDownRefresh } = require('../../utils/page-refresh.js')

const EMPTY_HINTS = {
  day: '当前所选日期所在周暂无打卡。请用上方日期切换其它周，或去首页打卡。',
  week: '当前所选周暂无打卡。请用上方日期切换其它周，或去首页打卡。',
  month: '所选月份暂无打卡。请用上方月份选择器切换其它月份，或去首页打卡。',
  none: '暂无任何打卡记录，请先去首页打卡。',
}

Page({
  data: {
    viewMode: 'month',
    anchorDate: '',
    maxDate: '',
    weekRangeLabel: '',
    anchorMonthDisplay: '',
    periodLabel: '本月',
    showAllMonthsNote: false,
    emptyHint: '',
    highlightIndex: -1,
    overview: { totalWage: 0, totalDuration: 0, totalCount: 0, avgWage: 0 },
    stats: [],
    chartRevision: 0,
  },

  onLoad() {
    const today = app.getDateString()
    this.setData({ anchorDate: today, maxDate: today, anchorMonthDisplay: formatMonthPickerDisplay(today) })
  },

  onShow() {
    if (!this.data.anchorDate) {
      const today = app.getDateString()
      this.setData({ anchorDate: today, anchorMonthDisplay: formatMonthPickerDisplay(today) })
    }
    this.refreshFromStorage()
  },

  onRecordsChanged() {
    this.loadStats()
  },

  onPullDownRefresh() {
    runPullDownRefresh(() => this.refreshFromStorage())
  },

  refreshFromStorage() {
    app.reloadRecordsFromStorage()
    const today = app.getDateString()
    const anchorDate = this.data.anchorDate || today
    this.setData({
      maxDate: today,
      anchorDate,
      anchorMonthDisplay: formatMonthPickerDisplay(anchorDate),
    })
    this.loadStats()
  },

  switchMode(e) {
    this.setData({ viewMode: e.currentTarget.dataset.mode })
    this.loadStats()
  },

  onAnchorDateChange(e) {
    const value = e.detail.value
    this.setData({
      anchorDate: value,
      anchorMonthDisplay: formatMonthPickerDisplay(value),
    })
    this.loadStats()
  },

  resolveHighlightIndex(stats, viewMode, anchorDate, today) {
    if (!stats.length) return -1
    if (viewMode === 'day' || viewMode === 'week') {
      const idx = stats.findIndex(s => s.date === anchorDate)
      return idx >= 0 ? idx : -1
    }
    if (viewMode === 'month') {
      const anchorMonth = anchorDate.substring(0, 7)
      if (!today.startsWith(anchorMonth)) return -1
      const idx = stats.findIndex(s => s.date === today)
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

  loadMonthDailyStats(anchorDate, today) {
    const anchorMonth = anchorDate.substring(0, 7)
    const { monthStart, monthEnd: monthEndRaw } = getMonthRangeForAnchor(anchorMonth)
    let monthEnd = monthEndRaw
    if (anchorMonth === today.substring(0, 7) && monthEnd > today) {
      monthEnd = today
    }

    let stats = app.getDailyStats(monthStart, monthEnd)
    stats = stats.sort((a, b) => a.date.localeCompare(b.date))
    const periodLabel = `${formatMonthLabel(anchorMonth, today)} (${monthStart.substring(5)} ~ ${monthEnd.substring(5)})`

    this.setData({
      weekRangeLabel: '',
      periodLabel,
      showAllMonthsNote: false,
      anchorMonthDisplay: formatMonthPickerDisplay(anchorDate),
    })
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

    if (viewMode === 'day' || viewMode === 'week') {
      stats = this.loadWeekDailyStats(anchorDate, viewMode)
      stats = this.formatStats(stats, s => s.date.substring(5))
    } else {
      stats = this.loadMonthDailyStats(anchorDate, today)
      stats = this.formatStats(stats, s => s.date.substring(5))
    }

    const highlightIndex = this.resolveHighlightIndex(stats, viewMode, anchorDate, today)
    const totalWage = Math.round(stats.reduce((sum, s) => sum + s.wage, 0) * 100) / 100
    const totalDuration = Math.round(stats.reduce((sum, s) => sum + s.duration, 0) * 100) / 100
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0)
    const avgWage = stats.length > 0 ? Math.round((totalWage / stats.length) * 100) / 100 : 0
    const emptyHint = stats.length === 0 ? this.resolveEmptyHint(viewMode, hasAnyRecords) : ''

    this.setData({
      stats,
      chartRevision: (this.data.chartRevision || 0) + 1,
      highlightIndex,
      overview: { totalWage, totalDuration, totalCount, avgWage },
      emptyHint,
      showAllMonthsNote: false,
    })
  },
})
