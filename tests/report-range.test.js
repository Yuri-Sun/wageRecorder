const test = require('node:test')
const assert = require('node:assert/strict')
const {
  getWeekRangeForAnchor,
  formatWeekRangeLabel,
} = require('../utils/report-range.js')

test('getWeekRangeForAnchor: 周三锚定到当周周一至周日', () => {
  const { weekStart, weekEnd } = getWeekRangeForAnchor('2026-06-03')
  assert.equal(weekStart, '2026-06-01')
  assert.equal(weekEnd, '2026-06-07')
})

test('formatWeekRangeLabel', () => {
  assert.equal(formatWeekRangeLabel('2026-06-01', '2026-06-07'), '06-01 ~ 06-07')
})
