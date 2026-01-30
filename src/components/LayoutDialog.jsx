import React, { useEffect, useRef, useState } from 'react'
import tipo1Layout from '../layouts/layout-txt-integracao-datasul-tipo1.json'
import tipo2Layout from '../layouts/layout-txt-integracao-datasul-tipo2.json'
import tipo4Layout from '../layouts/layout-txt-integracao-datasul-tipo4.json'
import tipo8Layout from '../layouts/layout-txt-integracao-datasul-tipo8.json'

const layouts = {
  '1': { title: 'Registro 1', fields: tipo1Layout },
  '2': { title: 'Registro 2', fields: tipo2Layout },
  '4': { title: 'Registro 4', fields: tipo4Layout },
  '8': { title: 'Registro 8', fields: tipo8Layout }
}

export default function LayoutDialog({ visible, onClose }) {
  const [tab, setTab] = useState('1')
  const [pos, setPos] = useState({ x: 80, y: 80 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ dx: 0, dy: 0 })
  const ref = useRef(null)

  useEffect(() => {
    function onMove(e) {
      if (!dragging) return
      setPos(p => ({ x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy }))
    }
    function onUp() { setDragging(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  function startDrag(e) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    dragRef.current.dx = e.clientX - rect.left
    dragRef.current.dy = e.clientY - rect.top
    setDragging(true)
  }

  if (!visible) return null

  const cur = layouts[tab]

  return (
    <div style={{ left: pos.x, top: pos.y }} className="fixed z-50 w-[680px] bg-white border rounded shadow" ref={ref}>
      <div onMouseDown={startDrag} className="flex items-center gap-2 p-2 bg-gray-100 border-b cursor-move">
        <strong>{cur.title} - Layout</strong>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-600">Visualize posições, tipos e descrições</div>
          <button onClick={onClose} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">Fechar</button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex gap-2 mb-3">
          {Object.keys(layouts).map(k => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1 text-sm rounded ${tab === k ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{layouts[k].title}</button>
          ))}
        </div>

        <div className="max-h-[50vh] overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-1 border text-left">#</th>
                <th className="px-2 py-1 border text-left">Campo</th>
                <th className="px-2 py-1 border text-left">Início</th>
                <th className="px-2 py-1 border text-left">Término</th>
                <th className="px-2 py-1 border text-left">Tipo</th>
                <th className="px-2 py-1 border text-left">Decimais</th>
                <th className="px-2 py-1 border text-left">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {(cur.fields || []).map((f, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="px-2 py-1 border align-top">{i + 1}</td>
                  <td className="px-2 py-1 border align-top">{f.campo}</td>
                  <td className="px-2 py-1 border align-top">{f.inicio}</td>
                  <td className="px-2 py-1 border align-top">{f.fim}</td>
                  <td className="px-2 py-1 border align-top">{f.tipo}</td>
                  <td className="px-2 py-1 border align-top">{f.decimais ?? ''}</td>
                  <td className="px-2 py-1 border align-top">{f.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
