import React from 'react'

export default function PreviewTable({ lines = [] }) {
  if (!lines.length) return <div className="p-6 text-sm text-gray-500">Nenhum conteúdo carregado</div>

  return (
    <div className="overflow-auto max-h-96">
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
            <tr key={l.lineNumber} className="odd:bg-gray-50">
              <td className="px-2 py-1 align-top">{l.lineNumber}</td>
              <td className="px-2 py-1 align-top"><span className="font-medium">{l.type || '-'}</span></td>
              <td className="px-2 py-1 align-top"><code className="text-xs whitespace-pre">{l.raw}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
