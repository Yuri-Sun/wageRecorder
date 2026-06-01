// pages/report/report.js
const app = getApp()

Page({
  data: {
    viewMode: 'month', // 'day' | 'week' | 'month'
    periodLabel: '本月',
    overview: { totalWage: 0, totalDuration: 0, totalCount: 0, avgWage: 0 },
    stats: [],
    chartHeight: 300
  },

  onShow() {
    this.loadStats()
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    const labels = { day: '今日', week: '本周', month: '本月' }
    this.setData({ viewMode: mode, periodLabel: labels[mode] })
    this.loadStats()
  },

  loadStats() {
    const app = getApp()
    const now = new Date()
    const today = app.getDateString()
    let stats = []
    let startDate, endDate

    if (this.data.viewMode === 'day') {
      startDate = today
      endDate = today
      stats = app.getDailyStats(startDate, endDate)
      // 如果当天没有数据，显示最近7天
      if (stats.length === 0) {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 6)
        startDate = app.getDateString(weekAgo)
        endDate = today
        stats = app.getDailyStats(startDate, endDate)
        this.setData({ periodLabel: '近7天' })
      } else {
        this.setData({ periodLabel: '今日' })
      }
    } else if (this.data.viewMode === 'week') {
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diff)
      startDate = app.getDateString(weekStart)
      endDate = today
      stats = app.getWeeklyStats(startDate, endDate)
      this.setData({ periodLabel: '本周' })
    } else {
      startDate = today.substring(0, 7) + '-01'
      endDate = today
      stats = app.getMonthlyStats(startDate, endDate)
      // 如果当月无数据，显示所有月份
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
    }

    // 格式化标签
    const mode = this.data.viewMode
    stats = stats.map(s => {
      let label = ''
      if (mode === 'day') label = s.date.substring(5) // MM-DD
      else if (mode === 'week') {
        const parts = s.week.split(' ~ ')
        if (parts.length === 2) {
          label = parts[0].substring(5) + '~' + parts[1].substring(5) // 01-05~01-11
        } else {
          label = s.week.substring(0, 10)
        }
      } else label = s.month
      return { ...s, label }
    })

    // 计算总览
    const totalWage = Math.round(stats.reduce((sum, s) => sum + s.wage, 0) * 100) / 100
    const totalDuration = Math.round(stats.reduce((sum, s) => sum + s.duration, 0) * 100) / 100
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0)
    const avgWage = stats.length > 0 ? Math.round((totalWage / stats.length) * 100) / 100 : 0

    // 计算柱状图高度
    const maxWage = stats.length > 0 ? Math.max(...stats.map(s => s.wage)) : 1
    const barMaxHeight = 200
    stats = stats.map(s => ({
      ...s,
      barHeight: maxWage > 0 ? Math.max(4, (s.wage / maxWage) * barMaxHeight) : 0
    }))

    this.setData({
      stats,
      overview: { totalWage, totalDuration, totalCount, avgWage },
      chartHeight: barMaxHeight + 60
    })
  }
})
