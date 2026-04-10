'use client'

import { useState, useMemo } from 'react'
import { TrekkingRecord } from '@/data/recordsData'

type SortKey = 'nombre' | 'localidad' | 'cantidad' | 'alturaMaxima'
type SortDir = 'asc' | 'desc'

export default function RecordsTable({ data }: { data: TrekkingRecord[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return data.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.localidad.toLowerCase().includes(q) ||
        r.observacion.toLowerCase().includes(q)
    )
  }, [data, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]

      if (valA === null) return 1
      if (valB === null) return -1

      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="ml-1 text-gray-400 dark:text-gray-600">↕</span>
    return <span className="ml-1 text-teal-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const thClass =
    'cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors'

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, localidad u observación..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-teal-400"
        />
      </div>

      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        {sorted.length} de {data.length} trekkings
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className={thClass} onClick={() => handleSort('nombre')}>
                Nombre <SortIcon col="nombre" />
              </th>
              <th className={thClass} onClick={() => handleSort('localidad')}>
                Localidad <SortIcon col="localidad" />
              </th>
              <th className={`${thClass} text-center`} onClick={() => handleSort('cantidad')}>
                Veces <SortIcon col="cantidad" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('alturaMaxima')}>
                Altura máx. <SortIcon col="alturaMaxima" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Observación
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {sorted.map((record, i) => (
              <tr
                key={`${record.nombre}-${record.localidad}-${i}`}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {record.nombre}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{record.localidad}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      record.cantidad >= 4
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                        : record.cantidad >= 2
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {record.cantidad}x
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                  {record.alturaMaxima !== null ? (
                    <span>
                      <span className="font-medium">
                        {record.alturaMaxima.toLocaleString('es-AR')}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">msnm</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {record.observacion || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
