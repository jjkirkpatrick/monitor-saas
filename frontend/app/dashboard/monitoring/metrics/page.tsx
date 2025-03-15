"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Sample data - in a real app, this would come from an API
const responseTimeData = [
  { date: "Jan 1", "API Server": 120, "Database": 80, "Frontend": 150, "Auth Service": 100, "CDN": 60 },
  { date: "Jan 2", "API Server": 150, "Database": 90, "Frontend": 160, "Auth Service": 110, "CDN": 65 },
  { date: "Jan 3", "API Server": 180, "Database": 100, "Frontend": 170, "Auth Service": 120, "CDN": 70 },
  { date: "Jan 4", "API Server": 110, "Database": 70, "Frontend": 140, "Auth Service": 90, "CDN": 55 },
  { date: "Jan 5", "API Server": 125, "Database": 85, "Frontend": 155, "Auth Service": 105, "CDN": 62 },
  { date: "Jan 6", "API Server": 135, "Database": 95, "Frontend": 165, "Auth Service": 115, "CDN": 68 },
  { date: "Jan 7", "API Server": 145, "Database": 105, "Frontend": 175, "Auth Service": 125, "CDN": 72 },
  { date: "Jan 8", "API Server": 120, "Database": 80, "Frontend": 150, "Auth Service": 100, "CDN": 60 },
  { date: "Jan 9", "API Server": 130, "Database": 90, "Frontend": 160, "Auth Service": 110, "CDN": 65 },
  { date: "Jan 10", "API Server": 140, "Database": 100, "Frontend": 170, "Auth Service": 120, "CDN": 70 },
  { date: "Jan 11", "API Server": 160, "Database": 110, "Frontend": 180, "Auth Service": 130, "CDN": 75 },
  { date: "Jan 12", "API Server": 170, "Database": 120, "Frontend": 190, "Auth Service": 140, "CDN": 80 },
  { date: "Jan 13", "API Server": 180, "Database": 130, "Frontend": 200, "Auth Service": 150, "CDN": 85 },
  { date: "Jan 14", "API Server": 165, "Database": 115, "Frontend": 185, "Auth Service": 135, "CDN": 78 },
]

const uptimeData = [
  { date: "Jan 1", "API Server": 100, "Database": 99.5, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 2", "API Server": 100, "Database": 99.8, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 3", "API Server": 99.8, "Database": 98.5, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 4", "API Server": 100, "Database": 99.9, "Frontend": 100, "Auth Service": 99.9, "CDN": 100 },
  { date: "Jan 5", "API Server": 100, "Database": 100, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 6", "API Server": 100, "Database": 100, "Frontend": 99.8, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 7", "API Server": 99.9, "Database": 99.7, "Frontend": 100, "Auth Service": 100, "CDN": 99.9 },
  { date: "Jan 8", "API Server": 100, "Database": 100, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 9", "API Server": 100, "Database": 100, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 10", "API Server": 100, "Database": 100, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 11", "API Server": 99.7, "Database": 99.5, "Frontend": 100, "Auth Service": 99.8, "CDN": 100 },
  { date: "Jan 12", "API Server": 99.9, "Database": 99.9, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 13", "API Server": 100, "Database": 100, "Frontend": 100, "Auth Service": 100, "CDN": 100 },
  { date: "Jan 14", "API Server": 100, "Database": 100, "Frontend": 99.9, "Auth Service": 100, "CDN": 100 },
]

const outageData = [
  { name: "API Server", value: 3 },
  { name: "Database", value: 8 },
  { name: "Frontend", value: 2 },
  { name: "Auth Service", value: 2 },
  { name: "CDN", value: 1 },
]

const chartConfig = {
  "API Server": {
    label: "API Server",
    color: "hsl(var(--chart-1))",
  },
  "Database": {
    label: "Database",
    color: "hsl(var(--chart-2))",
  },
  "Frontend": {
    label: "Frontend",
    color: "hsl(var(--chart-3))",
  },
  "Auth Service": {
    label: "Auth Service",
    color: "hsl(var(--chart-4))",
  },
  "CDN": {
    label: "CDN",
    color: "hsl(var(--chart-5))",
  },
}

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/monitoring">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
          <p className="text-muted-foreground">
            Performance metrics for all your monitors
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid gap-1">
            <Label htmlFor="date-range">Date Range</Label>
            <Select defaultValue="14d">
              <SelectTrigger id="date-range" className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="monitor">Monitor</Label>
            <Select defaultValue="all">
              <SelectTrigger id="monitor" className="w-[180px]">
                <SelectValue placeholder="Select monitor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Monitors</SelectItem>
                <SelectItem value="api">API Server</SelectItem>
                <SelectItem value="db">Database</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="auth">Auth Service</SelectItem>
                <SelectItem value="cdn">CDN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline">Export Data</Button>
      </div>

      <Tabs defaultValue="response-time">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="uptime">Uptime</TabsTrigger>
          <TabsTrigger value="outages">Outages</TabsTrigger>
        </TabsList>
        <TabsContent value="response-time" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>
                Average response time across all monitors over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
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
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="API Server"
                      stroke="var(--color-API Server)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, style: { fill: "var(--color-API Server)" } }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Database"
                      stroke="var(--color-Database)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, style: { fill: "var(--color-Database)" } }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Frontend"
                      stroke="var(--color-Frontend)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, style: { fill: "var(--color-Frontend)" } }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Auth Service"
                      stroke="var(--color-Auth Service)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, style: { fill: "var(--color-Auth Service)" } }}
                    />
                    <Line
                      type="monotone"
                      dataKey="CDN"
                      stroke="var(--color-CDN)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, style: { fill: "var(--color-CDN)" } }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="uptime" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Uptime</CardTitle>
              <CardDescription>
                Uptime percentage across all monitors over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
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
                      domain={[98, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="API Server"
                      stroke="var(--color-API Server)"
                      fill="var(--color-API Server)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Database"
                      stroke="var(--color-Database)"
                      fill="var(--color-Database)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Frontend"
                      stroke="var(--color-Frontend)"
                      fill="var(--color-Frontend)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Auth Service"
                      stroke="var(--color-Auth Service)"
                      fill="var(--color-Auth Service)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="CDN"
                      stroke="var(--color-CDN)"
                      fill="var(--color-CDN)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="outages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Outages</CardTitle>
              <CardDescription>
                Number of outages per monitor in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={outageData}
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
                      dataKey="name"
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
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    {outageData.map((entry) => (
                      <Bar
                        key={entry.name}
                        dataKey="value"
                        name={entry.name}
                        fill={`var(--color-${entry.name})`}
                        radius={4}
                      />
                    ))}
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
