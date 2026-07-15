const test = require('node:test')
const assert = require('node:assert/strict')
const {
  filterRecordsByDateRange,
  getDefaultExportRange,
  getMaxExportDate,
  resolveExportStartChange,
  resolveExportEndChange,
} = require('../utils/record-filter.js')

const sample = [
  { id: '1', date: '2026-05-01' },
  { id: '2', date: '2026-05-15' },
  { id: '3', date: '2026-06-01' },
]

test('filterRecordsByDateRange: 闭区间筛选', () => {
  const out = filterRecordsByDateRange(sample, '2026-05-01', '2026-05-31')
  assert.equal(out.length, 2)
  assert.equal(out[0].id, '1')
  assert.equal(out[1].id, '2')
})

test('getDefaultExportRange: 最早记录至今天', () => {
  const range = getDefaultExportRange(sample, '2026-06-03')
  assert.equal(range.startDate, '2026-05-01')
  assert.equal(range.endDate, '2026-06-03')
})

test('getDefaultExportRange: 允许导出晚于今天的已有记录', () => {
  const range = getDefaultExportRange([
    { id: '1', date: '2026-06-13' },
    { id: '2', date: '2026-06-15' },
  ], '2026-06-13')

  assert.equal(range.startDate, '2026-06-13')
  assert.equal(range.endDate, '2026-06-15')
  assert.equal(getMaxExportDate([{ date: '2026-06-15' }], '2026-06-13'), '2026-06-15')
})

test('resolveExportStartChange: 开始日期晚于结束日期时同步推进结束日期', () => {
  const range = resolveExportStartChange('2026-06-15', '2026-06-13', '2026-06-30')

  assert.deepEqual(range, {
    startDate: '2026-06-15',
    endDate: '2026-06-15',
  })
})

test('resolveExportEndChange: 结束日期早于开始日期时同步拉回开始日期', () => {
  const range = resolveExportEndChange('2026-06-13', '2026-06-15', '2026-06-30')

  assert.deepEqual(range, {
    startDate: '2026-06-13',
    endDate: '2026-06-13',
  })
})
