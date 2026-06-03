/** @file 报表周期：按锚定日期计算所在自然周 */

function parseDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * 周一 00:00 起的自然周（与 app.getWeekStart 一致）
 */
function getWeekStartDate(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function getWeekEndDate(weekStartDate) {
  const d = new Date(weekStartDate)
  d.setDate(d.getDate() + 6)
  return d
}

function formatDateString(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * @param {string} anchorDate yyyy-MM-dd
 * @returns {{ weekStart: string, weekEnd: string, weekStartDate: Date, weekEndDate: Date }}
 */
function getWeekRangeForAnchor(anchorDate) {
  const anchor = parseDateString(anchorDate)
  const weekStartDate = getWeekStartDate(anchor)
  const weekEndDate = getWeekEndDate(weekStartDate)
  return {
    weekStart: formatDateString(weekStartDate),
    weekEnd: formatDateString(weekEndDate),
    weekStartDate,
    weekEndDate,
  }
}

function formatWeekRangeLabel(weekStart, weekEnd) {
  return `${weekStart.substring(5)} ~ ${weekEnd.substring(5)}`
}

module.exports = {
  parseDateString,
  getWeekStartDate,
  getWeekEndDate,
  formatDateString,
  getWeekRangeForAnchor,
  formatWeekRangeLabel,
}
