'use client'

import { useState, useMemo } from 'react'
import { TrekkingRecord } from '@/data/recordsData'

type SortKey =
  | 'nombre'
  | 'localidad'
  | 'cantidad'
  | 'alturaMaxima'
  | 'distancia'
  | 'desnivel'
  | 'dificultad'
type SortDir = 'asc' | 'desc'

const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Fácil',
  2: 'Moderado',
  3: 'Difícil',
  4: 'Muy difícil',
  5: 'Extremo',
}

// ── Auto difficulty calculator ──────────────────────────────────────────────
// score = distancia(km) + desnivel(m) / 100
// Validated: 17.63km + 1490m → score 32.5 → 4★ (matches Wikiloc "Muy difícil")

function calcDificultad(distancia: number | null, desnivel: number | null): number | null {
  if (distancia === null || desnivel === null) return null
  const score = distancia + desnivel / 100
  if (score < 5) return 1
  if (score < 12) return 2
  if (score < 22) return 3
  if (score < 35) return 4
  return 5
}

// ── Static stars display ────────────────────────────────────────────────────

function Stars({ value, suggested = false }: { value: number | null; suggested?: boolean }) {
  if (value === null) return <span className="text-gray-300 dark:text-gray-700">—</span>
  return (
    <span
      title={suggested ? `Sugerido: ${DIFFICULTY_LABEL[value]}` : DIFFICULTY_LABEL[value]}
      className="inline-flex items-center gap-1"
    >
      <span>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={
              i < value
                ? suggested
                  ? 'text-yellow-200 dark:text-yellow-800'
                  : 'text-yellow-400'
                : 'text-gray-200 dark:text-gray-700'
            }
          >
            ★
          </span>
        ))}
      </span>
      {suggested && (
        <span className="text-xs text-gray-400 dark:text-gray-600">~{DIFFICULTY_LABEL[value]}</span>
      )}
    </span>
  )
}

// ── Editable stars ──────────────────────────────────────────────────────────

function StarEditor({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value ?? 0

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          title={DIFFICULTY_LABEL[i + 1]}
          onClick={() => onChange(value === i + 1 ? null : i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(null)}
          className={`text-base leading-none transition-colors ${
            i < display ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'
          } hover:text-yellow-300`}
        >
          ★
        </button>
      ))}
      {value !== null && (
        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
          {hovered ? DIFFICULTY_LABEL[hovered] : DIFFICULTY_LABEL[value]}
        </span>
      )}
    </span>
  )
}

// ── Save helper ─────────────────────────────────────────────────────────────

async function saveRecord(nombre: string, localidad: string, patch: Partial<TrekkingRecord>) {
  await fetch('/api/update-record', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _nombre: nombre, _localidad: localidad, ...patch }),
  })
}

// ── Main component ──────────────────────────────────────────────────────────

