const test = require('node:test')
const assert = require('node:assert/strict')
const {
  summarizeRecords,
  formatExportCSV,
  formatExportTXT,
} = require('../utils/export-format.js')

const sampleRecords = [
  { date: '2026-06-01', startTime: '09:00', endTime: '17:00', duration: 8, wage: 200, note: '' },
  { date: '2026-06-02', startTime: '09:00', endTime: '13:00', duration: 4, wage: 100, note: '半天' },
]

test('summarizeRecords: 汇总工时与工资', () => {
  const summary = summarizeRecords(sampleRecords)
  assert.equal(summary.count, 2)
  assert.equal(summary.totalDuration, 12)
  assert.equal(summary.totalWage, 300)
})

test('formatExportCSV: 含汇总头尾与明细', () => {
  const csv = formatExportCSV(sampleRecords, {
    hourlyRate: 25,
    startDate: '2026-06-01',
    endDate: '2026-06-02',
  })
  assert.match(csv, /导出范围,2026-06-01 ~ 2026-06-02/)
  assert.match(csv, /总工时\(小时\),12/)
  assert.match(csv, /总工资\(A\$\),300/)
  assert.match(csv, /日期,上班时间,下班时间,工时\(小时\),工资\(A\$\),备注/)
  assert.match(csv, /合计,,,12,300,共 2 条/)
})

test('formatExportTXT: 含统计汇总段', () => {
  const txt = formatExportTXT(sampleRecords, {
    hourlyRate: 25,
    startDate: '2026-06-01',
    endDate: '2026-06-02',
  })
  assert.match(txt, /导出范围: 2026-06-01 ~ 2026-06-02/)
  assert.match(txt, /统计汇总/)
  assert.match(txt, /记录数: 2 条/)
  assert.match(txt, /总工时: 12 小时/)
  assert.match(txt, /总工资: A\$300/)
})
