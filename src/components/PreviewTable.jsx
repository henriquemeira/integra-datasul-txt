import React, { useState, useEffect, useRef } from 'react'
import tipo1Layout from '../layouts/layout-txt-integracao-datasul-tipo1.json'
import tipo2Layout from '../layouts/layout-txt-integracao-datasul-tipo2.json'
import tipo4Layout from '../layouts/layout-txt-integracao-datasul-tipo4.json'
import tipo8Layout from '../layouts/layout-txt-integracao-datasul-tipo8.json'

function buildDescriptors(layoutArray) {
  return (layoutArray || [])
    .map(f => ({ name: f.campo, descricao: f.descricao, start: f.inicio || null, end: f.fim || null }))
    .filter(d => d.name && d.start && d.end)
    .sort((a, b) => a.start - b.start)
}

const layouts = {
  '1': buildDescriptors(tipo1Layout),
  '2': buildDescriptors(tipo2Layout),
  '4': buildDescriptors(tipo4Layout),
  '8': buildDescriptors(tipo8Layout)
}

const palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

function colorForIndex(i) {
  return palette[i % palette.length]
}

function safeSliceRaw(raw, start1, end1) {
  const start = Math.max(0, start1 - 1)
  const end = Math.min(raw.length, end1)
  return raw.slice(start, end)
}

