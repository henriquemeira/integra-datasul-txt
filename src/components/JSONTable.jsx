import React, { useState, useRef, useEffect } from 'react'
import tipo1Layout from '../layouts/layout-txt-integracao-datasul-tipo1.json'
import tipo2Layout from '../layouts/layout-txt-integracao-datasul-tipo2.json'
import tipo4Layout from '../layouts/layout-txt-integracao-datasul-tipo4.json'
import tipo8Layout from '../layouts/layout-txt-integracao-datasul-tipo8.json'

function buildFieldMap(arr) {
  return (arr || []).reduce((acc, f) => {
    if (f && f.campo) acc[f.campo] = { descricao: f.descricao || '', inicio: f.inicio ?? null, fim: f.fim ?? null }
    return acc
  }, {})
}

const FIELD_MAP = {
  ...buildFieldMap(tipo1Layout),
  ...buildFieldMap(tipo2Layout),
  ...buildFieldMap(tipo4Layout),
  ...buildFieldMap(tipo8Layout)
}

function NestedTable({ rows }) {
  if (!rows || rows.length === 0) return <div className="text-sm text-gray-500">— vazio —</div>
  const keys = Object.keys(rows[0]).filter(k => k !== 'extras' && k !== 'itens' && k !== 'duplicatas')
  const [expanded, setExpanded] = useState({})
  const [selectedRow, setSelectedRow] = useState(null)
  function toggle(i) { setExpanded(prev => ({ ...prev, [i]: !prev[i] })) }

  // Column resizing state
  const [colWidths, setColWidths] = useState(() => keys.map((_, idx) => (idx === keys.length - 1 ? 300 : 140)))
  const [extrasWidths, setExtrasWidths] = useState({}) // map rowIndex -> widths array
  const resizingRef = useRef(null)

  // container measurement to prevent horizontal scrolling: we'll scale columns to fit
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    // reset main column widths when rows change
    setColWidths(keys.map((_, idx) => (idx === keys.length - 1 ? 300 : 140)))
  }, [rows])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth)
    })
    ro.observe(el)
    setContainerWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [rows])

  useEffect(() => {
    function onMove(e) {
      if (!resizingRef.current) return
      const { type, idx, startX, startWidth, targetRow } = resizingRef.current
      const delta = e.clientX - startX
      const newW = Math.max(60, startWidth + delta)
      if (type === 'main') {
        setColWidths(ws => {
          const copy = [...ws]
          copy[idx] = newW
          return copy
        })
      } else if (type === 'extras') {
        setExtrasWidths(prev => {
          const cur = prev[targetRow] ? [...prev[targetRow]] : keys.map((_, j) => (j === keys.length - 1 ? 300 : 140))
          cur[idx] = newW
          return { ...prev, [targetRow]: cur }
        })
      }
    }
    function onUp() { resizingRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [keys])

  function startResizeMain(idx, e) {
    e.preventDefault(); e.stopPropagation()
    resizingRef.current = { type: 'main', idx, startX: e.clientX, startWidth: colWidths[idx] || 140 }
  }
  function startResizeExtras(rowIndex, idx, e) {
    e.preventDefault(); e.stopPropagation()
    const startWidth = (extrasWidths[rowIndex] && extrasWidths[rowIndex][idx]) || 140
    resizingRef.current = { type: 'extras', idx, startX: e.clientX, startWidth, targetRow: rowIndex }
  }

  // compute scaled widths so fixed columns fit and last column remains flexible
  const MIN_COL = 60
  const lastIdx = keys.length - 1
  // start from base widths
  let scaledColWidths = colWidths.map(w => Math.max(MIN_COL, Math.floor(w)))
  if (containerWidth) {
    // sum of fixed columns (excluding last)
    const sumFixed = scaledColWidths.reduce((acc, w, idx) => idx === lastIdx ? acc : acc + w, 0)
    const lastBase = scaledColWidths[lastIdx] || 300
    const availableForFixed = Math.max(0, containerWidth - Math.max(MIN_COL, lastBase))
    if (sumFixed > availableForFixed && sumFixed > 0) {
      const scale = availableForFixed / sumFixed
      scaledColWidths = scaledColWidths.map((w, idx) => idx === lastIdx ? scaledColWidths[idx] : Math.max(MIN_COL, Math.floor(w * scale)))
    }
  }

  // nested table uses fixed layout so we can control column widths; last column will be left flexible (no width style, only minWidth)
  return (
    <div ref={containerRef} className="overflow-y-auto overflow-x-hidden">
      <table className="min-w-full text-sm border" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 border text-left" style={{ width: 36 }} />
              {keys.map((k, idx) => {
              const meta = FIELD_MAP[k]
              const title = meta ? `${k} — ${meta.descricao || ''} [${meta.inicio ?? '-'}-${meta.fim ?? '-'}]` : k
              const isLast = idx === keys.length - 1
              const style = isLast ? { minWidth: scaledColWidths[idx] } : { width: scaledColWidths[idx] }
              return (
                <th key={k} className="px-2 py-1 text-left border relative" style={style}>
                  <div className="truncate" title={title}>{k}</div>
                  <div onMouseDown={(e) => startResizeMain(idx, e)} className="absolute right-0 top-0 h-full w-2 -mr-1 cursor-col-resize" />
                </th>
              )
            })}  
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <tr role="button" tabIndex={0} onClick={() => setSelectedRow(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRow(i) } }} className={`odd:bg-white even:bg-gray-50 ${r.extras && r.extras.length ? 'cursor-pointer hover:bg-gray-100' : ''} ${selectedRow === i ? 'bg-indigo-100 border-l-4 border-indigo-400 hover:bg-indigo-100 font-medium' : ''}`}>
                <td className="px-2 py-1 border align-top" style={{ width: 36 }}>
                  {r.extras && r.extras.length ? (
                    <button onClick={(e) => { e.stopPropagation(); toggle(i); setSelectedRow(i) }} className="px-1 py-0.5 text-xs bg-gray-200 rounded">{expanded[i] ? '−' : '+'}</button>
                  ) : null}
                </td>
                {keys.map((k, idx) => {
                  const isLast = idx === keys.length - 1
                  const cellStyle = isLast ? { minWidth: scaledColWidths[idx], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: scaledColWidths[idx], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                  return (
                    <td key={k} className="px-2 py-1 border align-top" style={cellStyle} title={r[k] === null ? '' : (typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k] ?? ''))}>
                      {r[k] === null ? <div className="text-xs truncate"></div> : (typeof r[k] === 'object' ? <div className="text-xs truncate">{JSON.stringify(r[k], null, 2)}</div> : <div className="text-xs truncate">{String(r[k] ?? '')}</div>)}
                    </td>
                  )
                })} 
              </tr>

              {expanded[i] && r.extras && r.extras.length > 0 && (
                <tr>
                  <td colSpan={keys.length + 1} className="p-2 border bg-gray-50">
                    <div className="text-sm font-medium mb-2">Detalhes (Registros tipo 8)</div>
                    <div className="overflow-y-auto overflow-x-hidden">
                      {/** extras table: fixed layout, last column flexible */}
                      <table className="min-w-full text-sm border" style={{ width: '100%', tableLayout: 'fixed' }}>
                        <thead className="bg-white">
                          <tr>
                            {Object.keys(r.extras[0] || {}).map((k, idx, arr) => {
                              const base = extrasWidths[i] || Object.keys(r.extras[0] || {}).map((_, j) => (j === arr.length - 1 ? 300 : 140))
                              const total = base.reduce((a, b) => a + b, 0)
                              const scale = containerWidth && total > containerWidth ? containerWidth / total : 1
                              let widths = base.map(w => Math.max(60, Math.floor(w * scale)))
                              const lastIndex = arr.length - 1
                              if (containerWidth) {
                                const sumFixed = widths.reduce((acc, w, j) => j === lastIndex ? acc : acc + w, 0)
                                const availableForFixed = Math.max(0, containerWidth - Math.max(60, widths[lastIndex]))
                                if (sumFixed > availableForFixed && sumFixed > 0) {
                                  const sScale = availableForFixed / sumFixed
                                  widths = widths.map((w, j) => j === lastIndex ? widths[j] : Math.max(60, Math.floor(w * sScale)))
                                }
                              }
                              const meta = FIELD_MAP[k]
                              const title = meta ? `${k} — ${meta.descricao || ''} [${meta.inicio ?? '-'}-${meta.fim ?? '-'}]` : k
                              const isLast = idx === (arr.length - 1)
                              const style = isLast ? { minWidth: widths[idx] } : { width: widths[idx] }
                              return (
                                <th key={k} className="px-2 py-1 text-left border relative" style={style}>
                                  <div className="truncate" title={title}>{k}</div>
                                  <div onMouseDown={(e) => startResizeExtras(i, idx, e)} className="absolute right-0 top-0 h-full w-2 -mr-1 cursor-col-resize" />
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {r.extras.map((ex, ei) => (
                            <tr key={ei} className="odd:bg-white even:bg-gray-50">
                              {Object.keys(r.extras[0] || {}).map((k, idx, arr) => {
                                const base = extrasWidths[i] || Object.keys(r.extras[0] || {}).map((_, j) => (j === arr.length - 1 ? 300 : 140))
                                const total = base.reduce((a, b) => a + b, 0)
                                const scale = containerWidth && total > containerWidth ? containerWidth / total : 1
                                let widths = base.map(w => Math.max(60, Math.floor(w * scale)))
                                if (containerWidth) {
                                  const s = widths.reduce((a, b) => a + b, 0)
                                  if (s > containerWidth) {
                                    const diff = s - containerWidth
                                    widths[widths.length - 1] = Math.max(60, widths[widths.length - 1] - diff)
                                  }
                                }
                                const isLastCell = idx === (arr.length - 1)
                                const tdStyle = isLastCell ? { minWidth: widths[idx], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: widths[idx], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                                return (
                                  <td key={k} className="px-2 py-1 border align-top" style={tdStyle} title={ex[k] === null ? '' : (typeof ex[k] === 'object' ? JSON.stringify(ex[k]) : String(ex[k] ?? ''))}>
                                    {ex[k] === null ? <div className="text-xs truncate"></div> : (typeof ex[k] === 'object' ? <div className="text-xs truncate">{JSON.stringify(ex[k], null, 2)}</div> : <div className="text-xs truncate">{String(ex[k] ?? '')}</div>)}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function JSONTable({ data }) {
  const [expanded, setExpanded] = useState({})

  if (!data) return <div className="text-sm text-gray-500">Ainda não há JSON gerado.</div>

  // show main columns: take union of top-level keys except internal arrays
  const sample = data[0] || {}
  const keys = Object.keys(sample).filter(k => k !== 'itens' && k !== 'duplicatas')

  function toggle(i) {
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="h-full">
      <div className="h-full overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="px-2 py-2 border" style={{ width: 36 }} />
              <th className="px-2 py-2 border">#</th>
              {keys.map(k => (
                <th key={k} className="px-2 py-2 border text-left">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <React.Fragment key={i}>
                <tr role="button" tabIndex={0} onClick={() => toggle(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) } }} className="odd:bg-white even:bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <td className="px-2 py-1 border align-top" style={{ width: 36 }}>
                  {(row.itens && row.itens.length) || (row.duplicatas && row.duplicatas.length) ? (
                    <button onClick={(e) => { e.stopPropagation(); toggle(i) }} className="px-1 py-0.5 text-xs bg-gray-200 rounded">{expanded[i] ? '−' : '+'}</button>
                  ) : null}
                </td>
                <td className="px-2 py-1 border align-top">{i + 1}</td>
                  {keys.map(k => (
                    <td key={k} className="px-2 py-1 border align-top">
                      {row[k] === null ? '' : (typeof row[k] === 'object' ? <pre className="text-xs whitespace-pre-wrap max-w-xs">{JSON.stringify(row[k], null, 2)}</pre> : String(row[k] ?? ''))}
                    </td>
                  ))}
                </tr>
                {expanded[i] && (
                  <tr>
                    <td colSpan={keys.length + 2} className="p-3 border bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Itens</h4>
                          <div className="mt-2 max-h-80 overflow-y-auto overflow-x-hidden">
                            <NestedTable rows={row.itens} />
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium">Faturas / Duplicatas</h4>
                          <div className="mt-2 max-h-80 overflow-y-auto overflow-x-hidden">
                            <NestedTable rows={row.duplicatas} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
