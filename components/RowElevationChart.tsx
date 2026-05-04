'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

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
const AnyTooltip = Tooltip as any

export type ElevPoint = { d: number; ele: number }

export default function RowElevationChart({ data, color }: { data: ElevPoint[]; color: string }) {
  const hasData = data.length > 0 && data.some((p) => p.ele > 10)
  if (!hasData) return null

  const gradId = `rowElev-${color.replace('#', '')}`

  return (
    <AnyResponsiveContainer width="100%" height={140}>
      <AnyAreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
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
          width={50}
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
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AnyAreaChart>
    </AnyResponsiveContainer>
  )
}
