const test = require('node:test')
const assert = require('node:assert/strict')
const {
  summarizeRecords,
  formatExportCSV,
  formatExportTXT,
} = require('../utils/export-format.js')

const sampleRecords = [
  {
    date: '2026-06-02',
    startTime: '09:00',
    endTime: '13:00',
    duration: 4,
    wage: 100,
    note: '半天',
    mealDeducted: false,
  },
  {
    date: '2026-06-01',
    startTime: '09:00',
    endTime: '17:00',
    duration: 7.5,
    wage: 187.5,
    note: '',
    mealDeducted: true,
  },
]

test('summarizeRecords: 汇总工时与工资', () => {
  const summary = summarizeRecords(sampleRecords)
  assert.equal(summary.count, 2)
  assert.equal(summary.totalDuration, 11.5)
  assert.equal(summary.totalWage, 287.5)
})

test('formatExportCSV: 含汇总头尾、扣午饭列与时间正序', () => {
  const csv = formatExportCSV(sampleRecords, {
    hourlyRate: 25,
    startDate: '2026-06-01',
    endDate: '2026-06-02',
  })
  assert.match(csv, /导出范围,2026-06-01 ～ 2026-06-02/)
  assert.match(csv, /总工时\(小时\),11\.5/)
  assert.match(csv, /总工资\(A\$\),287\.5/)
  assert.match(csv, /日期,上班时间,下班时间,工时\(小时\),工资\(A\$\),扣午饭,备注/)
  assert.match(csv, /合计,,,11\.5,287\.5,,共 2 条/)

  const firstDetailIndex = csv.indexOf('2026-06-01')
  const secondDetailIndex = csv.indexOf('2026-06-02')
  assert.ok(firstDetailIndex > 0)
  assert.ok(secondDetailIndex > firstDetailIndex)
  assert.match(csv, /2026-06-01,09:00,17:00,7\.5,187\.5,是,/)
  assert.match(csv, /2026-06-02,09:00,13:00,4,100,,半天/)
})

test('formatExportTXT: 适合微信聊天的摘要置顶与单行明细', () => {
  const txt = formatExportTXT(sampleRecords, {
    hourlyRate: 25,
    startDate: '2026-06-01',
    endDate: '2026-06-02',
  })

  assert.match(txt, /【考勤薪资记录】/)
  assert.match(txt, /范围：2026-06-01 ～ 2026-06-02/)
  assert.match(txt, /时薪：A\$25 \/ 小时/)
  assert.match(txt, /合计：2 条 · 11\.5 小时 · A\$287\.5/)
  assert.match(txt, /1\. 2026-06-01  09:00–17:00  ·  7\.5 小时  ·  A\$187\.5  （已扣午饭）/)
  assert.match(txt, /2\. 2026-06-02  09:00–13:00  ·  4 小时  ·  A\$100  （半天）/)
  assert.match(txt, /共 2 条记录/)
  assert.match(txt, /总工时：11\.5 小时/)
  assert.match(txt, /总工资：A\$287\.5/)
  assert.doesNotMatch(txt, /={10,}/)
  assert.doesNotMatch(txt, /-{10,}/)
})
