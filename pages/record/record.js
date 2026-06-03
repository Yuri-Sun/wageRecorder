// pages/record/record.js
const app = getApp()
const {
  getWeekRangeForAnchor,
  formatWeekRangeLabel,
  formatMonthPickerDisplay,
} = require('../../utils/report-range.js')
const { runPullDownRefresh } = require('../../utils/page-refresh.js')
const { validateEditForm } = require('../../utils/record-form.js')

const EMPTY_EDIT_ERRORS = { date: '', startTime: '', endTime: '', form: '' }

Page({
  data: {
    filterType: 'all',
    filterDate: '',
    maxDate: '',
    weekRangeLabel: '',
    filterMonthDisplay: '',
    filteredRecords: [],
    summary: { count: 0, totalDuration: 0, totalWage: 0 },
    showEditModal: false,
    editingId: '',
    editForm: { date: '', startTime: '', endTime: '', note: '', deductMeal: false },
    editErrors: { ...EMPTY_EDIT_ERRORS },
    editPreview: { duration: 0, wage: 0 },
  },

  onShow() {
    this.refreshFromStorage()
  },

  onPullDownRefresh() {
    runPullDownRefresh(() => this.refreshFromStorage())
  },

  onRecordsChanged() {
    app.reloadRecordsFromStorage()
    this.loadRecords()
  },

  refreshFromStorage() {
    app.reloadRecordsFromStorage()
    const today = app.getDateString()
    const filterDate = this.data.filterDate || today
    this.setData({
      filterDate,
      maxDate: today,
      filterMonthDisplay: formatMonthPickerDisplay(filterDate),
    })
    this.updateRangeLabels()
    this.loadRecords()
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type
    const today = app.getDateString()
    const updates = { filterType: type }
    if (type !== 'all' && !this.data.filterDate) {
      updates.filterDate = today
      updates.filterMonthDisplay = formatMonthPickerDisplay(today)
    }
    this.setData(updates, () => {
      this.updateRangeLabels()
      this.loadRecords()
    })
  },

  onFilterDateChange(e) {
    const value = e.detail.value
    this.setData({
      filterDate: value,
      filterMonthDisplay: formatMonthPickerDisplay(value),
    })
    this.updateRangeLabels()
    this.loadRecords()
  },

  updateRangeLabels() {
    const { filterType, filterDate } = this.data
    if (filterType === 'day' || filterType === 'week') {
      const anchor = filterDate || app.getDateString()
      const { weekStart, weekEnd } = getWeekRangeForAnchor(anchor)
      this.setData({ weekRangeLabel: formatWeekRangeLabel(weekStart, weekEnd) })
    } else {
      this.setData({ weekRangeLabel: '' })
    }
  },

  loadRecords() {
    const allRecords = app.getRecords()
    let filteredRecords = []
    const anchor = this.data.filterDate || app.getDateString()

    if (this.data.filterType === 'day') {
      filteredRecords = allRecords.filter(r => r.date === anchor)
    } else if (this.data.filterType === 'week') {
      const { weekStart, weekEnd } = getWeekRangeForAnchor(anchor)
      filteredRecords = allRecords.filter(r => r.date >= weekStart && r.date <= weekEnd)
    } else if (this.data.filterType === 'month') {
      const month = anchor.substring(0, 7)
      filteredRecords = allRecords.filter(r => r.date.startsWith(month))
    } else {
      filteredRecords = allRecords
    }

    const summary = filteredRecords.reduce(
      (acc, r) => {
        acc.totalDuration += r.duration
        acc.totalWage += r.wage
        acc.count++
        return acc
      },
      { count: 0, totalDuration: 0, totalWage: 0 }
    )

    summary.totalDuration = Math.round(summary.totalDuration * 100) / 100
    summary.totalWage = Math.round(summary.totalWage * 100) / 100

    this.setData({ filteredRecords, summary })
  },

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
      },
    })
  },

  editRecord(e) {
    const id = e.currentTarget.dataset.id
    const records = app.getRecords()
    const record = records.find(r => r.id === id)
    if (!record) return

    this.setData({
      showEditModal: true,
      editingId: id,
      editErrors: { ...EMPTY_EDIT_ERRORS },
      editForm: {
        date: record.date,
        startTime: record.startTime,
        endTime: record.endTime,
        note: record.note || '',
        deductMeal: false,
      },
    })
    this.updateEditPreview()
  },

  closeEditModal() {
    this.setData({ showEditModal: false, editErrors: { ...EMPTY_EDIT_ERRORS } })
  },

  stopPropagation() {},

  clearEditError(field) {
    if (!this.data.editErrors[field]) return
    this.setData({ [`editErrors.${field}`]: '' })
  },

  onStartTimeChange(e) {
    this.clearEditError('startTime')
    this.clearEditError('endTime')
    this.clearEditError('form')
    this.setData({ 'editForm.startTime': e.detail.value })
    this.updateEditPreview()
  },

  onEndTimeChange(e) {
    this.clearEditError('startTime')
    this.clearEditError('endTime')
    this.clearEditError('form')
    this.setData({ 'editForm.endTime': e.detail.value })
    this.updateEditPreview()
  },

  onEditDateChange(e) {
    this.clearEditError('date')
    this.setData({ 'editForm.date': e.detail.value })
  },

  onNoteInput(e) {
    this.clearEditError('form')
    this.setData({ 'editForm.note': e.detail.value })
  },

  toggleEditDeductMeal() {
    this.setData({ 'editForm.deductMeal': !this.data.editForm.deductMeal })
    this.updateEditPreview()
  },

  updateEditPreview() {
    const { startTime, endTime, deductMeal } = this.data.editForm
    if (!startTime || !endTime) {
      this.setData({ editPreview: { duration: 0, wage: 0 } })
      return
    }
    let { duration, wage } = app.calcDurationAndWage(startTime, endTime)
    if (deductMeal) {
      duration = Math.max(0, Math.round((duration - 0.5) * 100) / 100)
      wage = Math.round(duration * app.getHourlyRate() * 100) / 100
    }
    this.setData({ editPreview: { duration, wage } })
  },

  saveEdit() {
    const { ok, errors } = validateEditForm(this.data.editForm)
    if (!ok) {
      this.setData({ editErrors: errors })
      const tip = errors.date || errors.startTime || errors.endTime || errors.form
      wx.showToast({ title: tip, icon: 'none' })
      return
    }

    const { date, startTime, endTime, note, deductMeal } = this.data.editForm
    let { duration, wage } = app.calcDurationAndWage(startTime, endTime)
    if (deductMeal) {
      duration = Math.max(0, Math.round((duration - 0.5) * 100) / 100)
      wage = Math.round(duration * app.getHourlyRate() * 100) / 100
    }
    app.updateRecord(this.data.editingId, { date, startTime, endTime, note, duration, wage })
    this.setData({ showEditModal: false, editErrors: { ...EMPTY_EDIT_ERRORS } })
    this.loadRecords()
    wx.showToast({ title: '保存成功', icon: 'success' })
  },
})
