const test = require('node:test')
const assert = require('node:assert/strict')
const { buildWageBarOption } = require('../utils/chart-option.js')

test('buildWageBarOption: 生成柱状图 series', () => {
  const stats = [
    { label: '06-01', wage: 100, duration: 8, count: 1 },
    { label: '06-02', wage: 150, duration: 7.5, count: 1 },
  ]
  const option = buildWageBarOption(stats, { avgWage: 125 })
  assert.equal(option.series[0].data.length, 2)
  assert.equal(option.xAxis.data[0], '06-01')
  assert.equal(option.series[0].data[1].value, 150)
})
