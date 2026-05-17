import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrekkingRecord } from '@/data/recordsData'

// ── recharts any casts (v3 + @types/react 18 incompatibility) ────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyResponsiveContainer = ResponsiveContainer as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyAreaChart = AreaChart as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyArea = Area as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyXAxis = XAxis as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyYAxis = YAxis as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyCartesianGrid = CartesianGrid as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyTooltip = RechartsTooltip as any

// ── types ─────────────────────────────────────────────────────────────────────

// coordIdx maps each downsampled elevation point back to its original index in `coords`
type ElevationPoint = { d: number; ele: number; coordIdx: number }

type RouteEntry = {
  id: string
  record: TrekkingRecord
  coords: [number, number][]
  elevation: ElevationPoint[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const x = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function downsample(arr: ElevationPoint[], max: number): ElevationPoint[] {
  if (arr.length <= max) return arr
  const step = arr.length / max
  return Array.from({ length: max }, (_, i) => arr[Math.floor(i * step)])
}

function parseGpx(text: string): { coords: [number, number][]; elevation: ElevationPoint[] } {
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
  const fullElevation: ElevationPoint[] = pts.map(({ ele }, i) => {
    if (i > 0) cumDist += haversineKm(coords[i - 1], coords[i])
    return { d: Math.round(cumDist * 100) / 100, ele: Math.round(ele), coordIdx: i }
  })

  return { coords, elevation: downsample(fullElevation, 300) }
}

function extractId(url: string): string | null {
  return url?.match(/\/([^/]+)-\d+$/)?.[1] ?? null
}

function routeColor(alturaMaxima: number | null): string {
  const h = alturaMaxima ?? 0
  if (h >= 5000) return '#f97316'
  if (h >= 4000) return '#0d9488'
  if (h >= 3000) return '#22c55e'
  return '#14b8a6'
}

const LEGEND = [
  { color: '#14b8a6', label: '< 3000 m' },
  { color: '#22c55e', label: '3000 – 3999 m' },
  { color: '#0d9488', label: '4000 – 4999 m' },
  { color: '#f97316', label: '5000+ m' },
]

// ── Leaflet helpers ───────────────────────────────────────────────────────────

function BoundsFitter({ coords }: { coords: [number, number][][] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current || coords.length === 0) return
    const all = coords.flat()
    if (all.length < 2) return
    map.fitBounds(L.latLngBounds(all), { padding: [32, 32] })
    fitted.current = true
  }, [coords, map])

  return null
}

