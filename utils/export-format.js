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

function formatExportCSV(records, { hourlyRate, startDate, endDate } = {}) {
  let csv = ''

  if (startDate && endDate) {
    csv += `${escapeCsv('导出范围')},${escapeCsv(`${startDate} ~ ${endDate}`)}\n`
  }
  if (hourlyRate != null) {
    csv += `${escapeCsv('时薪(A$/小时)')},${escapeCsv(hourlyRate)}\n`
  }
  const summary = summarizeRecords(records)
  csv += `${escapeCsv('记录数')},${escapeCsv(summary.count)}\n`
  csv += `${escapeCsv('总工时(小时)')},${escapeCsv(summary.totalDuration)}\n`
  csv += `${escapeCsv('总工资(A$)')},${escapeCsv(summary.totalWage)}\n`
  csv += '\n'

  csv += '日期,上班时间,下班时间,工时(小时),工资(A$),备注\n'
  records.forEach(r => {
    csv += [
      escapeCsv(r.date),
      escapeCsv(r.startTime),
      escapeCsv(r.endTime),
      escapeCsv(r.duration),
      escapeCsv(r.wage),
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
    escapeCsv(`共 ${summary.count} 条`),
  ].join(',') + '\n'

  return csv
}

function formatExportTXT(records, { hourlyRate, startDate, endDate } = {}) {
  const summary = summarizeRecords(records)
  const divider = '='.repeat(40)

  let txt = '考勤与薪资记录\n'
  txt += divider + '\n'
  if (hourlyRate != null) {
    txt += `时薪: A$${hourlyRate}/小时\n`
  }
  if (startDate && endDate) {
    txt += `导出范围: ${startDate} ~ ${endDate}\n`
  }
  txt += divider + '\n\n'

  records.forEach(r => {
    txt += `日期: ${r.date}\n`
    txt += `上班: ${r.startTime}  下班: ${r.endTime}\n`
    txt += `工时: ${r.duration} 小时  工资: A$${r.wage}\n`
    if (r.note) txt += `备注: ${r.note}\n`
    txt += '-'.repeat(30) + '\n'
  })

  txt += '\n' + divider + '\n'
  txt += '统计汇总\n'
  txt += `记录数: ${summary.count} 条\n`
  txt += `总工时: ${summary.totalDuration} 小时\n`
  txt += `总工资: A$${summary.totalWage}\n`
  txt += divider + '\n'

  return txt
}

module.exports = {
  summarizeRecords,
  formatExportCSV,
  formatExportTXT,
}
