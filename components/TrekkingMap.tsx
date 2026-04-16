import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polyline,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { TrekkingRecord } from '@/data/recordsData'

// ── helpers ──────────────────────────────────────────────────────────────────

function parseGpx(text: string): [number, number][] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  return Array.from(doc.querySelectorAll('trkpt'))
    .map((pt): [number, number] => [
      parseFloat(pt.getAttribute('lat') ?? '0'),
      parseFloat(pt.getAttribute('lon') ?? '0'),
    ])
    .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0)
}

// Wikiloc downloads files as "{slug}.gpx", e.g. "tour-7-lagunas-de-ausangate.gpx"
// The slug is the URL path segment with the trailing numeric ID removed.
// e.g. ".../tour-7-lagunas-de-ausangate-116365808" → "tour-7-lagunas-de-ausangate"
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

// ── fit map bounds once all routes finish loading ────────────────────────────

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

// ── route entries ─────────────────────────────────────────────────────────────

type RouteEntry = { id: string; record: TrekkingRecord; coords: [number, number][] }

// ── main component ────────────────────────────────────────────────────────────

export default function TrekkingMap({ data }: { data: TrekkingRecord[] }) {
  const [routes, setRoutes] = useState<RouteEntry[]>([])
  const [loaded, setLoaded] = useState(0)

  const recordsWithUrl = useMemo(() => data.filter((r) => r.url?.includes('wikiloc')), [data])
  const total = recordsWithUrl.length

  useEffect(() => {
    setRoutes([])
    setLoaded(0)

    recordsWithUrl.forEach(async (record) => {
      const id = record.gpx ?? extractId(record.url!)
      if (!id) {
        setLoaded((n) => n + 1)
        return
      }
      try {
        const res = await fetch(`/gpx/${id}.gpx`)
        if (res.ok) {
          const text = await res.text()
          const coords = parseGpx(text)
          if (coords.length >= 2) {
            setRoutes((prev) => [...prev, { id, record, coords }])
          }
        }
      } catch {
        // file not yet downloaded, skip silently
      } finally {
        setLoaded((n) => n + 1)
      }
    })
  }, [recordsWithUrl])

  const allCoords = useMemo(() => routes.map((r) => r.coords), [routes])
  const isDone = loaded >= total && total > 0

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={[-24.7, -65.4]}
        zoom={7}
        style={{ height: 500 }}
        className="z-0"
      >
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
        {routes.map(({ id, record, coords }) => {
          const color = routeColor(record.alturaMaxima)
          const popup = (
            <Popup>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <strong>{record.nombre}</strong>
                <br />
                <span style={{ color: '#6b7280' }}>{record.localidad}</span>
                {record.alturaMaxima && (
                  <>
                    <br />
                    {record.alturaMaxima.toLocaleString('es-AR')} msnm
                  </>
                )}
                {record.distancia && <>{' · '}{record.distancia.toLocaleString('es-AR')} km</>}
                <br />
                <a href={record.url ?? ''} target="_blank" rel="noopener noreferrer" style={{ color: '#0d9488' }}>
                  Ver en Wikiloc ↗
                </a>
              </div>
            </Popup>
          )
          return (
            <Fragment key={id}>
              {/* Route polyline */}
              <Polyline
                positions={coords}
                pathOptions={{ color, weight: 2.5, opacity: 0.75 }}
              />
              {/* Pin visible from far away */}
              <CircleMarker
                center={coords[0]}
                radius={7}
                pathOptions={{ fillColor: '#ef4444', color: 'white', weight: 2, fillOpacity: 1 }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
                  <span style={{ fontSize: 12 }}>{record.nombre}</span>
                </Tooltip>
                {popup}
              </CircleMarker>
            </Fragment>
          )
        })}
      </MapContainer>

      {/* Legend */}
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

      {/* Loading indicator */}
      {!isDone && (
        <div className="absolute bottom-8 right-3 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow dark:bg-gray-800/90 dark:text-gray-400">
          {routes.length} / {total} rutas
        </div>
      )}

      {/* Empty state */}
      {isDone && routes.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay archivos GPX en{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">public/gpx/</code>
          </p>
        </div>
      )}
    </div>
  )
}
