// pages/settings/settings.js
const app = getApp()
const {
  filterRecordsByDateRange,
  getDefaultExportRange,
} = require('../../utils/record-filter.js')
const { runPullDownRefresh } = require('../../utils/page-refresh.js')

Page({
  data: {
    hourlyRate: 25,
    rateInputValue: '',
    rateChanged: false,
    totalRecords: 0,
    totalDuration: 0,
    totalWage: 0,
    maxDate: '',
    exportStartDate: '',
    exportEndDate: '',
    exportRecordCount: 0,
  },

  onPullDownRefresh() {
    runPullDownRefresh(() => this.refreshPageData())
  },

  onShow() {
    this.refreshPageData()
  },

  refreshPageData() {
    app.reloadRecordsFromStorage()
    const today = app.getDateString()
    const records = app.getRecords()
    const totalRecords = records.length
    const totalDuration = Math.round(records.reduce((s, r) => s + r.duration, 0) * 100) / 100
    const totalWage = Math.round(records.reduce((s, r) => s + r.wage, 0) * 100) / 100
    const rate = app.getHourlyRate()

    const { startDate, endDate } = getDefaultExportRange(records, today)
    const exportStartDate = this.data.exportStartDate || startDate
    const exportEndDate = this.data.exportEndDate || endDate

    this.setData({
      hourlyRate: rate,
      rateInputValue: String(rate),
      rateChanged: false,
      totalRecords,
      totalDuration,
      totalWage,
      maxDate: today,
      exportStartDate: this.clampStart(exportStartDate, exportEndDate || endDate),
      exportEndDate: this.clampEnd(exportEndDate || endDate, exportStartDate, today),
    })
    this.refreshExportPreview()
  },

  onRecordsChanged() {
    this.refreshPageData()
  },

  clampStart(start, end) {
    if (!start) return start
    if (!end) return start
    return start > end ? end : start
  },

  clampEnd(end, start, maxDate) {
    let value = end || maxDate
    if (start && value < start) value = start
    if (maxDate && value > maxDate) value = maxDate
    return value
  },

  refreshExportPreview() {
    const records = this.getRecordsForExport()
    this.setData({ exportRecordCount: records.length })
  },

  getRecordsForExport() {
    const { exportStartDate, exportEndDate } = this.data
    const all = app.getRecords()
    return filterRecordsByDateRange(all, exportStartDate, exportEndDate).sort((a, b) =>
      b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
    )
  },

  onExportStartChange(e) {
    const exportStartDate = e.detail.value
    const exportEndDate = this.clampEnd(this.data.exportEndDate, exportStartDate, this.data.maxDate)
    this.setData({ exportStartDate, exportEndDate })
    this.refreshExportPreview()
  },

  onExportEndChange(e) {
    const exportEndDate = this.clampEnd(e.detail.value, this.data.exportStartDate, this.data.maxDate)
    this.setData({ exportEndDate })
    this.refreshExportPreview()
  },

  setExportPreset(e) {
    const preset = e.currentTarget.dataset.preset
    const today = app.getDateString()
    const all = app.getRecords()
    let exportStartDate = today
    let exportEndDate = today

    if (preset === 'all' && all.length > 0) {
      const range = getDefaultExportRange(all, today)
      exportStartDate = range.startDate
      exportEndDate = range.endDate
    } else if (preset === 'month') {
      exportStartDate = today.substring(0, 7) + '-01'
      exportEndDate = today
    } else if (preset === 'week') {
      const { getWeekRangeForAnchor } = require('../../utils/report-range.js')
      const { weekStart, weekEnd } = getWeekRangeForAnchor(today)
      exportStartDate = weekStart
      exportEndDate = weekEnd > today ? today : weekEnd
    }

    this.setData({ exportStartDate, exportEndDate })
    this.refreshExportPreview()
  },

  onRateInput(e) {
    const val = e.detail.value
    this.setData({
      rateInputValue: val,
      rateChanged: val !== '' && Number(val) !== this.data.hourlyRate,
    })
  },

  onRateBlur(e) {
    const val = Number(e.detail.value)
    if (val > 0 && val !== this.data.hourlyRate) {
      this.setData({ rateChanged: true })
    }
  },

  saveRate() {
    const newRate = Number(this.data.rateInputValue)
    if (!newRate || newRate <= 0) {
      wx.showToast({ title: '请输入有效时薪', icon: 'none' })
      return
    }
    app.setHourlyRate(newRate)
    this.setData({
      hourlyRate: newRate,
      rateInputValue: String(newRate),
      rateChanged: false,
    })
    const records = app.getRecords()
    const totalWage = Math.round(records.reduce((s, r) => s + r.wage, 0) * 100) / 100
    this.setData({ totalWage })
    wx.showToast({ title: '时薪已更新', icon: 'success' })
  },

  exportCSV() {
    this.doExport('csv')
  },

  exportTXT() {
    this.doExport('txt')
  },

  doExport(ext) {
    const records = this.getRecordsForExport()
    if (records.length === 0) {
      wx.showToast({ title: '该时间范围内暂无记录', icon: 'none' })
      return
    }
    const { exportStartDate, exportEndDate } = this.data
    const meta = { startDate: exportStartDate, endDate: exportEndDate }
    const content = ext === 'csv' ? app.exportCSV(records, meta) : app.exportTXT(records, meta)
    const rangeSuffix = `${exportStartDate}_${exportEndDate}`
    this.shareFile(content, ext, ext === 'csv' ? 'text/csv' : 'text/plain', rangeSuffix)
  },

  shareFile(content, ext, contentType, rangeSuffix) {
    const fs = wx.getFileSystemManager()
    const fileName = `考勤记录_${rangeSuffix}.${ext}`
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

    fs.writeFile({
      filePath,
      data: content,
      encoding: 'utf8',
      success: () => {
        wx.shareFileMessage({
          filePath,
          fileName,
          success: () => {
            const formatLabel = ext === 'csv' ? '表格' : '文本'
            wx.showToast({ title: `已导出${formatLabel}`, icon: 'success' })
          },
          fail: () => {
            wx.setClipboardData({
              data: content,
              success: () => {
                wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
              },
            })
          },
        })
      },
      fail: err => {
        console.error('写文件失败:', err)
        wx.setClipboardData({
          data: content,
          success: () => {
            wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '导出失败', icon: 'none' })
          },
        })
      },
    })
  },

  clearAllData() {
    wx.showModal({
      title: '⚠️ 危险操作',
      content: '确定要清空所有打卡记录吗？此操作不可恢复！',
      confirmText: '确认清空',
      confirmColor: '#FA5151',
      success: res => {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '数据清空后将无法找回，确定继续？',
            confirmText: '确定',
            confirmColor: '#FA5151',
            success: res2 => {
              if (res2.confirm) {
                app.globalData.records = []
                app.saveRecords()
                wx.removeStorageSync('pendingPunch')
                this.onShow()
                wx.showToast({ title: '数据已清空', icon: 'success' })
              }
            },
          })
        }
      },
    })
  },
})
