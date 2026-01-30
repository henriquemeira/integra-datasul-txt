import React, { useState } from 'react'
import FileDrop from './components/FileDrop'
import PreviewTable from './components/PreviewTable'
import { parseFile } from './utils/parser'

export default function App() {
  const [rawText, setRawText] = useState('')
  const [rawLines, setRawLines] = useState([])
  const [parsed, setParsed] = useState(null)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('')

  function handleFileRead(text) {
    setRawText(text)
    const lines = text.split(/\r?\n/).map((l, i) => ({ lineNumber: i + 1, raw: l, type: l.charAt(0) || '' }))
    setRawLines(lines)
    setParsed(null)
    setMessage('Arquivo carregado com sucesso')
    setMessageType('success')
  }

  function handleParse() {
    try {
      if (!rawText) throw new Error('Nenhum arquivo carregado')
      const res = parseFile(rawText)
      setParsed(res)
      setMessage('Parse concluído com sucesso')
      setMessageType('success')
    } catch (err) {
      setMessage('Erro no parse: ' + err.message)
      setMessageType('error')
    }
  }

  function handleDownload() {
    if (!parsed) return
    const blob = new Blob([JSON.stringify(parsed.result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dados-datasul.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Conversor Datasul TXT → JSON</h1>
          <p className="text-sm text-gray-600">Upload, verificação e conversão de arquivos posicionais (flat file) para JSON.</p>
        </header>

        {message && (
          <div className={`p-3 mb-4 rounded ${messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FileDrop onFileRead={handleFileRead} />

            <div className="mt-4 flex gap-2">
              <button onClick={handleParse} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Parse</button>
              <button onClick={handleDownload} disabled={!parsed} className={`px-4 py-2 rounded ${parsed ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500'}`}>Download JSON</button>
            </div>

            <div className="mt-4">
              <h2 className="font-medium">JSON gerado</h2>
              <pre className="mt-2 p-3 bg-white rounded border overflow-auto max-h-64 text-xs">{parsed ? JSON.stringify(parsed.result, null, 2) : '—'}</pre>
            </div>
          </div>

          <div>
            <h2 className="font-medium">Visualização do arquivo</h2>
            <div className="mt-2 bg-white rounded border p-2">
              <PreviewTable lines={rawLines} />
            </div>
          </div>
        </div>

        <footer className="mt-8 text-sm text-gray-500">
          <p>Layout: consulte os arquivos em <code>doc/</code>. Feedback visual de sucesso/erro exibido acima.</p>
        </footer>
      </div>
    </div>
  )
}
