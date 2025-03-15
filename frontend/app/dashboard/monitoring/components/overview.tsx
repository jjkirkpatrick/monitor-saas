"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data - in a real app, this would come from an API
const data = [
  { date: "Jan 1", responseTime: 120, uptime: 100 },
  { date: "Jan 2", responseTime: 150, uptime: 100 },
  { date: "Jan 3", responseTime: 180, uptime: 99.8 },
  { date: "Jan 4", responseTime: 110, uptime: 100 },
  { date: "Jan 5", responseTime: 125, uptime: 100 },
  { date: "Jan 6", responseTime: 135, uptime: 100 },
  { date: "Jan 7", responseTime: 145, uptime: 99.9 },
  { date: "Jan 8", responseTime: 120, uptime: 100 },
  { date: "Jan 9", responseTime: 130, uptime: 100 },
  { date: "Jan 10", responseTime: 140, uptime: 100 },
  { date: "Jan 11", responseTime: 160, uptime: 99.7 },
  { date: "Jan 12", responseTime: 170, uptime: 99.9 },
  { date: "Jan 13", responseTime: 180, uptime: 100 },
  { date: "Jan 14", responseTime: 165, uptime: 100 },
]

const chartConfig = {
  responseTime: {
    label: "Response Time (ms)",
    color: "hsl(var(--chart-1))",
  },
}

export function Overview() {
  return (
    <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 0,
          }}
          accessibilityLayer
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={10}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}ms`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="var(--color-responseTime)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, style: { fill: "var(--color-responseTime)" } }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
