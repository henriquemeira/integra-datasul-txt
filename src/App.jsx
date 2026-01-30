import React, { useState } from 'react'
import FileDrop from './components/FileDrop'
import PreviewTable from './components/PreviewTable'
import JSONTable from './components/JSONTable'
import LayoutDialog from './components/LayoutDialog'
import { parseFile } from './utils/parser'

export default function App() {
  const [rawText, setRawText] = useState('')
  const [rawLines, setRawLines] = useState([])
  const [parsed, setParsed] = useState(null)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('')

  // transient toast notification (auto-close)
  const [notification, setNotification] = useState(null) // { text, type }
  const [notificationVisible, setNotificationVisible] = useState(false)

  // layout dialog
  const [showLayoutDialog, setShowLayoutDialog] = useState(false)

  // view tab: 'txt' | 'json' | 'table'
  const [viewTab, setViewTab] = useState('table')

  function handleFileRead(text) {
    setRawText(text)
    const lines = text.split(/\r?\n/).map((l, i) => ({ lineNumber: i + 1, raw: l, type: l.charAt(0) || '' }))
    setRawLines(lines)
    setParsed(null)
    // switch to TXT view so user sees the uploaded content immediately
    setViewTab('txt')
    // clear any persistent message and show transient notification
    setMessage(null)
    setMessageType('')
    setNotification({ text: 'Arquivo carregado com sucesso', type: 'success' })
    setNotificationVisible(true)
  }

  function handleParse() {
    try {
      if (!rawText) {
        setNotification({ text: 'Nenhum arquivo carregado', type: 'error' });
        setNotificationVisible(true);
        return;
      //  throw new Error('Nenhum arquivo carregado')
      }
      const res = parseFile(rawText)
      setParsed(res)
      // show transient notification instead of persistent banner
      setNotification({ text: 'Parse concluído com sucesso', type: 'success' })
      setNotificationVisible(true)
      // auto-hide is handled in useEffect below
    } catch (err) {
      // keep persistent banner for errors
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

  async function handleCopyJSON() {
    if (!parsed) return
    const text = JSON.stringify(parsed.result, null, 2)

    // navigator.clipboard supported
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        setNotification({ text: 'JSON copiado para o clipboard', type: 'success' })
        setNotificationVisible(true)
        return
      } catch (err) {
        // fall through to fallback
      }
    }

    // fallback using textarea + execCommand
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) {
        setNotification({ text: 'JSON copiado para o clipboard', type: 'success' })
        setNotificationVisible(true)
      } else {
        throw new Error('copy-failed')
      }
    } catch (err) {
      setMessage('Não foi possível copiar para o clipboard')
      setMessageType('error')
    }
  }

  // auto-hide notification after 3 seconds
  React.useEffect(() => {
    if (!notificationVisible) return
    const id = setTimeout(() => setNotificationVisible(false), 3000)
    return () => clearTimeout(id)
  }, [notificationVisible])

  function closeNotification() {
    setNotificationVisible(false)
  }

  return (
    <div className="min-h-screen pt-20 p-6 bg-gray-50">
      <div className="w-full">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Conversor Datasul TXT → JSON</h1>

            </div>

          </div>
        </header>

        {message && (
          <div className={`p-3 mb-4 rounded ${messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* transient toast notification (top-right) */}
        {notification && notificationVisible && (
          <div className="fixed right-4 top-4 z-50">
            <div className={`flex items-center gap-3 px-3 py-2 rounded shadow text-sm ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              <div>{notification.text}</div>
              <button onClick={closeNotification} className="ml-2 text-white/80 px-2 py-1 rounded bg-black/10">✕</button>
            </div>
          </div>
        )}

        {/* Top toolbar with file upload and primary actions (fixed) */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
          <div className="max-w-full mx-auto px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <FileDrop onFileRead={handleFileRead} />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleParse} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Parse</button>
                <button onClick={handleDownload} disabled={!parsed} className={`px-3 py-2 rounded text-sm ${parsed ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500'}`}>Download JSON</button>
              </div>
            </div>

            <div className="ml-6 flex items-center gap-2">
              <button onClick={() => setViewTab('txt')} className={`px-3 py-1 text-sm rounded ${viewTab === 'txt' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>TXT</button>
              <button onClick={() => setViewTab('json')} className={`px-3 py-1 text-sm rounded ${viewTab === 'json' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>JSON</button>
              <button onClick={() => setViewTab('table')} className={`px-3 py-1 text-sm rounded ${viewTab === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Tabela</button>
              <button onClick={() => setShowLayoutDialog(true)} className="px-3 py-1 text-sm rounded bg-gray-100">Layout</button>
            </div>

            <div className="ml-auto text-sm text-gray-500">{parsed ? `${parsed.result.length} registros` : 'nenhum parse'}</div>
          </div>
        </div>

        {/* Main visualization area occupies remaining page */}
        <main className="bg-white rounded border p-2 min-h-[75vh]">
          <div className="h-full overflow-auto p-2">
            {viewTab === 'txt' && (
              <div className="h-full overflow-auto">
                <PreviewTable lines={rawLines} showLegend={false} />
              </div>
            )}

            {viewTab === 'json' && (
                <div className="h-full overflow-auto p-2 flex flex-col">
                  <div className="mb-2 flex items-center">
                    <div className="flex-1" />
                    <button onClick={handleCopyJSON} disabled={!parsed} className={`px-3 py-1 text-sm rounded ${parsed ? 'bg-gray-100' : 'bg-gray-200 text-gray-400'}`}>Copiar JSON</button>
                  </div>

                  <div className="flex-1 overflow-auto">
                    {parsed ? <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(parsed.result, null, 2)}</pre> : <div className="text-sm text-gray-500">—</div>}
                  </div>
                </div>
            )}

            {viewTab === 'table' && (
              <div className="h-full overflow-auto">
                {parsed ? <JSONTable data={parsed.result} /> : <div className="text-sm text-gray-500">—</div>}
              </div>
            )}
          </div>
        </main>

        <footer className="mt-8 text-sm text-gray-500">
          <p>Layout: consulte os arquivos em <code>doc/</code>. Feedback visual de sucesso/erro exibido acima.</p>
        </footer>
        {/* Layout dialog component */}
        <LayoutDialog visible={showLayoutDialog} onClose={() => setShowLayoutDialog(false)} />      </div>
    </div>
  )
}
