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

function getSortedRecordDates(records) {
  if (!Array.isArray(records)) return []
  return records
    .map(r => r && r.date)
    .filter(Boolean)
    .sort()
}

function getMaxExportDate(records, today) {
  const dates = getSortedRecordDates(records)
  const latestRecordDate = dates[dates.length - 1]
  return latestRecordDate && latestRecordDate > today ? latestRecordDate : today
}

/**
 * @param {Array<{date:string}>} records
 * @param {string} today yyyy-MM-dd
 */
function getDefaultExportRange(records, today) {
  const dates = getSortedRecordDates(records)
  const endDate = getMaxExportDate(records, today)
  if (!dates.length) {
    return { startDate: today, endDate }
  }
  return { startDate: dates[0], endDate }
}

function clampDateToMax(date, maxDate) {
  if (!date) return date
  return maxDate && date > maxDate ? maxDate : date
}

function resolveExportStartChange(selectedStartDate, currentEndDate, maxDate) {
  const startDate = clampDateToMax(selectedStartDate, maxDate)
  let endDate = clampDateToMax(currentEndDate || startDate, maxDate)
  if (startDate && endDate && endDate < startDate) {
    endDate = startDate
  }
  return { startDate, endDate }
}

function resolveExportEndChange(selectedEndDate, currentStartDate, maxDate) {
  const endDate = clampDateToMax(selectedEndDate, maxDate)
  let startDate = clampDateToMax(currentStartDate, maxDate)
  if (startDate && endDate && startDate > endDate) {
    startDate = endDate
  }
  return { startDate, endDate }
}

module.exports = {
  filterRecordsByDateRange,
  getDefaultExportRange,
  getMaxExportDate,
  resolveExportStartChange,
  resolveExportEndChange,
}
