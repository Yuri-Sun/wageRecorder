const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function createFixture() {
  const initialRecords = [
    {
      id: 'old-1',
      date: '2026-07-13',
      startTime: '09:00',
      endTime: '17:00',
      duration: 8,
      wage: 184,
      note: '',
      mealDeducted: false,
    },
  ]
  const storage = {
    hourlyRate: 23,
    records: clone(initialRecords),
  }
  let appDefinition
  let settingsDefinition
  let notifying = false
  let recordsReadsDuringNotification = 0
  let pages = []

  global.wx = {
    getStorageSync(key) {
      if (key === 'records' && notifying) {
        recordsReadsDuringNotification += 1
        return []
      }
      return clone(storage[key])
    },
    setStorageSync(key, value) {
      storage[key] = clone(value)
    },
    showToast() {},
  }
  global.getCurrentPages = () => pages
  global.App = definition => {
    appDefinition = definition
  }
  global.Page = definition => {
    settingsDefinition = definition
  }

  const appPath = path.join(ROOT, 'app.js')
  const settingsPath = path.join(ROOT, 'pages/settings/settings.js')
  delete require.cache[require.resolve(appPath)]
  delete require.cache[require.resolve(settingsPath)]
  require(appPath)

  const app = {
    ...appDefinition,
    globalData: clone(appDefinition.globalData),
  }
  global.getApp = () => app
  require(settingsPath)

  const settingsPage = {
    ...settingsDefinition,
    data: clone(settingsDefinition.data),
    setData(update, callback) {
      Object.assign(this.data, update)
      if (callback) callback()
    },
  }

  app.onLaunch()
  settingsPage.onShow()
  pages = [settingsPage]

  const originalNotify = app.notifyRecordsChanged
  app.notifyRecordsChanged = function notifyWithReadGuard() {
    notifying = true
    try {
      return originalNotify.call(this)
    } finally {
      notifying = false
    }
  }

  return {
    app,
    settingsPage,
    storage,
    getRecordsReadsDuringNotification: () => recordsReadsDuringNotification,
  }
}

test('修改时薪时通知监听器不重入 storage，历史记录保持完整', () => {
  const fixture = createFixture()
  fixture.settingsPage.setData({ rateInputValue: '25', rateChanged: true })

  fixture.settingsPage.saveRate()

  assert.equal(fixture.getRecordsReadsDuringNotification(), 0)
  assert.equal(fixture.app.getRecords().length, 1)
  assert.equal(fixture.storage.records.length, 1)
  assert.equal(fixture.settingsPage.data.totalRecords, 1)
  assert.equal(fixture.app.getRecords()[0].wage, 200)
})

test('合法清空记录仍通过内存状态通知设置页', () => {
  const fixture = createFixture()

  fixture.app.globalData.records = []
  fixture.app.saveRecords()

  assert.equal(fixture.getRecordsReadsDuringNotification(), 0)
  assert.deepEqual(fixture.storage.records, [])
  assert.deepEqual(fixture.app.getRecords(), [])
  assert.equal(fixture.settingsPage.data.totalRecords, 0)
  assert.equal(fixture.settingsPage.data.totalWage, 0)
})
