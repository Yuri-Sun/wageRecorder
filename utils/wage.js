/** @file 工时与工资计算（可在 Node 测试中复用） */

const MEAL_DEDUCTION_HOURS = 0.5

function round2(value) {
  return Math.round(value * 100) / 100
}

function calcDurationAndWage(startTime, endTime, hourlyRate) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let duration = (eh * 60 + em - sh * 60 - sm) / 60
  if (duration < 0) duration += 24
  duration = round2(duration)
  const wage = round2(duration * hourlyRate)
  return { duration, wage }
}

function applyMealDeduction(duration, wage, hourlyRate) {
  const adjustedDuration = Math.max(0, round2(duration - MEAL_DEDUCTION_HOURS))
  const adjustedWage = round2(adjustedDuration * hourlyRate)
  return { duration: adjustedDuration, wage: adjustedWage }
}

function calcDurationAndWageWithMeal(startTime, endTime, hourlyRate, deductMeal) {
  const base = calcDurationAndWage(startTime, endTime, hourlyRate)
  if (!deductMeal) {
    return base
  }
  return applyMealDeduction(base.duration, base.wage, hourlyRate)
}

function getDateString(date = new Date()) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTimeString(date = new Date()) {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function getWeekStart(date, getDateStringFn = getDateString) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return getDateStringFn(d)
}

function getWeekEnd(date, getDateStringFn = getDateString) {
  const d = new Date(date)
  d.setDate(d.getDate() + 6)
  return getDateStringFn(d)
}

module.exports = {
  MEAL_DEDUCTION_HOURS,
  round2,
  calcDurationAndWage,
  applyMealDeduction,
  calcDurationAndWageWithMeal,
  getDateString,
  getTimeString,
  getWeekStart,
  getWeekEnd,
}
