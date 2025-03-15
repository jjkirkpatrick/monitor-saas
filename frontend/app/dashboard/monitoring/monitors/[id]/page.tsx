import Link from "next/link"
import { ArrowLeft, Clock, Edit, Globe, Server } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonitorMetrics } from "./components/monitor-metrics"
import { MonitorHistory } from "./components/monitor-history"
import { MonitorSettings } from "./components/monitor-settings"

// Sample data - in a real app, this would come from an API based on the ID
const monitor = {
  id: "1",
  name: "API Server Health",
  url: "https://api.example.com/health",
  type: "HTTP",
  interval: 60,
  status: "up",
  lastChecked: "2 minutes ago",
  responseTime: 120,
  uptime: 99.98,
  created: "2023-01-15",
  timeout: 10,
  expectedStatusCode: 200,
}

export default function MonitorDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the monitor data based on params.id
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/monitoring/monitors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{monitor.name}</h2>
            <Badge
              variant={monitor.status === "up" ? "outline" : "destructive"}
              className={
                monitor.status === "up"
                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                  : ""
              }
            >
              {monitor.status === "up" ? "Up" : "Down"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Monitor details and performance metrics
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/monitoring/monitors/${params.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitor.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average: 135ms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitor.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Checked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitor.lastChecked}</div>
            <p className="text-xs text-muted-foreground">
              Next check in {monitor.interval} seconds
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor Information</CardTitle>
          <CardDescription>
            Basic information about this monitor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">URL</dt>
              <dd className="flex items-center gap-2 font-mono text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {monitor.url}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Type</dt>
              <dd className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-muted-foreground" />
                {monitor.type}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Check Interval</dt>
              <dd className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {monitor.interval} seconds
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="text-sm">{monitor.created}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Timeout</dt>
              <dd className="text-sm">{monitor.timeout} seconds</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Expected Status Code</dt>
              <dd className="text-sm">{monitor.expectedStatusCode}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="mt-6">
          <MonitorMetrics monitorId={params.id} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <MonitorHistory monitorId={params.id} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <MonitorSettings monitorId={params.id} monitor={monitor} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
