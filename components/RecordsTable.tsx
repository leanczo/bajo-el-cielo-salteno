'use client'

import { useState, useMemo, useEffect, Fragment } from 'react'
import dynamic from 'next/dynamic'
import { TrekkingRecord } from '@/data/recordsData'
import type { ElevPoint } from '@/components/RowElevationChart'

const ElevationChart = dynamic(() => import('@/components/RowElevationChart'), { ssr: false })

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

// ── GPX helpers ──────────────────────────────────────────────────────────────

function routeColor(alturaMaxima: number | null): string {
  const h = alturaMaxima ?? 0
  if (h >= 5000) return '#f97316'
  if (h >= 4000) return '#0d9488'
  if (h >= 3000) return '#22c55e'
  return '#14b8a6'
}

function extractId(url: string): string | null {
  return url?.match(/\/([^/]+)-\d+$/)?.[1] ?? null
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function parseGpxElevation(text: string): ElevPoint[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  const pts = Array.from(doc.querySelectorAll('trkpt'))
    .map((pt) => ({
      lat: parseFloat(pt.getAttribute('lat') ?? '0'),
      lon: parseFloat(pt.getAttribute('lon') ?? '0'),
      ele: parseFloat(pt.querySelector('ele')?.textContent ?? '0'),
    }))
    .filter(({ lat, lon }) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0)

  const coords: [number, number][] = pts.map(({ lat, lon }) => [lat, lon])
  let cumDist = 0
  const points: ElevPoint[] = pts.map(({ ele }, i) => {
    if (i > 0) cumDist += haversineKm(coords[i - 1], coords[i])
    return { d: Math.round(cumDist * 100) / 100, ele: Math.round(ele) }
  })

  if (points.length <= 300) return points
  const step = points.length / 300
  return Array.from({ length: 300 }, (_, i) => points[Math.floor(i * step)])
}

// ── Share helper ─────────────────────────────────────────────────────────────

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
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
  onSelect,
}: {
  data: TrekkingRecord[]
  isEditMode?: boolean
  onSelect?: (nombre: string | null) => void
}) {
  const [localData, setLocalData] = useState<TrekkingRecord[]>(data)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [gpxCache, setGpxCache] = useState<Record<string, ElevPoint[] | null>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Auto-expand row when URL has ?trek=slug
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const trek = params.get('trek')
    if (!trek) return
    const match = data.find((r) => toSlug(r.nombre) === trek)
    if (!match) return
    const key = `${match.nombre}::${match.localidad}`
    setExpandedKey(key)
    const id = match.gpx ?? extractId(match.url ?? '')
    if (!id) {
      setGpxCache((prev) => ({ ...prev, [key]: null }))
      return
    }
    fetch(`/gpx/${id}.gpx`)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) =>
        setGpxCache((prev) => ({ ...prev, [key]: text ? parseGpxElevation(text) : null }))
      )
      .catch(() => setGpxCache((prev) => ({ ...prev, [key]: null })))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function shareRecord(record: TrekkingRecord) {
    const slug = toSlug(record.nombre)
    const url = `${window.location.origin}${window.location.pathname}?trek=${slug}`
    const key = `${record.nombre}::${record.localidad}`
    if (navigator.share) {
      try {
        await navigator.share({ title: record.nombre, url })
      } catch {
        /* cancelado */
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000)
    }
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleExpand(record: TrekkingRecord) {
    const key = `${record.nombre}::${record.localidad}`
    if (expandedKey === key) {
      setExpandedKey(null)
      onSelect?.(null)
      return
    }
    setExpandedKey(key)
    onSelect?.(record.nombre)
    if (key in gpxCache) return
    const id = record.gpx ?? extractId(record.url ?? '')
    if (!id) {
      setGpxCache((prev) => ({ ...prev, [key]: null }))
      return
    }
    fetch(`/gpx/${id}.gpx`)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        setGpxCache((prev) => ({ ...prev, [key]: text ? parseGpxElevation(text) : null }))
      })
      .catch(() => setGpxCache((prev) => ({ ...prev, [key]: null })))
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
          ? a.dificultad ?? calcDificultad(a.distancia, a.desnivel)
          : a[sortKey]
      let valB =
        sortKey === 'dificultad'
          ? b.dificultad ?? calcDificultad(b.distancia, b.desnivel)
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
              <th
                className={`${thClass} hidden sm:table-cell`}
                onClick={() => handleSort('localidad')}
              >
                Localidad <SortIcon col="localidad" />
              </th>
              <th className={`${thClass} text-center`} onClick={() => handleSort('cantidad')}>
                Veces <SortIcon col="cantidad" />
              </th>
              <th
                className={`${thClass} hidden text-right sm:table-cell`}
                onClick={() => handleSort('alturaMaxima')}
              >
                Altura máx.
                <SortIcon col="alturaMaxima" />
              </th>
              <th
                className={`${thClass} hidden text-right sm:table-cell`}
                onClick={() => handleSort('distancia')}
              >
                Distancia
                <SortIcon col="distancia" />
              </th>
              <th
                className={`${thClass} hidden text-right sm:table-cell`}
                onClick={() => handleSort('desnivel')}
              >
                Desnivel
                <SortIcon col="desnivel" />
              </th>
              <th
                className={`${thClass} hidden text-center sm:table-cell`}
                onClick={() => handleSort('dificultad')}
              >
                Dificultad
                <SortIcon col="dificultad" />
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:table-cell">
                Observación
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {sorted.map((record, i) => {
              const rowKey = `${record.nombre}::${record.localidad}`
              const isExpanded = expandedKey === rowKey
              const gpxId = record.gpx ?? extractId(record.url ?? '')
              return (
                <Fragment key={`${record.nombre}-${record.localidad}-${i}`}>
                  <tr
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800${
                      !isEditMode ? ' cursor-pointer select-none' : ''
                    }`}
                    onClick={!isEditMode ? () => toggleExpand(record) : undefined}
                  >
                    {/* Expand indicator + Link */}
                    <td className="w-8 px-1 py-2 text-center sm:w-10 sm:px-2 sm:py-3">
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
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`text-[9px] leading-none ${
                              isExpanded ? 'text-teal-500' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          {record.url && (
                            <a
                              href={record.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver ruta"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center text-teal-500 hover:text-teal-400 dark:text-teal-400 dark:hover:text-teal-300"
                            >
                              <svg
                                className="h-3.5 w-3.5"
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
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100 sm:px-4 sm:py-3">
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
                    <td className="hidden px-4 py-3 text-gray-600 dark:text-gray-400 sm:table-cell">
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
                    <td className="hidden px-4 py-3 text-right text-gray-700 dark:text-gray-300 sm:table-cell">
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
                    <td className="hidden px-4 py-3 text-right text-gray-700 dark:text-gray-300 sm:table-cell">
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
                    <td className="hidden px-4 py-3 text-right text-gray-700 dark:text-gray-300 sm:table-cell">
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
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
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
                                  DIFFICULTY_LABEL[
                                    calcDificultad(record.distancia, record.desnivel)!
                                  ]
                                }`}
                                onClick={() =>
                                  updateRecord(record.nombre, record.localidad, {
                                    dificultad: calcDificultad(record.distancia, record.desnivel),
                                  })
                                }
                                className="text-xs text-teal-500 hover:text-teal-400 dark:text-teal-400"
                              >
                                ↓ Usar sugerencia (
                                {
                                  DIFFICULTY_LABEL[
                                    calcDificultad(record.distancia, record.desnivel)!
                                  ]
                                }
                                )
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

                    <td className="hidden px-4 py-3 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
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
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={9}
                        className="border-b border-gray-100 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-800/50"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Mobile-only detail */}
                          <div className="sm:hidden">
                            {record.localidad && (
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                {record.localidad}
                              </p>
                            )}
                            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                              {record.alturaMaxima !== null && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {record.alturaMaxima.toLocaleString('es-AR')} msnm
                                  </span>
                                </span>
                              )}
                              {record.distancia !== null && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {record.distancia.toLocaleString('es-AR')} km
                                  </span>
                                </span>
                              )}
                              {record.desnivel !== null && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  ↑{' '}
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {record.desnivel.toLocaleString('es-AR')} m
                                  </span>
                                </span>
                              )}
                            </div>
                            <div className="mb-2">
                              <Stars
                                value={
                                  record.dificultad ??
                                  calcDificultad(record.distancia, record.desnivel)
                                }
                                suggested={record.dificultad === null}
                              />
                            </div>
                            {record.observacion && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {record.observacion}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {gpxId && (
                              <a
                                href={`/gpx/${gpxId}.gpx`}
                                download
                                className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                              >
                                ↓ Descargar GPX
                              </a>
                            )}
                            {record.url && (
                              <a
                                href={record.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                              >
                                Wikiloc ↗
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => shareRecord(record)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                            >
                              {copiedKey === rowKey ? '¡Copiado!' : 'Compartir ↗'}
                            </button>
                          </div>
                          {gpxId && gpxCache[rowKey] === undefined && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Cargando altimetría…
                            </p>
                          )}
                          {gpxCache[rowKey] && gpxCache[rowKey]!.length > 0 && (
                            <ElevationChart
                              data={gpxCache[rowKey]!}
                              color={routeColor(record.alturaMaxima)}
                            />
                          )}
                          {gpxCache[rowKey] !== undefined &&
                            (!gpxCache[rowKey] || gpxCache[rowKey]!.length === 0) && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Sin datos de altimetría disponibles
                              </p>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