export default function PreviewTable({ lines = [], showLegend = true }) {
  const [hoveredLine, setHoveredLine] = useState(null)
  const [pinnedLine, setPinnedLine] = useState(null)
  const [legendVisible, setLegendVisible] = useState(true)
  const [legendHeight, setLegendHeight] = useState(160) // px
  const [legendWidth, setLegendWidth] = useState(320) // px
  const [dock, setDock] = useState('float') // 'float' | 'left' | 'right'
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      if (dock === 'float') {
        // compute height from bottom of container to mouse Y, keep within 60px and 70vh
        const max = Math.min(window.innerHeight * 0.7, rect.height)
        const newHeight = Math.max(60, Math.min(max, rect.bottom - e.clientY))
        setLegendHeight(newHeight)
      } else {
        // horizontal resize for docked panel
        const maxWidth = Math.min(rect.width * 0.9, rect.width)
        if (dock === 'right') {
          const newWidth = Math.max(160, Math.min(maxWidth, rect.right - e.clientX))
          setLegendWidth(newWidth)
        } else if (dock === 'left') {
          const newWidth = Math.max(160, Math.min(maxWidth, e.clientX - rect.left))
          setLegendWidth(newWidth)
        }
      }
    }
    function onMouseUp() { setIsResizing(false) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing, dock])

  if (!lines.length) return <div className="p-6 text-sm text-gray-500">Nenhum conteúdo carregado</div>

  function renderColored(lineObj) {
    const raw = lineObj.raw || ''
    const type = (lineObj.type || '').toString()
    const desc = layouts[type]
    if (!desc || desc.length === 0) {
      return <code className="text-xs whitespace-pre-wrap">{raw}</code>
    }

    const parts = []
    let lastPos = 1
    desc.forEach((f, idx) => {
      if (f.start > lastPos) {
        // gap
        parts.push({ text: safeSliceRaw(raw, lastPos, f.start - 1), color: null, name: null })
      }
      const txt = safeSliceRaw(raw, f.start, f.end)
      parts.push({ text: txt, color: colorForIndex(idx), name: f.name, descricao: f.descricao, start: f.start, end: f.end })
      lastPos = f.end + 1
    })
    if (lastPos <= raw.length) {
      parts.push({ text: safeSliceRaw(raw, lastPos, raw.length), color: null, name: null })
    }

    return (
      <code className="text-xs font-mono whitespace-pre-wrap">
        {parts.map((p, i) => (
          <span key={i} title={p.name ? `${p.name} — ${p.descricao || ''} [${p.start ?? '-'}-${p.end ?? '-'}]` : ''} style={{ color: p.color || undefined, background: p.color ? 'rgba(0,0,0,0.02)' : undefined }} className={p.name ? 'px-0' : ''}>
            {p.text}
          </span>
        ))}
      </code>
    )
  }

  function legendForLine(lineObj) {
    const type = (lineObj.type || '').toString()
    const desc = layouts[type] || []
    return desc.map((f, idx) => ({ name: f.name, descricao: f.descricao, start: f.start, end: f.end, color: colorForIndex(idx) }))
  }

  const whichLine = pinnedLine || hoveredLine
  const legend = whichLine ? legendForLine(lines.find(l => l.lineNumber === whichLine) || {}) : []

  return (
    <div ref={containerRef} className="overflow-auto h-full relative">

      {showLegend && (
      /* Legend panel: floating or docked */
      ((dock === 'float') ? (
        <div style={{ right: 16, top: 16 }} className={`absolute z-20 ${whichLine ? '' : 'opacity-50'}`}>
          <div className="bg-white border rounded shadow p-2 text-xs" style={{ width: legendWidth, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center gap-2 mb-2">
              <strong className="text-sm">Legenda</strong>
              <div className="ml-auto text-gray-500 text-xs">Linha: {whichLine || '-'}</div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => setDock('left')} className={`px-2 py-0.5 text-xs ${dock==='left' ? 'bg-blue-100' : 'bg-gray-100'} rounded`}>⇤</button>
                <button onClick={() => setDock('float')} className={`px-2 py-0.5 text-xs ${dock==='float' ? 'bg-blue-100' : 'bg-gray-100'} rounded`}>○</button>
                <button onClick={() => setDock('right')} className={`px-2 py-0.5 text-xs ${dock==='right' ? 'bg-blue-100' : 'bg-gray-100'} rounded`}>⇥</button>
              </div>
              <button onClick={() => { setPinnedLine(null); setHoveredLine(null) }} className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">Limpar</button>
              <button onClick={() => setLegendVisible(v => !v)} className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">{legendVisible ? 'Ocultar' : 'Mostrar'}</button>
            </div>

            <div style={{ height: legendVisible ? legendHeight + 'px' : 0, transition: 'height 120ms ease' }} className="overflow-auto border rounded p-1">
              {whichLine && legend.length > 0 ? (
                legend.map((g, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <div style={{ width: 18, height: 14, background: g.color, borderRadius: 3, flexShrink: 0 }} />
                    <div className="text-xs">
                      <div className="font-medium">{g.name} <span className="text-gray-500">[{g.start}-{g.end}]</span></div>
                      <div className="text-gray-600">{g.descricao}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">Passe o mouse sobre uma linha para ver a legenda.</div>
              )}
            </div>

            {/* resizer (horizontal) */}
            <div className="mt-2">
              <div onMouseDown={(e) => { e.preventDefault(); setIsResizing(true) }} className="h-1 bg-gray-200 rounded cursor-row-resize" />
            </div>
          </div>
        </div>
      ) : (
        <div className={`absolute z-20 top-0 ${dock === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="bg-white border-l border-r shadow p-2 text-xs h-full flex flex-col" style={{ width: legendVisible ? legendWidth + 'px' : '40px' }}>
            <div className="flex items-center gap-2 mb-2">
              <strong className="text-sm">Legenda</strong>
              <div className="ml-auto text-gray-500 text-xs">Linha: {whichLine || '-'}</div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => setDock('left')} className={`px-2 py-0.5 text-xs ${dock==='left' ? 'bg-blue-100' : 'bg-gray-100'} rounded`}>⇤</button>
                <button onClick={() => setDock('float')} className={`px-2 py-0.5 text-xs ${dock==='float' ? 'bg-blue-100' : 'bg-gray-100'} rounded`}>○</button>
                <button onClick={() => setDock('right')} className={`px-2 py-0.5 text-xs ${dock==='right' ? 'bg-blue-100' : 'bg-gray-100'} rounded`}>⇥</button>
              </div>
              <button onClick={() => { setPinnedLine(null); setHoveredLine(null) }} className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">Limpar</button>
              <button onClick={() => setLegendVisible(v => !v)} className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">{legendVisible ? 'Ocultar' : 'Mostrar'}</button>
            </div>

            <div className="overflow-auto border rounded p-1 flex-1">
              {whichLine && legend.length > 0 ? (
                legend.map((g, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <div style={{ width: 18, height: 14, background: g.color, borderRadius: 3, flexShrink: 0 }} />
                    <div className="text-xs">
                      <div className="font-medium">{g.name} <span className="text-gray-500">[{g.start}-{g.end}]</span></div>
                      <div className="text-gray-600">{g.descricao}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">Passe o mouse sobre uma linha para ver a legenda.</div>
              )}
            </div>

            {/* vertical resizer */}
            <div className={`absolute top-0 ${dock === 'right' ? 'left-0' : 'right-0'}`} style={{ width: 8 }}>
              <div onMouseDown={(e) => { e.preventDefault(); setIsResizing(true) }} className="h-full bg-transparent hover:bg-gray-200 cursor-col-resize" />
            </div>
          </div>
        </div>
      )))}

      {showLegend && <div className="mb-2 text-xs text-gray-600">Passe o mouse sobre uma linha para ver a legenda; clique para fixar a seleção.</div>} 

      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="text-left text-xs text-gray-500">
            <th className="px-2 py-1">#</th>
            <th className="px-2 py-1">Tipo</th>
            <th className="px-2 py-1">Conteúdo</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(l => (
            <tr key={l.lineNumber} className={`odd:bg-gray-50 align-top ${pinnedLine === l.lineNumber ? 'bg-yellow-50' : ''}`} onMouseEnter={() => setHoveredLine(l.lineNumber)} onMouseLeave={() => setHoveredLine(null)} onClick={() => setPinnedLine(pinnedLine === l.lineNumber ? null : l.lineNumber)}>
              <td className="px-2 py-1 align-top">{l.lineNumber}</td>
              <td className="px-2 py-1 align-top"><span className="font-medium">{l.type || '-'}</span></td>
              <td className="px-2 py-1 align-top">{renderColored(l)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
