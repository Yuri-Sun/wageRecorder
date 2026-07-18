/** @file 考勤记录导出格式（CSV / TXT） */

const { round2 } = require('./wage.js')

function summarizeRecords(records) {
  let totalDuration = 0
  let totalWage = 0
  for (const r of records) {
    totalDuration += r.duration
    totalWage += r.wage
  }
  return {
    count: records.length,
    totalDuration: round2(totalDuration),
    totalWage: round2(totalWage),
  }
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return ''
  if (startDate && endDate) {
    if (startDate === endDate) return startDate
    return `${startDate} ～ ${endDate}`
  }
  return startDate || endDate
}

function sortRecordsChronologically(records) {
  return [...records].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  )
}

function formatRecordTags(record) {
  const tags = []
  if (record.mealDeducted) tags.push('已扣午饭')
  if (record.note) tags.push(record.note)
  return tags
}

function formatExportCSV(records, { hourlyRate, startDate, endDate } = {}) {
  let csv = ''
  const range = formatDateRange(startDate, endDate)

  if (range) {
    csv += `${escapeCsv('导出范围')},${escapeCsv(range)}\n`
  }
  if (hourlyRate != null) {
    csv += `${escapeCsv('时薪(A$/小时)')},${escapeCsv(hourlyRate)}\n`
  }
  const summary = summarizeRecords(records)
  csv += `${escapeCsv('记录数')},${escapeCsv(summary.count)}\n`
  csv += `${escapeCsv('总工时(小时)')},${escapeCsv(summary.totalDuration)}\n`
  csv += `${escapeCsv('总工资(A$)')},${escapeCsv(summary.totalWage)}\n`
  csv += '\n'

  csv += '日期,上班时间,下班时间,工时(小时),工资(A$),扣午饭,备注\n'
  sortRecordsChronologically(records).forEach(r => {
    csv += [
      escapeCsv(r.date),
      escapeCsv(r.startTime),
      escapeCsv(r.endTime),
      escapeCsv(r.duration),
      escapeCsv(r.wage),
      escapeCsv(r.mealDeducted ? '是' : ''),
      escapeCsv(r.note || ''),
    ].join(',') + '\n'
  })

  csv += '\n'
  csv += [
    escapeCsv('合计'),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(summary.totalDuration),
    escapeCsv(summary.totalWage),
    escapeCsv(''),
    escapeCsv(`共 ${summary.count} 条`),
  ].join(',') + '\n'

  return csv
}

/**
 * 面向微信聊天阅读的文本格式：摘要置顶、单行明细、信息完整。
 */
function formatExportTXT(records, { hourlyRate, startDate, endDate } = {}) {
  const summary = summarizeRecords(records)
  const range = formatDateRange(startDate, endDate)
  const ordered = sortRecordsChronologically(records)
  const lines = []

  lines.push('【考勤薪资记录】')
  if (range) lines.push(`范围：${range}`)
  if (hourlyRate != null) lines.push(`时薪：A$${hourlyRate} / 小时`)
  lines.push(
    `合计：${summary.count} 条 · ${summary.totalDuration} 小时 · A$${summary.totalWage}`
  )
  lines.push('')
  lines.push('明细')

  ordered.forEach((r, index) => {
    const tags = formatRecordTags(r)
    let line =
      `${index + 1}. ${r.date}  ${r.startTime}–${r.endTime}` +
      `  ·  ${r.duration} 小时  ·  A$${r.wage}`
    if (tags.length) {
      line += `  （${tags.join('，')}）`
    }
    lines.push(line)
  })

  lines.push('')
  lines.push('——')
  lines.push(`共 ${summary.count} 条记录`)
  lines.push(`总工时：${summary.totalDuration} 小时`)
  lines.push(`总工资：A$${summary.totalWage}`)

  return `${lines.join('\n')}\n`
}

module.exports = {
  summarizeRecords,
  formatDateRange,
  formatExportCSV,
  formatExportTXT,
}
