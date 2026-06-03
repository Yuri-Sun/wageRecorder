/**
 * ECharts 柱状图配置（工资分布）
 * @param {Array<{label:string,wage:number,duration:number,count:number}>} stats
 * @param {{ avgWage?: number }} meta
 */
function buildWageBarOption(stats, meta = {}) {
  const labels = stats.map(s => s.label)
  const wages = stats.map(s => s.wage)
  const avg = meta.avgWage || 0

  return {
    color: ['#07C160'],
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter(params) {
        const p = params[0]
        if (!p) return ''
        const row = stats[p.dataIndex]
        return `${row.label}\n工资 A$${row.wage}\n工时 ${row.duration}h · ${row.count}条`
      },
    },
    grid: {
      left: 12,
      right: 12,
      top: 24,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: {
        color: '#888',
        fontSize: 10,
        interval: 0,
        rotate: labels.length > 8 ? 40 : 0,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'A$',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#888', fontSize: 10 },
    },
    series: [
      {
        name: '工资',
        type: 'bar',
        barMaxWidth: 28,
        data: wages.map((w, i) => ({
          value: w,
          itemStyle: {
            color: avg > 0 && w >= avg * 1.2 ? '#07C160' : '#91E0B6',
            borderRadius: [4, 4, 0, 0],
          },
        })),
      },
    ],
  }
}

module.exports = { buildWageBarOption }
