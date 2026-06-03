/**
 * 页面下拉刷新：轻量 loading + 保证 stopPullDownRefresh
 * @param {() => void|Promise<void>} task
 */
function runPullDownRefresh(task) {
  wx.showLoading({ title: '刷新中', mask: false })
  return Promise.resolve()
    .then(() => task())
    .catch(err => {
      console.error('[pullDownRefresh]', err)
      wx.showToast({ title: '刷新失败', icon: 'none' })
    })
    .finally(() => {
      wx.hideLoading()
      wx.stopPullDownRefresh()
    })
}

module.exports = { runPullDownRefresh }
