"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface BarChartProps {
  data: any[]
  xKey: string
  yKey: string
  title?: string
  height?: number
  color?: string
}

export function BarChartComponent({
  data,
  xKey,
  yKey,
  title,
  height = 300,
  color = "hsl(var(--primary))"
}: BarChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
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
            tickFormatter={(value: number) => `${value}`}
          />
          <Tooltip />
          <Bar
            dataKey={yKey}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
