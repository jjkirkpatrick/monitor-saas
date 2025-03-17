"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Server,
  Globe
} from "lucide-react"
import { LineChartComponent } from "@/components/ui/line-chart"
import { BarChartComponent } from "@/components/ui/bar-chart"

export default function DashboardPage() {
  // Example data for charts
  const uptimeData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    uptime: 99.8 + Math.random() * 0.4
  }))

  const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    ms: 200 + Math.random() * 100
  }))

  const requestsData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    requests: Math.floor(10000 + Math.random() * 5000)
  }))

  const stats = [
    { 
      label: "Total Monitors", 
      value: "24", 
      icon: Activity, 
      trend: "+3",
      description: "Active services"
    },
    { 
      label: "Global Uptime", 
      value: "99.9%", 
      icon: TrendingUp, 
      trend: "+0.1%",
      description: "Last 30 days"
    },
    { 
      label: "Active", 
      value: "22", 
      icon: CheckCircle2, 
      trend: "0",
      description: "Healthy services"
    },
    { 
      label: "Down", 
      value: "2", 
      icon: XCircle, 
      trend: "+2",
      description: "Need attention"
    },
    { 
      label: "Response Time", 
      value: "245ms", 
      icon: Clock, 
      trend: "-12ms",
      description: "Global average"
    },
    { 
      label: "Active Alerts", 
      value: "3", 
      icon: AlertTriangle, 
      trend: "-1",
      description: "Open issues"
    }
  ]

  const recentIncidents = [
    {
      id: 1,
      monitor: "Production API",
      status: "Down",
      time: "2 minutes ago",
      duration: "1m 30s",
      type: "HTTP",
      location: "US-East"
    },
    {
      id: 2,
      monitor: "Backend Service",
      status: "Degraded",
      time: "15 minutes ago",
      duration: "5m 20s",
      type: "TCP",
      location: "EU-West"
    },
    {
      id: 3,
      monitor: "Database Cluster",
      status: "Resolved",
      time: "1 hour ago",
      duration: "10m 45s",
      type: "TCP",
      location: "AP-South"
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor your services and system health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className={`text-xs ${
                  stat.trend.startsWith("+") 
                    ? "text-green-600" 
                    : stat.trend === "0"
                    ? "text-muted-foreground"
                    : "text-red-600"
                }`}>{stat.trend}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Uptime Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={uptimeData}
              xKey="hour"
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
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={responseTimeData}
              xKey="hour"
              yKey="ms"
              height={300}
              strokeColor="hsl(var(--primary))"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Daily Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={requestsData}
              xKey="day"
              yKey="requests"
              height={300}
              color="hsl(var(--primary))"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{incident.monitor}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Server className="h-3 w-3" />
                          {incident.type}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {incident.location}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {incident.time} • Duration: {incident.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        incident.status === "Down" 
                          ? "bg-red-100 text-red-800" 
                          : incident.status === "Degraded"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
