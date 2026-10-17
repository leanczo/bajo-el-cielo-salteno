import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyResponsiveContainer = ResponsiveContainer as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPieChart = PieChart as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPie = Pie as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyTooltip = RechartsTooltip as any

const DATA = [
  { name: 'Alojamiento', value: 1273487, color: '#14b8a6' },
  { name: 'Vuelos', value: 1243196, color: '#3b82f6' },
  { name: 'Excursiones', value: 950000, color: '#f97316' },
  { name: 'Transporte', value: 369600, color: '#a855f7' },
  { name: 'Comidas', value: 342738, color: '#22c55e' },
  { name: 'Supermercado', value: 211022, color: '#eab308' },
  { name: 'Regalos', value: 46500, color: '#ec4899' },
]

const TOTAL = DATA.reduce((s, d) => s + d.value, 0)

function formatARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export default function ChaltenExpensesChart() {
  const isMobile = useIsMobile()
  const [active, setActive] = useState<string | null>(null)

  const CustomTooltip = ({
    active: isActive,
    payload,
  }: {
    active?: boolean
    payload?: { name: string; value: number }[]
  }) => {
    if (isActive && payload && payload.length) {
      const pct = ((payload[0].value / TOTAL) * 100).toFixed(1)
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-gray-100">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{formatARS(payload[0].value)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{pct}% del total</p>
        </div>
      )
    }
    return null
  }

  const outerR = isMobile ? 90 : 120
  const innerR = isMobile ? 50 : 68

  return (
    <div className="my-6">
      <AnyResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
        <AnyPieChart>
          <AnyPie
            data={DATA}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={outerR}
            innerRadius={innerR}
            paddingAngle={2}
            cursor="pointer"
            onClick={({ name }: { name: string }) =>
              setActive((prev) => (prev === name ? null : name))
            }
          >
            {DATA.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.color}
                opacity={active && active !== entry.name ? 0.3 : 1}
              />
            ))}
          </AnyPie>
          <AnyTooltip content={<CustomTooltip />} />
        </AnyPieChart>
      </AnyResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {DATA.map((d) => {
          const pct = ((d.value / TOTAL) * 100).toFixed(1)
          return (
            <button
              key={d.name}
              onClick={() => setActive((prev) => (prev === d.name ? null : d.name))}
              className={`inline-flex items-center gap-1 text-xs transition-opacity ${
                active && active !== d.name ? 'opacity-30' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              <span>{d.name}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{pct}%</span>
            </button>
          )
        })}
      </div>

      {/* Detail card on click */}
      {active && (() => {
        const d = DATA.find((x) => x.name === active)!
        const pct = ((d.value / TOTAL) * 100).toFixed(1)
        return (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: d.color }} />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{d.name}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {formatARS(d.value)} <span className="text-gray-400">· {pct}% del total</span>
            </p>
          </div>
        )
      })()}

      <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Total del viaje: {formatARS(TOTAL)} · 10 días · 2 personas
      </p>
    </div>
  )
}
