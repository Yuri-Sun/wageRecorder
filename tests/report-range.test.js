const test = require('node:test')
const assert = require('node:assert/strict')
const {
  getWeekRangeForAnchor,
  formatWeekRangeLabel,
  getMonthRangeForAnchor,
  formatMonthLabel,
} = require('../utils/report-range.js')

test('getWeekRangeForAnchor: 周三锚定到当周周一至周日', () => {
  const { weekStart, weekEnd } = getWeekRangeForAnchor('2026-06-03')
  assert.equal(weekStart, '2026-06-01')
  assert.equal(weekEnd, '2026-06-07')
})

test('formatWeekRangeLabel', () => {
  assert.equal(formatWeekRangeLabel('2026-06-01', '2026-06-07'), '06-01 ~ 06-07')
})

test('getMonthRangeForAnchor: 2026-06 整月', () => {
  const { monthStart, monthEnd } = getMonthRangeForAnchor('2026-06')
  assert.equal(monthStart, '2026-06-01')
  assert.equal(monthEnd, '2026-06-30')
})

test('formatMonthLabel', () => {
  assert.equal(formatMonthLabel('2026-06', '2026-06-03'), '本月')
  assert.equal(formatMonthLabel('2025-12', '2026-06-03'), '2025-12')
})
