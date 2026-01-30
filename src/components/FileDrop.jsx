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
        className={`border-2 border-dashed rounded p-6 text-center transition ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p className="text-sm text-gray-600">Arraste e solte o arquivo .txt aqui ou clique para selecionar</p>
        <input className="mt-3" type="file" accept=".txt" onChange={onFileChange} />
      </div>
    </div>
  )
}
