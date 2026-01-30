import fs from 'fs'
import path from 'path'
const p = path.resolve('doc/arquivo-exemplo-importacao.txt')
const text = fs.readFileSync(p, 'latin1')
import { parseFile } from '../src/utils/parser.js'
const out = parseFile(text)
console.log('Parsed headers:', out.result.length)
console.log('First header (preview):', JSON.stringify(out.result[0], null, 2))
console.log('Errors count:', out.errors.length)
