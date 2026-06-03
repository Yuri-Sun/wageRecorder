// app.js
const wageUtil = require('./utils/wage.js')

App({
  globalData: {
    hourlyRate: 25, // 默认时薪
    records: [] // 打卡记录 [{id, date, startTime, endTime, duration, wage, note, mealDeducted?}]
  },

  onLaunch() {
    // 从本地存储加载数据
    const hourlyRate = wx.getStorageSync('hourlyRate')
    if (hourlyRate) {
      this.globalData.hourlyRate = hourlyRate
    }
    const records = wx.getStorageSync('records')
    if (records) {
      this.globalData.records = records
    }
  },

  // 获取时薪
  getHourlyRate() {
    return this.globalData.hourlyRate
  },

  // 设置时薪
  setHourlyRate(rate) {
    this.globalData.hourlyRate = rate
    wx.setStorageSync('hourlyRate', rate)
    // 重新计算所有记录工资
    this.recalcAllWages()
  },

  // 获取所有记录
  getRecords() {
    return this.globalData.records
  },

  // 保存记录列表
  saveRecords() {
    wx.setStorageSync('records', this.globalData.records)
  },

  // 计算单条记录的工时（小时）和工资
  calcDurationAndWage(startTime, endTime) {
    return wageUtil.calcDurationAndWage(startTime, endTime, this.globalData.hourlyRate)
  },

  // 扣除午饭时间（统一入口）
  applyMealDeduction(duration, wage) {
    return wageUtil.applyMealDeduction(duration, wage, this.globalData.hourlyRate)
  },

  // 按起止时间计算，可选扣午饭
  calcDurationAndWageWithMeal(startTime, endTime, deductMeal) {
    return wageUtil.calcDurationAndWageWithMeal(
      startTime,
      endTime,
      this.globalData.hourlyRate,
      deductMeal
    )
  },

  // 重新计算所有记录工资（保留已标记的扣饭记录）
  recalcAllWages() {
    this.globalData.records = this.globalData.records.map(r => {
      let { duration, wage } = this.calcDurationAndWage(r.startTime, r.endTime)
      if (r.mealDeducted) {
        ;({ duration, wage } = this.applyMealDeduction(duration, wage))
      }
      return { ...r, duration, wage }
    })
    this.saveRecords()
  },

  // 添加上下班打卡
  addPunch(date, startTime, endTime, note = '', options = {}) {
    const deductMeal = !!options.deductMeal
    const { duration, wage } = this.calcDurationAndWageWithMeal(startTime, endTime, deductMeal)
    const record = {
      id: Date.now().toString(),
      date,
      startTime,
      endTime,
      duration,
      wage,
      note,
      mealDeducted: deductMeal,
    }
    this.globalData.records.unshift(record)
    this.saveRecords()
    return record
  },

  // 更新记录
  updateRecord(id, data) {
    const idx = this.globalData.records.findIndex(r => r.id === id)
    if (idx !== -1) {
      if (data.startTime !== undefined || data.endTime !== undefined) {
        const record = this.globalData.records[idx]
        const startTime = data.startTime ?? record.startTime
        const endTime = data.endTime ?? record.endTime
        const mealDeducted = data.mealDeducted ?? record.mealDeducted
        const calculated = this.calcDurationAndWageWithMeal(startTime, endTime, mealDeducted)
        const duration = data.duration ?? calculated.duration
        const wage = data.wage ?? calculated.wage
        this.globalData.records[idx] = {
          ...this.globalData.records[idx],
          ...data,
          duration,
          wage,
          mealDeducted,
        }
      } else {
        this.globalData.records[idx] = { ...this.globalData.records[idx], ...data }
      }
      this.saveRecords()
    }
  },

  // 删除记录
  deleteRecord(id) {
    this.globalData.records = this.globalData.records.filter(r => r.id !== id)
    this.saveRecords()
  },

  // 计算今日已工作时长
  getTodayWorkInfo() {
    const today = this.getDateString()
    const records = this.globalData.records.filter(r => r.date === today)
    let totalDuration = 0
    let totalWage = 0
    records.forEach(r => {
      totalDuration += r.duration
      totalWage += r.wage
    })
    const duration = wageUtil.round2(totalDuration)
    const wage = wageUtil.round2(totalWage)
    return {
      duration,
      wage,
      totalDuration: duration,
      totalWage: wage,
    }
  },

  // 获取日期字符串 yyyy-MM-dd
  getDateString(date = new Date()) {
    return wageUtil.getDateString(date)
  },

  // 获取当前时间字符串 HH:mm
  getTimeString(date = new Date()) {
    return wageUtil.getTimeString(date)
  },

  // 按天统计（指定日期范围）
  getDailyStats(startDate, endDate) {
    const stats = {}
    this.globalData.records.forEach(r => {
      if (r.date >= startDate && r.date <= endDate) {
        if (!stats[r.date]) stats[r.date] = { duration: 0, wage: 0, count: 0 }
        stats[r.date].duration += r.duration
        stats[r.date].wage += r.wage
        stats[r.date].count++
      }
    })
    return Object.entries(stats).map(([date, data]) => ({
      date,
      ...data,
      duration: wageUtil.round2(data.duration),
      wage: wageUtil.round2(data.wage),
    })).sort((a, b) => b.date.localeCompare(a.date))
  },

  // 按周统计
  getWeeklyStats(startDate, endDate) {
    const weeks = {}
    this.globalData.records.forEach(r => {
      if (r.date >= startDate && r.date <= endDate) {
        const d = new Date(r.date)
        const weekStart = this.getWeekStart(d)
        if (!weeks[weekStart]) weeks[weekStart] = { duration: 0, wage: 0, count: 0 }
        weeks[weekStart].duration += r.duration
        weeks[weekStart].wage += r.wage
        weeks[weekStart].count++
      }
    })
    return Object.entries(weeks).map(([week, data]) => ({
      week: `${week} ~ ${this.getWeekEnd(new Date(week))}`,
      duration: wageUtil.round2(data.duration),
      wage: wageUtil.round2(data.wage),
      count: data.count,
    })).sort((a, b) => b.week.localeCompare(a.week))
  },

  // 按月统计
  getMonthlyStats(startDate, endDate) {
    const months = {}
    this.globalData.records.forEach(r => {
      if (r.date >= startDate && r.date <= endDate) {
        const month = r.date.substring(0, 7)
        if (!months[month]) months[month] = { duration: 0, wage: 0, count: 0 }
        months[month].duration += r.duration
        months[month].wage += r.wage
        months[month].count++
      }
    })
    return Object.entries(months).map(([month, data]) => ({
      month,
      duration: wageUtil.round2(data.duration),
      wage: wageUtil.round2(data.wage),
      count: data.count,
    })).sort((a, b) => b.month.localeCompare(a.month))
  },

  // 获取周一日期
  getWeekStart(date) {
    return wageUtil.getWeekStart(date, d => this.getDateString(d))
  },

  // 获取周日日期
  getWeekEnd(date) {
    return wageUtil.getWeekEnd(date, d => this.getDateString(d))
  },

  // 导出为 CSV
  exportCSV(records) {
    const escapeCsv = value => {
      const text = String(value ?? '')
      if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }

    let csv = '日期,上班时间,下班时间,工时(小时),工资,备注\n'
    records.forEach(r => {
      csv += [
        escapeCsv(r.date),
        escapeCsv(r.startTime),
        escapeCsv(r.endTime),
        escapeCsv(r.duration),
        escapeCsv(r.wage),
        escapeCsv(r.note || ''),
      ].join(',') + '\n'
    })
    return csv
  },

  // 导出为 TXT
  exportTXT(records) {
    let txt = '考勤与薪资记录\n'
    txt += '='.repeat(40) + '\n'
    txt += `时薪: A$${this.globalData.hourlyRate}/小时\n`
    txt += '='.repeat(40) + '\n\n'
    records.forEach(r => {
      txt += `日期: ${r.date}\n`
      txt += `上班: ${r.startTime}  下班: ${r.endTime}\n`
      txt += `工时: ${r.duration} 小时  工资: A$${r.wage}\n`
      if (r.note) txt += `备注: ${r.note}\n`
      txt += '-'.repeat(30) + '\n'
    })
    return txt
  },
})
