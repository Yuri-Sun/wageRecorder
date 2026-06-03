// pages/settings/settings.js
const app = getApp()

Page({
  data: {
    hourlyRate: 25,
    rateInputValue: '',
    rateChanged: false,
    totalRecords: 0,
    totalDuration: 0,
    totalWage: 0
  },

  onShow() {
    const app = getApp()
    const rate = app.getHourlyRate()
    const records = app.getRecords()
    const totalRecords = records.length
    const totalDuration = Math.round(records.reduce((s, r) => s + r.duration, 0) * 100) / 100
    const totalWage = Math.round(records.reduce((s, r) => s + r.wage, 0) * 100) / 100

    this.setData({
      hourlyRate: rate,
      rateInputValue: String(rate),
      rateChanged: false,
      totalRecords,
      totalDuration,
      totalWage
    })
  },

  onRateInput(e) {
    const val = e.detail.value
    this.setData({
      rateInputValue: val,
      rateChanged: val !== '' && Number(val) !== this.data.hourlyRate
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
      rateChanged: false
    })
    // 刷新统计数据
    const records = app.getRecords()
    const totalWage = Math.round(records.reduce((s, r) => s + r.wage, 0) * 100) / 100
    this.setData({ totalWage })
    wx.showToast({ title: '时薪已更新', icon: 'success' })
  },

  // 导出 CSV
  exportCSV() {
    const app = getApp()
    const records = app.getRecords()
    if (records.length === 0) {
      wx.showToast({ title: '暂无记录可导出', icon: 'none' })
      return
    }
    const csvContent = app.exportCSV(records)
    this.shareFile(csvContent, 'csv', 'text/csv')
  },

  // 导出 TXT
  exportTXT() {
    const app = getApp()
    const records = app.getRecords()
    if (records.length === 0) {
      wx.showToast({ title: '暂无记录可导出', icon: 'none' })
      return
    }
    const txtContent = app.exportTXT(records)
    this.shareFile(txtContent, 'txt', 'text/plain')
  },

  shareFile(content, ext, contentType) {
    const fs = wx.getFileSystemManager()
    const fileName = `考勤记录_${app.getDateString()}.${ext}`
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
            // 如果分享失败，尝试复制到剪贴板
            wx.setClipboardData({
              data: content,
              success: () => {
                wx.showToast({ title: `已复制到剪贴板`, icon: 'success' })
              }
            })
          }
        })
      },
      fail: err => {
        console.error('写文件失败:', err)
        // 降级方案：复制到剪贴板
        wx.setClipboardData({
          data: content,
          success: () => {
            wx.showToast({ title: `已复制到剪贴板`, icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '导出失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 清空所有数据
  clearAllData() {
    wx.showModal({
      title: '⚠️ 危险操作',
      content: '确定要清空所有打卡记录吗？此操作不可恢复！',
      confirmText: '确认清空',
      confirmColor: '#FA5151',
      success: res => {
        if (res.confirm) {
          // 二次确认
          wx.showModal({
            title: '再次确认',
            content: '数据清空后将无法找回，确定继续？',
            confirmText: '确定',
            confirmColor: '#FA5151',
            success: res2 => {
              if (res2.confirm) {
                const app = getApp()
                app.globalData.records = []
                app.saveRecords()
                wx.removeStorageSync('pendingPunch')
                this.onShow()
                wx.showToast({ title: '数据已清空', icon: 'success' })
              }
            }
          })
        }
      }
    })
  }
})
