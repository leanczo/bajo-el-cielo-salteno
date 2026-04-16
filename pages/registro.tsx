import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import siteMetadata from '@/data/siteMetadata'
import { recordsData, pendingData, PendingRecord } from '@/data/recordsData'
import { PageSEO } from '@/components/SEO'
import RecordsTable from '@/components/RecordsTable'

const RecordsCharts = dynamic(() => import('@/components/RecordsCharts'), { ssr: false })
const TrekkingMap = dynamic(() => import('@/components/TrekkingMap'), { ssr: false })

// ── Computed stats ──────────────────────────────────────────────────────────

const totalTrekkings = recordsData.length

const highest = recordsData.reduce((best, r) =>
  (r.alturaMaxima ?? 0) > (best.alturaMaxima ?? 0) ? r : best
)

const localidadCount: Record<string, number> = {}
for (const r of recordsData) {
  localidadCount[r.localidad] = (localidadCount[r.localidad] ?? 0) + 1
}
const topLocalidad = Object.entries(localidadCount).sort((a, b) => b[1] - a[1])[0]

const totalSalidas = recordsData.reduce((sum, r) => sum + r.cantidad, 0)

const cumbresCincoMil = recordsData.filter((r) => (r.alturaMaxima ?? 0) >= 5000).length

const alturaAcumulada = recordsData.reduce((sum, r) => sum + (r.alturaMaxima ?? 0) * r.cantidad, 0)

// ── Difficulty helpers ──────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Fácil',
  2: 'Moderado',
  3: 'Difícil',
  4: 'Muy difícil',
  5: 'Extremo',
}

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-300 dark:text-gray-700">—</span>
  return (
    <span title={value ? DIFFICULTY_LABEL[value] : undefined}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < (value ?? 0) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'}
        >
          ★
        </span>
      ))}
    </span>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

const EDIT_SECRET = 'salteno'

export default function Registro() {
  const router = useRouter()
  const isEditMode = router.query.edit === EDIT_SECRET

  return (
    <>
      <PageSEO
        title={`Registro Personal – ${siteMetadata.author}`}
        description="Mi historial personal de trekkings: altura, localidad y observaciones de cada salida."
      />

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* Header */}
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Registro Personal
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Todas mis salidas: cerros, cascadas, glaciares y más.
          </p>
        </div>

        {/* Stats */}
        <div className="py-8">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            <StatCard label="Trekkings distintos" value={totalTrekkings.toString()} />
            <StatCard label="Salidas totales" value={totalSalidas.toString()} />
            <StatCard
              label="Cima más alta"
              value={`${highest.alturaMaxima?.toLocaleString('es-AR')} m`}
              sub={highest.nombre}
            />
            <StatCard
              label="Zona más visitada"
              value={topLocalidad[0]}
              sub={`${topLocalidad[1]} trekkings`}
            />
            <StatCard label="Cumbres 5000+" value={cumbresCincoMil.toString()} />
            <StatCard
              label="Altura acumulada"
              value={`${(alturaAcumulada / 1000).toLocaleString('es-AR', {
                maximumFractionDigits: 0,
              })} km`}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="py-8">
          <RecordsCharts data={recordsData} />
        </div>

        {/* Map */}
        <div className="py-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Mapa de rutas</h2>
          <TrekkingMap data={recordsData} />
        </div>

        {/* Table */}
        <div className="py-8">
          {isEditMode && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              <span>✏️</span>
              <span>Modo edición activo — los cambios se guardan automáticamente en el JSON.</span>
            </div>
          )}
          <RecordsTable data={recordsData} isEditMode={isEditMode} />
        </div>

        {/* Pending */}
        <div className="py-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Pendientes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingData.map((p) => (
              <PendingCard key={p.nombre} trek={p} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-teal-600 dark:text-teal-400 sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}

function PendingCard({ trek }: { trek: PendingRecord }) {
  const diffLabel = trek.dificultad ? DIFFICULTY_LABEL[trek.dificultad] : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{trek.nombre}</h3>
        {trek.url && (
          <a
            href={trek.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs text-teal-600 hover:underline dark:text-teal-400"
          >
            Ver ruta ↗
          </a>
        )}
      </div>

      {trek.localidad && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{trek.localidad}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {trek.distancia !== null && (
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {trek.distancia.toLocaleString('es-AR')} km
            </span>
          </span>
        )}
        {trek.desnivel !== null && (
          <span className="text-gray-600 dark:text-gray-400">
            ↑{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {trek.desnivel.toLocaleString('es-AR')} m
            </span>
          </span>
        )}
        {trek.alturaMaxima !== null && (
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {trek.alturaMaxima.toLocaleString('es-AR')} msnm
            </span>
          </span>
        )}
      </div>

      {trek.dificultad !== null && (
        <div className="mt-3 flex items-center gap-2">
          <Stars value={trek.dificultad} />
          {diffLabel && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{diffLabel}</span>
          )}
        </div>
      )}

      {trek.observacion && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{trek.observacion}</p>
      )}
    </div>
  )
}
