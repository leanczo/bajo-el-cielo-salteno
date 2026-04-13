import { TrekkingRecord } from '@/data/recordsData'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
} from 'recharts'

// ── helpers ────────────────────────────────────────────────────────────────

const TEAL = '#14b8a6'
const TEAL_DARK = '#0d9488'
const BLUE = '#3b82f6'
const ORANGE = '#f97316'
const PURPLE = '#a855f7'

// recharts v3 + @types/react 18 type incompatibility workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyResponsiveContainer = ResponsiveContainer as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyBarChart = BarChart as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyTooltip = RechartsTooltip as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyBar = Bar as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPieChart = PieChart as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPie = Pie as any

// ── Top-10 by altitude ──────────────────────────────────────────────────────

function TopAltitudeChart({ data }: { data: TrekkingRecord[] }) {
  function getBarColor(altura: number | null | undefined) {
    if ((altura ?? 0) >= 5000) return ORANGE
    if ((altura ?? 0) >= 4000) return TEAL_DARK
    return TEAL
  }
  const top10 = [...data]
    .filter((r) => r.alturaMaxima !== null)
    .sort((a, b) => (b.alturaMaxima ?? 0) - (a.alturaMaxima ?? 0))
    .slice(0, 10)
    .reverse()

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: { payload: TrekkingRecord }[]
  }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-gray-100">{d.nombre}</p>
          <p className="text-sm text-teal-600 dark:text-teal-400">
            {d.alturaMaxima?.toLocaleString('es-AR')} msnm
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{d.localidad}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        Top 10 por altura máxima
      </h3>
      <AnyResponsiveContainer width="100%" height={360}>
        <AnyBarChart
          data={top10}
          layout="vertical"
          margin={{ left: 8, right: 60, top: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            domain={[0, 7000]}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="nombre"
            type="category"
            width={160}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <AnyTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.08)' }} />
          <AnyBar dataKey="alturaMaxima" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {top10.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.alturaMaxima)} />
            ))}
            <LabelList
              dataKey="alturaMaxima"
              position="right"
              formatter={(v: number) => `${v.toLocaleString('es-AR')} m`}
              style={{ fontSize: 11, fill: '#6b7280' }}
            />
          </AnyBar>
        </AnyBarChart>
      </AnyResponsiveContainer>
      <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded" style={{ background: TEAL }} />
          hasta 3999 msnm
        </span>
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded" style={{ background: TEAL_DARK }} />
          4000 – 4999 msnm
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded" style={{ background: ORANGE }} />
          5000+ msnm
        </span>
      </p>
    </div>
  )
}

// ── Treks by locality ───────────────────────────────────────────────────────

function LocalityChart({ data }: { data: TrekkingRecord[] }) {
  const counts: Record<string, number> = {}
  for (const r of data) {
    counts[r.localidad] = (counts[r.localidad] ?? 0) + 1
  }

  const chartData = Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([localidad, cantidad]) => ({ localidad, cantidad }))

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: { payload: { localidad: string }; value: number }[]
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {payload[0].payload.localidad}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {payload[0].value} trekking{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        Trekkings por localidad
      </h3>
      <AnyResponsiveContainer width="100%" height={360}>
        <AnyBarChart data={chartData} margin={{ left: 0, right: 16, top: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="localidad"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <AnyTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
          <AnyBar dataKey="cantidad" fill={BLUE} radius={[6, 6, 0, 0]} maxBarSize={40}>
            <LabelList
              dataKey="cantidad"
              position="top"
              style={{ fontSize: 11, fill: '#6b7280' }}
            />
          </AnyBar>
        </AnyBarChart>
      </AnyResponsiveContainer>
      <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
        Solo localidades con 2 o más trekkings
      </p>
    </div>
  )
}

// ── Altitude distribution pie ───────────────────────────────────────────────

const RANGE_COLORS = [TEAL, TEAL_DARK, ORANGE, PURPLE]

function AltitudeRangeChart({ data }: { data: TrekkingRecord[] }) {
  const ranges = [
    { label: 'hasta 2000 m', min: 0, max: 1999 },
    { label: '2000 – 3999 m', min: 2000, max: 3999 },
    { label: '4000 – 4999 m', min: 4000, max: 4999 },
    { label: '5000+ m', min: 5000, max: Infinity },
  ]

  const chartData = ranges.map((r, i) => ({
    name: r.label,
    value: data.filter((d) => (d.alturaMaxima ?? 0) >= r.min && (d.alturaMaxima ?? 0) <= r.max)
      .length,
    color: RANGE_COLORS[i],
  }))

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: { name: string; value: number }[]
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-gray-100">{payload[0].name}</p>
          <p className="text-sm text-teal-600 dark:text-teal-400">
            {payload[0].value} trekking{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        Distribución por altura
      </h3>
      <AnyResponsiveContainer width="100%" height={280}>
        <AnyPieChart>
          <AnyPie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={55}
            paddingAngle={3}
            label={({ value }: { value: number }) => `${value}`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </AnyPie>
          <AnyTooltip content={<CustomTooltip />} />
        </AnyPieChart>
      </AnyResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {chartData.map((r) => (
          <span
            key={r.name}
            className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"
          >
            <span className="inline-block h-2 w-4 rounded" style={{ background: r.color }} />
            {r.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Most repeated treks ─────────────────────────────────────────────────────

function MostRepeatedChart({ data }: { data: TrekkingRecord[] }) {
  const top5 = [...data].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5)

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: { payload: TrekkingRecord }[]
  }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-gray-100">{d.nombre}</p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            {d.cantidad} salida{d.cantidad !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{d.localidad}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Más repetidos</h3>
      <AnyResponsiveContainer width="100%" height={280}>
        <AnyBarChart
          data={top5}
          layout="vertical"
          margin={{ left: 8, right: 40, top: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="nombre"
            type="category"
            width={160}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <AnyTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,85,247,0.08)' }} />
          <AnyBar dataKey="cantidad" fill={PURPLE} radius={[0, 6, 6, 0]} maxBarSize={28}>
            <LabelList
              dataKey="cantidad"
              position="right"
              style={{ fontSize: 11, fill: '#6b7280' }}
            />
          </AnyBar>
        </AnyBarChart>
      </AnyResponsiveContainer>
    </div>
  )
}

// ── Public export ───────────────────────────────────────────────────────────

export default function RecordsCharts({ data }: { data: TrekkingRecord[] }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <TopAltitudeChart data={data} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <LocalityChart data={data} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <AltitudeRangeChart data={data} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <MostRepeatedChart data={data} />
        </div>
      </div>
    </div>
  )
}
