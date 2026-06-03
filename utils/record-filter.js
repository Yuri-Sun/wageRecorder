/**
 * 按日期区间筛选打卡记录（闭区间，yyyy-MM-dd）
 * @param {Array<{date:string}>} records
 * @param {string} startDate
 * @param {string} endDate
 */
function filterRecordsByDateRange(records, startDate, endDate) {
  if (!Array.isArray(records)) return []
  return records.filter(r => {
    if (startDate && r.date < startDate) return false
    if (endDate && r.date > endDate) return false
    return true
  })
}

/**
 * @param {Array<{date:string}>} records
 * @param {string} today yyyy-MM-dd
 */
function getDefaultExportRange(records, today) {
  if (!records.length) {
    return { startDate: today, endDate: today }
  }
  const dates = records.map(r => r.date).sort()
  return { startDate: dates[0], endDate: today }
}

module.exports = {
  filterRecordsByDateRange,
  getDefaultExportRange,
}
