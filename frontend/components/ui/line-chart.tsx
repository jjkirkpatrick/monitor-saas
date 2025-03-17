"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface LineChartProps {
  data: any[]
  xKey: string
  yKey: string
  title?: string
  height?: number
  strokeColor?: string
}

export function LineChartComponent({
  data,
  xKey,
  yKey,
  title,
  height = 300,
  strokeColor = "hsl(var(--primary))"
}: LineChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <XAxis
            dataKey={xKey}
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
