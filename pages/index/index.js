// pages/index/index.js
const app = getApp()

Page({
  data: {
    dateText: '',
    timeText: '',
    weekday: '',
    hourlyRate: 25,
    todayWork: { duration: 0, wage: 0 },
    todayPunchCount: 0,
    punchState: 'off', // 'off' | 'on' | 'done'
    startTime: '',
    liveDuration: '0.00',
    liveWage: '0.00',
    deductMeal: false,
    recentRecords: []
  },

  timer: null,

  onShow() {
    this.updateClock()
    this.timer = setInterval(() => this.updateClock(), 60000)
    this.refreshData()
  },

  onHide() {
    if (this.timer) clearInterval(this.timer)
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },

  updateClock() {
    const now = new Date()
    const app = getApp()
    const dateText = app.getDateString(now)
    const timeText = app.getTimeString(now)
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[now.getDay()]

    const updateData = { dateText, timeText, weekday }

    // 上班中：实时计算工作时长
    if (this.data.punchState === 'on' && this.data.startTime) {
      const result = app.calcDurationAndWage(this.data.startTime, timeText)
      updateData.liveDuration = result.duration.toFixed(2)
      updateData.liveWage = result.wage.toFixed(2)
    }

    this.setData(updateData)

    // 检查跨天：如果上次打卡是上班状态且日期变了，自动重置
    if (this.data.punchState === 'on' && this.data._punchDate && this.data._punchDate !== dateText) {
      this.setData({ punchState: 'off', startTime: '', liveDuration: '0.00', liveWage: '0.00' })
    }
  },

  refreshData() {
    const app = getApp()
    const hourlyRate = app.getHourlyRate()
    const todayWorkRaw = app.getTodayWorkInfo()
    const todayWork = {
      duration: todayWorkRaw.duration ?? todayWorkRaw.totalDuration ?? 0,
      wage: todayWorkRaw.wage ?? todayWorkRaw.totalWage ?? 0
    }
    const records = app.getRecords()
    const today = app.getDateString()
    const todayRecords = records.filter(r => r.date === today)
    const todayPunchCount = todayRecords.length
    const recentRecords = records.slice(0, 5)

    // 判断打卡状态
    let punchState = 'off'
    let startTime = ''
    if (todayRecords.length > 0) {
      const lastRecord = todayRecords[0]
      punchState = 'done'
      startTime = lastRecord.startTime
    }

    // 检查是否有未完成的打卡（仅上班没下班的情况）
    const pendingPunch = wx.getStorageSync('pendingPunch')
    if (pendingPunch && pendingPunch.date === today) {
      punchState = 'on'
      startTime = pendingPunch.startTime
    }

    // 上班中：立即计算实时工作时长
    let liveDuration = '0.00'
    let liveWage = '0.00'
    if (punchState === 'on' && startTime) {
      const now = new Date()
      const timeText = app.getTimeString(now)
      const result = app.calcDurationAndWage(startTime, timeText)
      liveDuration = result.duration.toFixed(2)
      liveWage = result.wage.toFixed(2)
    }

    this.setData({
      hourlyRate,
      todayWork,
      todayPunchCount,
      punchState,
      startTime,
      liveDuration,
      liveWage,
      recentRecords,
      _punchDate: today
    })
  },

  // 上班打卡
  handlePunchIn() {
    if (this.data.punchState === 'on') {
      wx.showToast({ title: '已在上班中', icon: 'none' })
      return
    }

    const app = getApp()
    const now = new Date()
    const startTime = app.getTimeString(now)
    const date = app.getDateString(now)

    // 保存待完成的打卡状态
    wx.setStorageSync('pendingPunch', { date, startTime })

    this.setData({
      punchState: 'on',
      startTime,
      _punchDate: date
    })

    wx.showToast({ title: '上班打卡成功', icon: 'success', duration: 1500 })
  },

  // 下班打卡
  handlePunchOut() {
    const app = getApp()
    const now = new Date()
    const endTime = app.getTimeString(now)
    const pendingPunch = wx.getStorageSync('pendingPunch')

    if (!pendingPunch) {
      wx.showToast({ title: '请先上班打卡', icon: 'none' })
      return
    }

    const record = app.addPunch(pendingPunch.date, pendingPunch.startTime, endTime)

    // 扣除吃饭时间
    if (this.data.deductMeal) {
      const adjustedDuration = Math.max(0, record.duration - 0.5)
      record.duration = Math.round(adjustedDuration * 100) / 100
      record.wage = Math.round(adjustedDuration * app.getHourlyRate() * 100) / 100
      app.updateRecord(record.id, { duration: record.duration, wage: record.wage })
    }

    // 清除待完成状态
    wx.removeStorageSync('pendingPunch')

    this.setData({ punchState: 'done', deductMeal: false })
    this.refreshData()

    wx.showToast({
      title: `Punch out success: ${record.duration}h`,
      icon: 'success',
      duration: 2000
    })
  },

  // 切换吃饭扣除
  toggleDeductMeal() {
    this.setData({ deductMeal: !this.data.deductMeal })
  },

  // 跳转到记录页
  goToRecords() {
    wx.switchTab({ url: '/pages/record/record' })
  }
})
