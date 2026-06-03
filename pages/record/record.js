// pages/record/record.js
const app = getApp()

Page({
  data: {
    filterType: 'all', // 'all' | 'day' | 'week' | 'month'
    filterDate: '',
    filteredRecords: [],
    summary: { count: 0, totalDuration: 0, totalWage: 0 },
    // 编辑弹窗
    showEditModal: false,
    editingId: '',
    editForm: { date: '', startTime: '', endTime: '', note: '', deductMeal: false },
    editPreview: { duration: 0, wage: 0 }
  },

  onShow() {
    const app = getApp()
    this.setData({ filterDate: app.getDateString() })
    this.loadRecords()
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ filterType: type })
    this.loadRecords()
  },

  onDateChange(e) {
    this.setData({ filterDate: e.detail.value, filterType: 'day' })
    this.loadRecords()
  },

  parseDateString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  },

  loadRecords() {
    const app = getApp()
    const allRecords = app.getRecords()
    let filteredRecords = []

    if (this.data.filterType === 'day') {
      filteredRecords = allRecords.filter(r => r.date === this.data.filterDate)
    } else if (this.data.filterType === 'week') {
      const baseDate = this.parseDateString(this.data.filterDate || app.getDateString())
      const weekStart = new Date(baseDate)
      const dayOfWeek = baseDate.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      weekStart.setDate(baseDate.getDate() + diff)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const start = app.getDateString(weekStart)
      const end = app.getDateString(weekEnd)
      filteredRecords = allRecords.filter(r => r.date >= start && r.date <= end)
    } else if (this.data.filterType === 'month') {
      const month = (this.data.filterDate || app.getDateString()).substring(0, 7)
      filteredRecords = allRecords.filter(r => r.date.startsWith(month))
    } else {
      filteredRecords = allRecords
    }

    const summary = filteredRecords.reduce((acc, r) => {
      acc.totalDuration += r.duration
      acc.totalWage += r.wage
      acc.count++
      return acc
    }, { count: 0, totalDuration: 0, totalWage: 0 })

    summary.totalDuration = Math.round(summary.totalDuration * 100) / 100
    summary.totalWage = Math.round(summary.totalWage * 100) / 100

    this.setData({ filteredRecords, summary })
  },

  // 删除记录
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条打卡记录吗？',
      success: res => {
        if (res.confirm) {
          app.deleteRecord(id)
          this.loadRecords()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // 编辑记录
  editRecord(e) {
    const id = e.currentTarget.dataset.id
    const records = app.getRecords()
    const record = records.find(r => r.id === id)
    if (!record) return

    this.setData({
      showEditModal: true,
      editingId: id,
      editForm: {
        date: record.date,
        startTime: record.startTime,
        endTime: record.endTime,
        note: record.note || '',
        deductMeal: false
      }
    })
    this.updateEditPreview()
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  stopPropagation() {},

  onStartTimeChange(e) {
    this.setData({ 'editForm.startTime': e.detail.value })
    this.updateEditPreview()
  },

  onEndTimeChange(e) {
    this.setData({ 'editForm.endTime': e.detail.value })
    this.updateEditPreview()
  },

  onEditDateChange(e) {
    this.setData({ 'editForm.date': e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ 'editForm.note': e.detail.value })
  },

  toggleEditDeductMeal() {
    this.setData({ 'editForm.deductMeal': !this.data.editForm.deductMeal })
    this.updateEditPreview()
  },

  updateEditPreview() {
    const app = getApp()
    const { startTime, endTime, deductMeal } = this.data.editForm
    let { duration, wage } = app.calcDurationAndWage(startTime, endTime)
    if (deductMeal) {
      duration = Math.max(0, Math.round((duration - 0.5) * 100) / 100)
      wage = Math.round(duration * app.getHourlyRate() * 100) / 100
    }
    this.setData({ editPreview: { duration, wage } })
  },

  saveEdit() {
    const app = getApp()
    const { date, startTime, endTime, note, deductMeal } = this.data.editForm
    if (!startTime || !endTime) {
      wx.showToast({ title: '请填写时间', icon: 'none' })
      return
    }
    const { duration, wage } = app.calcDurationAndWageWithMeal(startTime, endTime, deductMeal)
    app.updateRecord(this.data.editingId, {
      date,
      startTime,
      endTime,
      note,
      duration,
      wage,
      mealDeducted: deductMeal,
    })
    this.setData({ showEditModal: false })
    this.loadRecords()
    wx.showToast({ title: '保存成功', icon: 'success' })
  }
})
