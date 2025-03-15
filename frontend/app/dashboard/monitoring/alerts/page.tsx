import Link from "next/link"
import { ArrowLeft, AlertCircle, CheckCircle2, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Sample data - in a real app, this would come from an API
const alerts = [
  {
    id: "1",
    service: "API Server",
    status: "resolved",
    message: "High response time detected",
    timestamp: "2023-01-30 14:32:15",
    resolvedAt: "2023-01-30 15:10:22",
    duration: "38 minutes",
  },
  {
    id: "2",
    service: "Database",
    status: "active",
    message: "Connection timeout",
    timestamp: "2023-01-30 13:15:05",
    resolvedAt: null,
    duration: "ongoing",
  },
  {
    id: "3",
    service: "Frontend",
    status: "active",
    message: "High error rate",
    timestamp: "2023-01-30 12:45:30",
    resolvedAt: null,
    duration: "ongoing",
  },
  {
    id: "4",
    service: "Auth Service",
    status: "active",
    message: "Increased latency",
    timestamp: "2023-01-30 10:22:18",
    resolvedAt: null,
    duration: "ongoing",
  },
  {
    id: "5",
    service: "CDN",
    status: "resolved",
    message: "Cache invalidation failed",
    timestamp: "2023-01-29 18:05:42",
    resolvedAt: "2023-01-29 19:30:15",
    duration: "1 hour 25 minutes",
  },
  {
    id: "6",
    service: "API Server",
    status: "resolved",
    message: "500 Internal Server Error",
    timestamp: "2023-01-29 14:10:33",
    resolvedAt: "2023-01-29 14:45:12",
    duration: "35 minutes",
  },
  {
    id: "7",
    service: "Database",
    status: "resolved",
    message: "High CPU usage",
    timestamp: "2023-01-28 22:30:05",
    resolvedAt: "2023-01-29 00:15:30",
    duration: "1 hour 45 minutes",
  },
  {
    id: "8",
    service: "Frontend",
    status: "resolved",
    message: "JavaScript error spike",
    timestamp: "2023-01-28 16:22:45",
    resolvedAt: "2023-01-28 17:05:10",
    duration: "43 minutes",
  },
  {
    id: "9",
    service: "Auth Service",
    status: "resolved",
    message: "Authentication failures",
    timestamp: "2023-01-28 09:15:22",
    resolvedAt: "2023-01-28 10:30:18",
    duration: "1 hour 15 minutes",
  },
  {
    id: "10",
    service: "CDN",
    status: "resolved",
    message: "Slow content delivery",
    timestamp: "2023-01-27 20:45:33",
    resolvedAt: "2023-01-27 21:30:45",
    duration: "45 minutes",
  },
]

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/monitoring">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alerts</h2>
          <p className="text-muted-foreground">
            View and manage alerts from all your monitors
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid gap-1">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue="all">
              <SelectTrigger id="status" className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service">Service</Label>
            <Select defaultValue="all">
              <SelectTrigger id="service" className="w-[180px]">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="api">API Server</SelectItem>
                <SelectItem value="db">Database</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="auth">Auth Service</SelectItem>
                <SelectItem value="cdn">CDN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
          <CardDescription>
            Recent alerts from all your monitored services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {alerts.map((alert, index) => (
              <div key={alert.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {alert.status === "resolved" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">{alert.service}</p>
                        <Badge variant={alert.status === "resolved" ? "outline" : "destructive"} className={
                          alert.status === "resolved"
                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                            : ""
                        }>
                          {alert.status === "resolved" ? "Resolved" : "Active"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-4">
                        <p className="text-xs text-muted-foreground">
                          Started: {alert.timestamp}
                        </p>
                        {alert.resolvedAt && (
                          <p className="text-xs text-muted-foreground">
                            Resolved: {alert.resolvedAt}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Duration: {alert.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/monitoring/monitors/${alert.id}`}>
                      View Monitor
                    </Link>
                  </Button>
                </div>
                {index < alerts.length - 1 && <Separator className="my-6" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 10 of 24 alerts
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
