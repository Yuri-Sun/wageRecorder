const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { validateEditForm, getShiftDurationHours } = require('../utils/record-form.js')

describe('getShiftDurationHours', () => {
  it('正常班次', () => {
    assert.equal(getShiftDurationHours('09:00', '17:00'), 8)
  })

  it('跨午夜', () => {
    assert.equal(getShiftDurationHours('22:00', '06:00'), 8)
  })
})

describe('validateEditForm', () => {
  it('完整合法表单', () => {
    const r = validateEditForm({ date: '2026-06-01', startTime: '09:00', endTime: '17:00' })
    assert.equal(r.ok, true)
    assert.deepEqual(r.errors, { date: '', startTime: '', endTime: '', form: '' })
  })

  it('缺字段', () => {
    const r = validateEditForm({})
    assert.equal(r.ok, false)
    assert.match(r.errors.date, /日期/)
    assert.match(r.errors.startTime, /上班/)
    assert.match(r.errors.endTime, /下班/)
  })

  it('起止相同', () => {
    const r = validateEditForm({ date: '2026-06-01', startTime: '09:00', endTime: '09:00' })
    assert.equal(r.ok, false)
    assert.match(r.errors.endTime, /晚于/)
  })

  it('备注过长', () => {
    const r = validateEditForm({
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '17:00',
      note: 'x'.repeat(201),
    })
    assert.equal(r.ok, false)
    assert.match(r.errors.form, /备注/)
  })
})
