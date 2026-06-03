const echarts = require('../ec-canvas/echarts')
const { buildWageBarOption } = require('../../utils/chart-option.js')

Component({
  properties: {
    stats: {
      type: Array,
      value: [],
    },
    avgWage: {
      type: Number,
      value: 0,
    },
  },

  data: {
    ec: {
      lazyLoad: true,
    },
  },

  lifetimes: {
    ready() {
      this._chart = null
      this._inited = false
      if (this.properties.stats.length > 0) {
        this.ensureChart()
      }
    },
    detached() {
      if (this._chart) {
        this._chart.dispose()
        this._chart = null
      }
    },
  },

  observers: {
    'stats, avgWage'() {
      if (this.properties.stats.length === 0) {
        return
      }
      this.ensureChart()
    },
  },

  methods: {
    ensureChart() {
      if (!this._inited) {
        const ecComponent = this.selectComponent('#wage-chart-dom')
        if (!ecComponent) return
        ecComponent.init((canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width,
            height,
            devicePixelRatio: dpr,
          })
          canvas.setChart(chart)
          this._chart = chart
          this._inited = true
          this.applyOption()
          return chart
        })
      } else {
        this.applyOption()
      }
    },

    applyOption() {
      if (!this._chart || !this.properties.stats.length) return
      const option = buildWageBarOption(this.properties.stats, {
        avgWage: this.properties.avgWage,
      })
      this._chart.setOption(option, true)
    },
  },
})
