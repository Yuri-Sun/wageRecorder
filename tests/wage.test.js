const test = require('node:test')
const assert = require('node:assert/strict')
const wage = require('../utils/wage.js')

test('calcDurationAndWage: 正常班次', () => {
  const result = wage.calcDurationAndWage('09:00', '17:30', 25)
  assert.equal(result.duration, 8.5)
  assert.equal(result.wage, 212.5)
})

test('calcDurationAndWage: 跨午夜', () => {
  const result = wage.calcDurationAndWage('22:00', '06:00', 25)
  assert.equal(result.duration, 8)
  assert.equal(result.wage, 200)
})

test('applyMealDeduction: 扣除午饭 0.5 小时', () => {
  const result = wage.applyMealDeduction(8.5, 212.5, 25)
  assert.equal(result.duration, 8)
  assert.equal(result.wage, 200)
})

test('applyMealDeduction: 工时不足 0.5 时不为负', () => {
  const result = wage.applyMealDeduction(0.3, 7.5, 25)
  assert.equal(result.duration, 0)
  assert.equal(result.wage, 0)
})

test('calcDurationAndWageWithMeal: 不扣饭', () => {
  const result = wage.calcDurationAndWageWithMeal('09:00', '17:30', 25, false)
  assert.equal(result.duration, 8.5)
  assert.equal(result.wage, 212.5)
})

test('calcDurationAndWageWithMeal: 扣饭', () => {
  const result = wage.calcDurationAndWageWithMeal('09:00', '17:30', 25, true)
  assert.equal(result.duration, 8)
  assert.equal(result.wage, 200)
})

test('getDateString / getTimeString 格式', () => {
  const date = new Date(2026, 5, 3, 9, 5)
  assert.equal(wage.getDateString(date), '2026-06-03')
  assert.equal(wage.getTimeString(date), '09:05')
})
