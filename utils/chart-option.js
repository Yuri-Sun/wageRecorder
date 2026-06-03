/**
 * ECharts 柱状图配置（工资分布）
 * @param {Array<{label:string,wage:number,duration:number,count:number,date?:string,month?:string}>} stats
 * @param {{ avgWage?: number, highlightIndex?: number }} meta
 *   highlightIndex — 需要高亮的柱子下标（按天/按周为选中日期；按月为当前月），-1 表示不高亮
 */
const COLOR_ACTIVE = '#07C160'
const COLOR_DEFAULT = '#91E0B6'

function isBarHighlighted(index, wage, meta) {
  const highlightIndex = meta.highlightIndex
  if (typeof highlightIndex === 'number' && highlightIndex >= 0) {
    return index === highlightIndex
  }
  const avg = meta.avgWage || 0
  return avg > 0 && wage >= avg * 1.2
}

function buildWageBarOption(stats, meta = {}) {
  const labels = stats.map(s => s.label)
  const wages = stats.map(s => s.wage)

  return {
    color: [COLOR_ACTIVE],
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter(params) {
        const p = params[0]
        if (!p) return ''
        const row = stats[p.dataIndex]
        const anchorMark =
          typeof meta.highlightIndex === 'number' &&
          meta.highlightIndex >= 0 &&
          p.dataIndex === meta.highlightIndex
            ? '（选中）\n'
            : ''
        return `${anchorMark}${row.label}\n工资 A$${row.wage}\n工时 ${row.duration}h · ${row.count}条`
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
            color: isBarHighlighted(i, w, meta) ? COLOR_ACTIVE : COLOR_DEFAULT,
            borderRadius: [4, 4, 0, 0],
          },
        })),
      },
    ],
  }
}

module.exports = { buildWageBarOption, isBarHighlighted, COLOR_ACTIVE, COLOR_DEFAULT }
