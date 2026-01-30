// Parser para o layout Datasul (posicional)
// Observações:
// - As posições seguem o padrão (1-indexed) informado no requisito
// - Em JS usamos slice(startIndexInclusive, endIndexExclusive)
// - Ajuste a regra de casas decimais conforme o layout real no ODS (atualmente assume 2 casas decimais para valores)

function safeSlice(line, start1, end1) {
  // start1/end1 are 1-indexed inclusive
  const start = Math.max(0, start1 - 1)
  const end = Math.min(line.length, end1)
  return line.slice(start, end)
}

function parseNumberField(raw, decimals = 2) {
  if (!raw) return null
  const digits = raw.replace(/[^0-9-]/g, '')
  if (digits === '') return null
  const n = parseInt(digits, 10)
  return +(n / Math.pow(10, decimals))
}

function parseDateField(raw) {
  // espera ddmmyyyy ou ddmmyy
  const d = raw.replace(/[^0-9]/g, '')
  if (d.length === 8) {
    const day = d.slice(0,2), month = d.slice(2,4), year = d.slice(4,8)
    return `${year}-${month}-${day}`
  }
  if (d.length === 6) {
    // assume ddmmyy -> prefix 20
    const day = d.slice(0,2), month = d.slice(2,4), year = '20' + d.slice(4,6)
    return `${year}-${month}-${day}`
  }
  return raw || null
}

import tipo1Layout from '../layouts/layout-txt-integracao-datasul-tipo1.json'
import tipo2Layout from '../layouts/layout-txt-integracao-datasul-tipo2.json'
import tipo4Layout from '../layouts/layout-txt-integracao-datasul-tipo4.json'
import tipo8Layout from '../layouts/layout-txt-integracao-datasul-tipo8.json'

function buildDescriptors(layoutArray) {
  return layoutArray
    .map(f => ({
      name: f.campo,
      descricao: f.descricao,
      tipo: (f.tipo || '').toString(),
      decimais: f.decimais || null,
      obrigatorio: !!f.obrigatorio,
      start: f.inicio || null,
      end: f.fim || null,
      raw: f.raw || f
    }))
    .filter(d => d.name) // ensure a name exists
}

const layouts = {
  '1': buildDescriptors(tipo1Layout),
  '2': buildDescriptors(tipo2Layout),
  '4': buildDescriptors(tipo4Layout),
  '8': buildDescriptors(tipo8Layout)
}

function parseField(rawStr, descriptor) {
  const t = (descriptor.tipo || '').toLowerCase()
  if (/decimal/i.test(t) || t === 'decimal') {
    const decimals = descriptor.decimais != null ? descriptor.decimais : 2
    return parseNumberField(rawStr, decimals)
  }
  if (/ddmmy/i.test(t) || /date/i.test(t)) {
    return parseDateField(rawStr)
  }
  if (/sim/i.test(t) || /não/i.test(t) || /nao/i.test(t) || /sim\/não/i.test(t)) {
    const v = (rawStr || '').trim().toLowerCase()
    return v === 's' || v === 'sim' || v === '1' || v === 'yes'
  }
  if (/inteiro/i.test(t)) {
    const digits = (rawStr || '').replace(/[^0-9-]/g, '')
    return digits === '' ? null : parseInt(digits, 10)
  }
  // default: character
  return (rawStr || '').trim() || null
}

export function parseFile(text) {
  const lines = text.split(/\r?\n/) // preserve empty lines for numbering if needed
  const result = []
  let currentHeader = null
  let currentItem = null

  const rawLines = []
  const errors = []

  lines.forEach((line, idx) => {
    const ln = line || ''
    const type = ln.charAt(0) || ''
    rawLines.push({ lineNumber: idx + 1, raw: ln, type })

    const layout = layouts[type]
    if (layout) {
      // parse fields according to the layout descriptors
      const parsed = {}
      layout.forEach(field => {
        if (!field.start || !field.end) return // skip incomplete field definitions
        const rawVal = safeSlice(ln, field.start, field.end)
        const val = parseField(rawVal, field)
        parsed[field.name] = val
        if (field.obrigatorio && (val === null || val === '')) {
          errors.push({ line: idx + 1, field: field.name, message: 'Campo obrigatório ausente' })
        }
      })

      if (type === '1') {
        const header = { tipo: 1, ...parsed, itens: [], duplicatas: [] }
        result.push(header)
        currentHeader = header
        currentItem = null
      } else if (type === '2') {
        const item = { tipo: 2, ...parsed, extras: [] }
        if (currentHeader) {
          currentHeader.itens.push(item)
          currentItem = item
        } else {
          const orphan = { tipo: 1, itens: [item], duplicatas: [] }
          result.push(orphan)
          currentHeader = orphan
          currentItem = item
        }
      } else if (type === '8') {
        const extra = { tipo: 8, ...parsed }
        if (currentItem) currentItem.extras.push(extra)
        else if (currentHeader) {
          const placeholder = { tipo: 2, item: null, extras: [extra] }
          currentHeader.itens.push(placeholder)
          currentItem = placeholder
        }
      } else if (type === '4') {
        const dup = { tipo: 4, ...parsed }
        if (currentHeader) currentHeader.duplicatas.push(dup)
        else {
          const orphan = { tipo: 1, itens: [], duplicatas: [dup] }
          result.push(orphan)
          currentHeader = orphan
        }
      }
    } else {
      // tipos desconhecidos: ignorar, mas manter rawLines
    }
  })

  return { result, rawLines, errors }
}
