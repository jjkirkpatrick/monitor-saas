"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter,
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Globe,
  Server,
  Clock,
  MoreVertical,
  ArrowUpDown
} from "lucide-react"
import Link from "next/link"
import { LineChartComponent } from "@/components/ui/line-chart"

export default function MonitorsPage() {
  // Example data for monitors
  const monitors = [
    {
      id: 1,
      name: "Production API",
      url: "https://api.example.com",
      type: "HTTP",
      interval: "1m",
      status: "up",
      lastCheck: "2 minutes ago",
      uptime: "99.9%",
      responseTime: "156ms",
      location: "US-East",
      chart: Array.from({ length: 12 }, () => ({ value: 150 + Math.random() * 100 }))
    },
    {
      id: 2,
      name: "Backend Service",
      url: "https://backend.example.com",
      type: "TCP",
      interval: "5m",
      status: "down",
      lastCheck: "5 minutes ago",
      uptime: "98.5%",
      responseTime: "445ms",
      location: "EU-West",
      chart: Array.from({ length: 12 }, () => ({ value: 400 + Math.random() * 100 }))
    },
    {
      id: 3,
      name: "Database Cluster",
      url: "postgresql://db.example.com:5432",
      type: "TCP",
      interval: "1m",
      status: "degraded",
      lastCheck: "1 minute ago",
      uptime: "99.7%",
      responseTime: "89ms",
      location: "AP-South",
      chart: Array.from({ length: 12 }, () => ({ value: 80 + Math.random() * 20 }))
    },
    {
      id: 4,
      name: "Cache Service",
      url: "redis://cache.example.com:6379",
      type: "TCP",
      interval: "1m",
      status: "up",
      lastCheck: "1 minute ago",
      uptime: "99.95%",
      responseTime: "12ms",
      location: "US-West",
      chart: Array.from({ length: 12 }, () => ({ value: 10 + Math.random() * 5 }))
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Monitors</h1>
          <p className="text-muted-foreground">
            Manage and monitor your services
          </p>
        </div>
        <Link href="/app/monitors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-2">
              <Input placeholder="Search monitors..." className="flex-1" />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="ping">Ping</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="us-east">US East</SelectItem>
                <SelectItem value="us-west">US West</SelectItem>
                <SelectItem value="eu-west">EU West</SelectItem>
                <SelectItem value="ap-south">AP South</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Monitors List */}
      <div className="grid gap-4">
        {monitors.map((monitor) => (
          <Card key={monitor.id}>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-4">
                {/* Monitor Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{monitor.name}</h3>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Server className="h-4 w-4" />
                    {monitor.type}
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <Globe className="h-4 w-4" />
                    {monitor.location}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {monitor.url}
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {monitor.status === "up" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : monitor.status === "down" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className={`capitalize font-medium ${
                      monitor.status === "up"
                        ? "text-green-500"
                        : monitor.status === "down"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}>
                      {monitor.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last check: {monitor.lastCheck}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Check interval: {monitor.interval}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-medium">{monitor.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="font-medium">{monitor.responseTime}</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[100px]">
                  <LineChartComponent
                    data={monitor.chart}
                    xKey="index"
                    yKey="value"
                    height={100}
                    strokeColor={
                      monitor.status === "up"
                        ? "hsl(var(--primary))"
                        : monitor.status === "down"
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--warning))"
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
