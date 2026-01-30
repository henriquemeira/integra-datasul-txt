import React, { useCallback, useState } from 'react'

export default function FileDrop({ onFileRead }) {
  const [dragOver, setDragOver] = useState(false)

  const readFile = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => onFileRead(e.target.result)
    reader.readAsText(file, 'latin1')
  }, [onFileRead])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) readFile(file)
  }

  return (
    <div>
      <div
        title="Selecione um arquivo (.txt) clicando aqui ou arraste e solte um arquivo sobre esta área para upload"
        aria-label="Selecione um arquivo (.txt) clicando aqui ou arraste e solte um arquivo sobre esta área para upload"
        className={`border-2 border-dashed rounded p-1 text-center transition ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          onClick={() => document.getElementById('file-input').click()}
          className="mx-auto inline-flex items-center gap-2 px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
          aria-label="Selecione um arquivo (.txt) ou arraste e solte sobre esta área para upload"
          title="Selecione um arquivo (.txt) clicando aqui ou arraste e solte sobre esta área para upload"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18" />
          </svg>
          <span>Selecionar</span>
        </button>
        <input id="file-input" className="sr-only" type="file" accept=".txt" onChange={onFileChange} />
      </div>
    </div>
  )
}
