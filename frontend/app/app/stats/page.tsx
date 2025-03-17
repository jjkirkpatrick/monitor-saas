"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Globe,
  Cpu,
  Database,
  HardDrive,
  Network
} from "lucide-react"
import { LineChartComponent } from "@/components/ui/line-chart"
import { BarChartComponent } from "@/components/ui/bar-chart"

export default function StatsPage() {
  // Example data for charts
  const uptimeHistory = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    uptime: 99.7 + Math.random() * 0.3
  }))

  const responseTimeHistory = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    avg: 180 + Math.random() * 100,
    p95: 220 + Math.random() * 150,
    p99: 280 + Math.random() * 200
  }))

  const locationStats = [
    { location: "US-East", requests: Math.floor(50000 + Math.random() * 20000) },
    { location: "US-West", requests: Math.floor(40000 + Math.random() * 20000) },
    { location: "EU-West", requests: Math.floor(45000 + Math.random() * 20000) },
    { location: "EU-Central", requests: Math.floor(35000 + Math.random() * 20000) },
    { location: "AP-South", requests: Math.floor(30000 + Math.random() * 20000) },
    { location: "AP-East", requests: Math.floor(25000 + Math.random() * 20000) }
  ]

  const resourceStats = [
    {
      name: "CPU Usage",
      icon: Cpu,
      current: "45%",
      trend: "-5%",
      data: Array.from({ length: 12 }, () => ({ value: 30 + Math.random() * 40 }))
    },
    {
      name: "Memory Usage",
      icon: Database,
      current: "68%",
      trend: "+2%",
      data: Array.from({ length: 12 }, () => ({ value: 50 + Math.random() * 30 }))
    },
    {
      name: "Disk I/O",
      icon: HardDrive,
      current: "2.1 MB/s",
      trend: "+0.3 MB/s",
      data: Array.from({ length: 12 }, () => ({ value: Math.random() * 5 }))
    },
    {
      name: "Network",
      icon: Network,
      current: "8.5 MB/s",
      trend: "-1.2 MB/s",
      data: Array.from({ length: 12 }, () => ({ value: 5 + Math.random() * 8 }))
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            Detailed performance metrics and analytics
          </p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resource Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resourceStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.current}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Last hour average
                  </p>
                  <span className={`text-xs ${
                    stat.trend.startsWith("+") 
                      ? "text-red-600" 
                      : "text-green-600"
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <div className="mt-3 h-[50px]">
                  <LineChartComponent
                    data={stat.data}
                    xKey="index"
                    yKey="value"
                    height={50}
                    strokeColor={stat.trend.startsWith("+") ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Uptime History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={uptimeHistory}
              xKey="date"
              yKey="uptime"
              height={300}
              strokeColor="hsl(var(--primary))"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={responseTimeHistory}
              xKey="date"
              yKey="avg"
              height={300}
              strokeColor="hsl(var(--primary))"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Requests by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={locationStats}
              xKey="location"
              yKey="requests"
              height={300}
              color="hsl(var(--primary))"
            />
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Metric
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Current
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Average
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    P95
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    P99
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Response Time</td>
                  <td className="p-4">156ms</td>
                  <td className="p-4">189ms</td>
                  <td className="p-4">245ms</td>
                  <td className="p-4">312ms</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Database Queries</td>
                  <td className="p-4">45ms</td>
                  <td className="p-4">52ms</td>
                  <td className="p-4">78ms</td>
                  <td className="p-4">95ms</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">API Latency</td>
                  <td className="p-4">89ms</td>
                  <td className="p-4">102ms</td>
                  <td className="p-4">156ms</td>
                  <td className="p-4">198ms</td>
                </tr>
                <tr>
                  <td className="p-4">Cache Hit Rate</td>
                  <td className="p-4">94.5%</td>
                  <td className="p-4">92.8%</td>
                  <td className="p-4">88.2%</td>
                  <td className="p-4">85.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
