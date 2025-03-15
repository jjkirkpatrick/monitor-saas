"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample data - in a real app, this would come from an API
const responseTimeData = [
  { date: "Jan 1", value: 120 },
  { date: "Jan 2", value: 150 },
  { date: "Jan 3", value: 180 },
  { date: "Jan 4", value: 110 },
  { date: "Jan 5", value: 125 },
  { date: "Jan 6", value: 135 },
  { date: "Jan 7", value: 145 },
  { date: "Jan 8", value: 120 },
  { date: "Jan 9", value: 130 },
  { date: "Jan 10", value: 140 },
  { date: "Jan 11", value: 160 },
  { date: "Jan 12", value: 170 },
  { date: "Jan 13", value: 180 },
  { date: "Jan 14", value: 165 },
  { date: "Jan 15", value: 155 },
  { date: "Jan 16", value: 145 },
  { date: "Jan 17", value: 140 },
  { date: "Jan 18", value: 130 },
  { date: "Jan 19", value: 135 },
  { date: "Jan 20", value: 140 },
  { date: "Jan 21", value: 145 },
  { date: "Jan 22", value: 150 },
  { date: "Jan 23", value: 155 },
  { date: "Jan 24", value: 160 },
  { date: "Jan 25", value: 170 },
  { date: "Jan 26", value: 180 },
  { date: "Jan 27", value: 175 },
  { date: "Jan 28", value: 165 },
  { date: "Jan 29", value: 155 },
  { date: "Jan 30", value: 145 },
]

const uptimeData = [
  { date: "Jan 1", value: 100 },
  { date: "Jan 2", value: 100 },
  { date: "Jan 3", value: 99.8 },
  { date: "Jan 4", value: 100 },
  { date: "Jan 5", value: 100 },
  { date: "Jan 6", value: 100 },
  { date: "Jan 7", value: 99.9 },
  { date: "Jan 8", value: 100 },
  { date: "Jan 9", value: 100 },
  { date: "Jan 10", value: 100 },
  { date: "Jan 11", value: 99.7 },
  { date: "Jan 12", value: 99.9 },
  { date: "Jan 13", value: 100 },
  { date: "Jan 14", value: 100 },
  { date: "Jan 15", value: 100 },
  { date: "Jan 16", value: 100 },
  { date: "Jan 17", value: 100 },
  { date: "Jan 18", value: 99.9 },
  { date: "Jan 19", value: 100 },
  { date: "Jan 20", value: 100 },
  { date: "Jan 21", value: 100 },
  { date: "Jan 22", value: 100 },
  { date: "Jan 23", value: 100 },
  { date: "Jan 24", value: 99.8 },
  { date: "Jan 25", value: 100 },
  { date: "Jan 26", value: 100 },
  { date: "Jan 27", value: 100 },
  { date: "Jan 28", value: 100 },
  { date: "Jan 29", value: 100 },
  { date: "Jan 30", value: 100 },
]

const statusCodeData = [
  { date: "Jan 1", "200": 144, "404": 0, "500": 0 },
  { date: "Jan 2", "200": 143, "404": 1, "500": 0 },
  { date: "Jan 3", "200": 142, "404": 0, "500": 2 },
  { date: "Jan 4", "200": 144, "404": 0, "500": 0 },
  { date: "Jan 5", "200": 144, "404": 0, "500": 0 },
  { date: "Jan 6", "200": 144, "404": 0, "500": 0 },
  { date: "Jan 7", "200": 143, "404": 0, "500": 1 },
]

const responseTimeChartConfig = {
  value: {
    label: "Response Time (ms)",
    color: "hsl(var(--chart-1))",
  },
}

const uptimeChartConfig = {
  value: {
    label: "Uptime (%)",
    color: "hsl(var(--chart-2))",
  },
}

const statusCodeChartConfig = {
  "200": {
    label: "200 OK",
    color: "hsl(var(--chart-1))",
  },
  "404": {
    label: "404 Not Found",
    color: "hsl(var(--chart-2))",
  },
  "500": {
    label: "500 Server Error",
    color: "hsl(var(--chart-3))",
  },
}

interface MonitorMetricsProps {
  monitorId: string
}

export function MonitorMetrics({ monitorId }: MonitorMetricsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="response-time">
        <TabsList>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="uptime">Uptime</TabsTrigger>
          <TabsTrigger value="status-codes">Status Codes</TabsTrigger>
        </TabsList>
        <TabsContent value="response-time">
          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>
                Average response time over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={responseTimeChartConfig} className="aspect-[4/1] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={responseTimeData}
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
                      dataKey="value"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, style: { fill: "var(--color-value)" } }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="uptime">
          <Card>
            <CardHeader>
              <CardTitle>Uptime</CardTitle>
              <CardDescription>
                Uptime percentage over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={uptimeChartConfig} className="aspect-[4/1] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={uptimeData}
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
                      domain={[99, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      fill="var(--color-value)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="status-codes">
          <Card>
            <CardHeader>
              <CardTitle>Status Codes</CardTitle>
              <CardDescription>
                Distribution of status codes over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusCodeChartConfig} className="aspect-[4/1] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusCodeData}
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
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="200" fill="var(--color-200)" radius={4} />
                    <Bar dataKey="404" fill="var(--color-404)" radius={4} />
                    <Bar dataKey="500" fill="var(--color-500)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