function MapClickHandler({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({ click: onDeselect })
  return null
}

// ── elevation panel ───────────────────────────────────────────────────────────

function ElevationPanel({
  route,
  onClose,
  onHover,
}: {
  route: RouteEntry
  onClose: () => void
  onHover: (idx: number | null) => void
}) {
  const { record, elevation, id } = route
  const hasElevation = elevation.length > 0 && elevation.some((p) => p.ele > 10)
  const color = routeColor(record.alturaMaxima)

  return (
    <div className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {record.nombre}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {record.localidad}
            {record.alturaMaxima && <> · {record.alturaMaxima.toLocaleString('es-AR')} msnm</>}
            {record.distancia && <> · {record.distancia.toLocaleString('es-AR')} km</>}
            {record.desnivel && <> · +{record.desnivel.toLocaleString('es-AR')} m desnivel</>}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={`/gpx/${id}.gpx`}
            download
            className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-700"
          >
            ↓ GPX
          </a>
          {record.url && (
            <a
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
            >
              Wikiloc ↗
            </a>
          )}
          <button
            onClick={onClose}
            className="ml-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Elevation profile */}
      {hasElevation && (
        <div className="px-4 pb-4">
          <AnyResponsiveContainer width="100%" height={150}>
            <AnyAreaChart
              data={elevation}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              onMouseMove={(state: { activeTooltipIndex?: number }) => {
                if (state?.activeTooltipIndex != null) onHover(state.activeTooltipIndex)
              }}
              onMouseLeave={() => onHover(null)}
            >
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <AnyCartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
              <AnyXAxis
                dataKey="d"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `${v} km`}
                interval="preserveStartEnd"
              />
              <AnyYAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `${v}m`}
                width={52}
                domain={['auto', 'auto']}
              />
              <AnyTooltip
                formatter={(v: number) => [`${v.toLocaleString('es-AR')} m`, 'Elevación']}
                labelFormatter={(l: number) => `${l} km`}
                contentStyle={{ fontSize: 11 }}
              />
              <AnyArea
                type="monotone"
                dataKey="ele"
                stroke={color}
                strokeWidth={1.5}
                fill="url(#elevGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AnyAreaChart>
          </AnyResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function TrekkingMap({
  data,
  selectedTrekName,
}: {
  data: TrekkingRecord[]
  selectedTrekName?: string | null
}) {
  const [routes, setRoutes] = useState<RouteEntry[]>([])
  const [loaded, setLoaded] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const recordsWithUrl = useMemo(() => data.filter((r) => r.url?.includes('wikiloc')), [data])
  const total = recordsWithUrl.length

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    setRoutes([])
    setLoaded(0)
    setSelectedId(null)
    setHoverIdx(null)

    recordsWithUrl.forEach(async (record) => {
      const id = record.gpx ?? extractId(record.url!)
      if (!id) {
        if (!cancelled) setLoaded((n) => n + 1)
        return
      }
      try {
        const res = await fetch(`/gpx/${id}.gpx`, { signal: controller.signal })
        if (res.ok && !cancelled) {
          const text = await res.text()
          const { coords, elevation } = parseGpx(text)
          if (coords.length >= 2) {
            setRoutes((prev) => [...prev, { id, record, coords, elevation }])
          }
        }
      } catch {
        // AbortError or file not yet downloaded, skip silently
      } finally {
        if (!cancelled) setLoaded((n) => n + 1)
      }
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [recordsWithUrl])

  const allCoords = useMemo(() => routes.map((r) => r.coords), [routes])
  const isDone = loaded >= total && total > 0

  // Auto-select the highest route once loading finishes (only if nothing is pre-selected)
  useEffect(() => {
    if (!isDone || selectedId !== null || routes.length === 0 || selectedTrekName) return
    const highest = routes.reduce((best, r) =>
      (r.record.alturaMaxima ?? 0) > (best.record.alturaMaxima ?? 0) ? r : best
    )
    setSelectedId(highest.id)
  }, [isDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selection from the table
  useEffect(() => {
    if (!selectedTrekName) return
    const match = routes.find((r) => r.record.nombre === selectedTrekName)
    if (match) {
      setSelectedId(match.id)
      setHoverIdx(null)
    }
  }, [selectedTrekName, routes])
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedId) ?? null,
    [routes, selectedId]
  )
  const hasSelection = selectedId !== null

  const hoverCoord = useMemo((): [number, number] | null => {
    if (!selectedRoute || hoverIdx === null) return null
    const ep = selectedRoute.elevation[hoverIdx]
    if (!ep) return null
    return selectedRoute.coords[ep.coordIdx] ?? null
  }, [selectedRoute, hoverIdx])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="relative">
        <MapContainer center={[-24.786, -65.412]} zoom={6} style={{ height: 500 }} className="z-0">
          <LayersControl position="topright">
            <LayersControl.BaseLayer name="Estándar">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Topográfico">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                maxZoom={17}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="Satélite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="© Esri, Maxar, Earthstar Geographics"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <BoundsFitter coords={allCoords} />
          <MapClickHandler
            onDeselect={() => {
              setSelectedId(null)
              setHoverIdx(null)
            }}
          />
          {routes.map(({ id, record, coords }) => {
            const isSelected = id === selectedId
            const color = routeColor(record.alturaMaxima)
            const opacity = hasSelection ? (isSelected ? 1 : 0.2) : 0.75
            const weight = isSelected ? 4 : 2.5

            return (
              <Fragment key={id}>
                {isSelected && (
                  <Polyline
                    positions={coords}
                    pathOptions={{ color: 'white', weight: 9, opacity: 0.55 }}
                  />
                )}
                <Polyline
                  positions={coords}
                  pathOptions={{ color, weight, opacity }}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e)
                      setSelectedId(id)
                      setHoverIdx(null)
                    },
                  }}
                />
                <CircleMarker
                  center={coords[0]}
                  radius={isSelected ? 8 : 6}
                  pathOptions={{
                    fillColor: isSelected ? 'white' : '#ef4444',
                    color: isSelected ? color : 'white',
                    weight: 2,
                    fillOpacity: 1,
                    opacity: hasSelection ? (isSelected ? 1 : 0.3) : 1,
                  }}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e)
                      setSelectedId(id)
                      setHoverIdx(null)
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
                    <span style={{ fontSize: 12 }}>{record.nombre}</span>
                  </Tooltip>
                </CircleMarker>
              </Fragment>
            )
          })}

          {hoverCoord && selectedRoute && (
            <CircleMarker
              center={hoverCoord}
              radius={7}
              pathOptions={{
                fillColor: 'white',
                color: routeColor(selectedRoute.record.alturaMaxima),
                weight: 2.5,
                fillOpacity: 1,
              }}
            />
          )}
        </MapContainer>

        <div className="pointer-events-none absolute bottom-8 left-3 z-[1000] flex flex-col gap-1 rounded-lg bg-white/90 px-3 py-2 text-xs shadow dark:bg-gray-800/90 dark:text-gray-300">
          {LEGEND.map(({ color, label }) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className="relative inline-flex items-center">
                <span className="inline-block h-0.5 w-5 rounded" style={{ background: color }} />
                <span
                  className="absolute left-1/2 inline-block h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white"
                  style={{ background: color }}
                />
              </span>
              {label}
            </span>
          ))}
        </div>

        {!isDone && (
          <div className="absolute bottom-8 right-3 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow dark:bg-gray-800/90 dark:text-gray-400">
            {routes.length} / {total} rutas
          </div>
        )}

        {isDone && routes.length === 0 && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay archivos GPX en{' '}
              <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">public/gpx/</code>
            </p>
          </div>
        )}
      </div>

      {selectedRoute && (
        <ElevationPanel
          route={selectedRoute}
          onClose={() => {
            setSelectedId(null)
            setHoverIdx(null)
          }}
          onHover={setHoverIdx}
        />
      )}
    </div>
  )
}
