import dynamic from 'next/dynamic'
import siteMetadata from '@/data/siteMetadata'
import { recordsData } from '@/data/recordsData'
import { PageSEO } from '@/components/SEO'
import RecordsTable from '@/components/RecordsTable'

const RecordsCharts = dynamic(() => import('@/components/RecordsCharts'), { ssr: false })

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

const alturaAcumulada = recordsData.reduce(
  (sum, r) => sum + (r.alturaMaxima ?? 0) * r.cantidad,
  0
)

// ── Component ───────────────────────────────────────────────────────────────

export default function Registro() {
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
              value={`${(alturaAcumulada / 1000).toLocaleString('es-AR', { maximumFractionDigits: 0 })} km`}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="py-8">
          <RecordsCharts data={recordsData} />
        </div>

        {/* Table */}
        <div className="py-8">
          <RecordsTable data={recordsData} />
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-teal-600 dark:text-teal-400">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}
