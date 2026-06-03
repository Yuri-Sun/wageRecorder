const test = require('node:test')
const assert = require('node:assert/strict')
const {
  filterRecordsByDateRange,
  getDefaultExportRange,
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