export default function RecordsTable({
  data,
  isEditMode = false,
}: {
  data: TrekkingRecord[]
  isEditMode?: boolean
}) {
  const [localData, setLocalData] = useState<TrekkingRecord[]>(data)
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

  function updateRecord(nombre: string, localidad: string, patch: Partial<TrekkingRecord>) {
    setLocalData((prev) =>
      prev.map((r) => (r.nombre === nombre && r.localidad === localidad ? { ...r, ...patch } : r))
    )
    saveRecord(nombre, localidad, patch)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return localData.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.localidad.toLowerCase().includes(q) ||
        r.observacion.toLowerCase().includes(q)
    )
  }, [localData, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // For dificultad, use the effective value (stored or auto-calculated)
      let valA =
        sortKey === 'dificultad'
          ? (a.dificultad ?? calcDificultad(a.distancia, a.desnivel))
          : a[sortKey]
      let valB =
        sortKey === 'dificultad'
          ? (b.dificultad ?? calcDificultad(b.distancia, b.desnivel))
          : b[sortKey]

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
    'cursor-pointer select-none px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors sm:px-4 sm:py-3'

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
        {sorted.length} de {localData.length} trekkings
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-6 px-1 py-2 sm:w-8 sm:px-2 sm:py-3" />
              <th className={thClass} onClick={() => handleSort('nombre')}>
                Nombre <SortIcon col="nombre" />
              </th>
              <th className={`${thClass} hidden sm:table-cell`} onClick={() => handleSort('localidad')}>
                Localidad <SortIcon col="localidad" />
              </th>
              <th className={`${thClass} text-center`} onClick={() => handleSort('cantidad')}>
                Veces <SortIcon col="cantidad" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('alturaMaxima')}>
                <span className="sm:hidden">Alt.</span>
                <span className="hidden sm:inline">Altura máx.</span>
                <SortIcon col="alturaMaxima" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('distancia')}>
                <span className="sm:hidden">Dist.</span>
                <span className="hidden sm:inline">Distancia</span>
                <SortIcon col="distancia" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('desnivel')}>
                <span className="sm:hidden">↑ m</span>
                <span className="hidden sm:inline">Desnivel</span>
                <SortIcon col="desnivel" />
              </th>
              <th className={`${thClass} text-center`} onClick={() => handleSort('dificultad')}>
                <span className="sm:hidden">★</span>
                <span className="hidden sm:inline">Dificultad</span>
                <SortIcon col="dificultad" />
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:table-cell dark:text-gray-400">
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
                {/* Link */}
                <td className="w-6 px-1 py-2 text-center sm:w-8 sm:px-2 sm:py-3">
                  {isEditMode ? (
                    <input
                      type="url"
                      placeholder="URL"
                      defaultValue={record.url ?? ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim() || null
                        if (val !== record.url) {
                          updateRecord(record.nombre, record.localidad, { url: val })
                        }
                      }}
                      className="w-40 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : record.url ? (
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver ruta"
                      className="inline-flex items-center text-teal-500 hover:text-teal-400 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ) : null}
                </td>

                <td className="px-2 py-2 font-medium text-gray-900 sm:px-4 sm:py-3 dark:text-gray-100">
                  {isEditMode ? (
                    <input
                      type="text"
                      defaultValue={record.nombre}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val && val !== record.nombre) {
                          updateRecord(record.nombre, record.localidad, { nombre: val })
                        }
                      }}
                      className="w-full min-w-[120px] rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : (
                    record.nombre
                  )}
                </td>
                <td className="hidden px-4 py-3 text-gray-600 sm:table-cell dark:text-gray-400">
                  {isEditMode ? (
                    <input
                      type="text"
                      defaultValue={record.localidad}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val && val !== record.localidad) {
                          updateRecord(record.nombre, record.localidad, { localidad: val })
                        }
                      }}
                      className="w-full min-w-[100px] rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : (
                    record.localidad
                  )}
                </td>
                <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
                  {isEditMode ? (
                    <input
                      type="number"
                      step="1"
                      min="1"
                      defaultValue={record.cantidad}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val >= 1 && val !== record.cantidad) {
                          updateRecord(record.nombre, record.localidad, { cantidad: val })
                        }
                      }}
                      className="w-14 rounded border border-gray-300 bg-white px-2 py-0.5 text-center text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : (
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
                  )}
                </td>
                <td className="px-2 py-2 text-right text-gray-700 sm:px-4 sm:py-3 dark:text-gray-300">
                  {isEditMode ? (
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="m"
                      defaultValue={record.alturaMaxima ?? ''}
                      onBlur={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10)
                        if (val !== record.alturaMaxima) {
                          updateRecord(record.nombre, record.localidad, { alturaMaxima: val })
                        }
                      }}
                      className="w-20 rounded border border-gray-300 bg-white px-2 py-0.5 text-right text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : record.alturaMaxima !== null ? (
                    <span>
                      <span className="font-medium">
                        {record.alturaMaxima.toLocaleString('es-AR')}
                      </span>
                      <span className="ml-1 hidden text-xs text-gray-400 sm:inline">msnm</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Distancia */}
                <td className="px-2 py-2 text-right text-gray-700 sm:px-4 sm:py-3 dark:text-gray-300">
                  {isEditMode ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="km"
                      defaultValue={record.distancia ?? ''}
                      onBlur={(e) => {
                        const val = e.target.value === '' ? null : parseFloat(e.target.value)
                        if (val !== record.distancia) {
                          updateRecord(record.nombre, record.localidad, { distancia: val })
                        }
                      }}
                      className="w-20 rounded border border-gray-300 bg-white px-2 py-0.5 text-right text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : record.distancia !== null ? (
                    <span>
                      <span className="font-medium">
                        {record.distancia.toLocaleString('es-AR')}
                      </span>
                      <span className="ml-1 hidden text-xs text-gray-400 sm:inline">km</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Desnivel */}
                <td className="px-2 py-2 text-right text-gray-700 sm:px-4 sm:py-3 dark:text-gray-300">
                  {isEditMode ? (
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="m"
                      defaultValue={record.desnivel ?? ''}
                      onBlur={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10)
                        if (val !== record.desnivel) {
                          updateRecord(record.nombre, record.localidad, { desnivel: val })
                        }
                      }}
                      className="w-20 rounded border border-gray-300 bg-white px-2 py-0.5 text-right text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : record.desnivel !== null ? (
                    <span>
                      <span className="font-medium">
                        ↑ {record.desnivel.toLocaleString('es-AR')}
                      </span>
                      <span className="ml-1 hidden text-xs text-gray-400 sm:inline">m</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Dificultad */}
                <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
                  {isEditMode ? (
                    <div className="flex flex-col items-center gap-1">
                      <StarEditor
                        value={record.dificultad}
                        onChange={(v) =>
                          updateRecord(record.nombre, record.localidad, { dificultad: v })
                        }
                      />
                      {record.dificultad === null &&
                        calcDificultad(record.distancia, record.desnivel) !== null && (
                          <button
                            type="button"
                            title={`Sugerido por distancia + desnivel: ${
                              DIFFICULTY_LABEL[calcDificultad(record.distancia, record.desnivel)!]
                            }`}
                            onClick={() =>
                              updateRecord(record.nombre, record.localidad, {
                                dificultad: calcDificultad(record.distancia, record.desnivel),
                              })
                            }
                            className="text-xs text-teal-500 hover:text-teal-400 dark:text-teal-400"
                          >
                            ↓ Usar sugerencia (
                            {DIFFICULTY_LABEL[calcDificultad(record.distancia, record.desnivel)!]})
                          </button>
                        )}
                    </div>
                  ) : record.dificultad !== null ? (
                    <Stars value={record.dificultad} />
                  ) : (
                    <Stars
                      value={calcDificultad(record.distancia, record.desnivel)}
                      suggested={true}
                    />
                  )}
                </td>

                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell dark:text-gray-400">
                  {isEditMode ? (
                    <input
                      type="text"
                      defaultValue={record.observacion}
                      onBlur={(e) => {
                        const val = e.target.value
                        if (val !== record.observacion) {
                          updateRecord(record.nombre, record.localidad, { observacion: val })
                        }
                      }}
                      className="w-full min-w-[160px] rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : (
                    record.observacion || '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
