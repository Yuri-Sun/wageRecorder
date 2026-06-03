/** @file 打卡记录编辑表单校验 */

const MAX_NOTE_LENGTH = 200

function parseTimeMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/** @returns {number|null} 工时（小时），起止无效时返回 null */
function getShiftDurationHours(startTime, endTime) {
  const start = parseTimeMinutes(startTime)
  const end = parseTimeMinutes(endTime)
  if (start === null || end === null) return null
  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return Math.round((diff / 60) * 100) / 100
}

/**
 * @param {{ date?: string, startTime?: string, endTime?: string, note?: string }} form
 * @returns {{ ok: boolean, errors: { date: string, startTime: string, endTime: string, form: string } }}
 */
function validateEditForm(form = {}) {
  const errors = { date: '', startTime: '', endTime: '', form: '' }
  let ok = true

  if (!form.date) {
    errors.date = '请选择日期'
    ok = false
  }

  if (!form.startTime) {
    errors.startTime = '请选择上班时间'
    ok = false
  }

  if (!form.endTime) {
    errors.endTime = '请选择下班时间'
    ok = false
  }

  if (form.startTime && form.endTime) {
    const hours = getShiftDurationHours(form.startTime, form.endTime)
    if (hours === null) {
      errors.form = '时间格式无效'
      ok = false
    } else if (hours <= 0) {
      errors.endTime = '下班时间须晚于上班时间'
      ok = false
    }
  }

  const note = (form.note || '').trim()
  if (note.length > MAX_NOTE_LENGTH) {
    errors.form = `备注最多 ${MAX_NOTE_LENGTH} 字`
    ok = false
  }

  return { ok, errors }
}

module.exports = {
  MAX_NOTE_LENGTH,
  getShiftDurationHours,
  validateEditForm,
}
