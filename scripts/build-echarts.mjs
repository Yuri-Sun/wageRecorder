import { copyFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const source = path.join(root, 'node_modules/echarts/dist/echarts.common.min.js')
const outfile = path.join(root, 'components/ec-canvas/echarts.js')

copyFileSync(source, outfile)

const { size } = statSync(outfile)
const kb = (size / 1024).toFixed(1)
console.log(`Copied echarts.common.min.js -> ${outfile} (${kb} KB)`)
console.log('Includes bar/line/pie and grid/tooltip; sufficient for wage bar chart.')
