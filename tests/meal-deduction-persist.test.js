const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function createAppFixture(records, hourlyRate = 25) {
  const storage = {
    hourlyRate,
    records: clone(records),
  }
  let appDefinition

  global.wx = {
    getStorageSync(key) {
      return clone(storage[key])
    },
    setStorageSync(key, value) {
      storage[key] = clone(value)
    },
  }
  global.getCurrentPages = () => []
  global.App = definition => {
    appDefinition = definition
  }

  const appPath = path.join(ROOT, 'app.js')
  delete require.cache[require.resolve(appPath)]
  require(appPath)

  const app = {
    ...appDefinition,
    globalData: clone(appDefinition.globalData),
  }
  app.onLaunch()
  return { app, storage }
}

test('编辑保存会持久化 mealDeducted，改时薪后仍按扣饭重算', () => {
  const { app, storage } = createAppFixture([
    {
      id: 'r1',
      date: '2026-07-13',
      startTime: '09:00',
      endTime: '17:00',
      duration: 8,
      wage: 200,
      note: '',
      mealDeducted: false,
    },
  ])

  app.updateRecord('r1', {
    date: '2026-07-13',
    startTime: '09:00',
    endTime: '17:00',
    note: '',
    mealDeducted: true,
  })

  assert.equal(app.getRecords()[0].mealDeducted, true)
  assert.equal(app.getRecords()[0].duration, 7.5)
  assert.equal(app.getRecords()[0].wage, 187.5)
  assert.equal(storage.records[0].mealDeducted, true)

  app.setHourlyRate(30)

  assert.equal(app.getRecords()[0].mealDeducted, true)
  assert.equal(app.getRecords()[0].duration, 7.5)
  assert.equal(app.getRecords()[0].wage, 225)
})

test('onLaunch 忽略非数组的 records 脏数据', () => {
  const storage = {
    hourlyRate: 23,
    records: { broken: true },
  }
  let appDefinition

  global.wx = {
    getStorageSync(key) {
      return clone(storage[key])
    },
    setStorageSync(key, value) {
      storage[key] = clone(value)
    },
  }
  global.getCurrentPages = () => []
  global.App = definition => {
    appDefinition = definition
  }

  const appPath = path.join(ROOT, 'app.js')
  delete require.cache[require.resolve(appPath)]
  require(appPath)

  const app = {
    ...appDefinition,
    globalData: clone(appDefinition.globalData),
  }
  app.onLaunch()

  assert.deepEqual(app.getRecords(), [])
})
