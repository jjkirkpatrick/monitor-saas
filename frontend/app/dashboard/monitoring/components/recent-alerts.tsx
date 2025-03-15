import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Sample data - in a real app, this would come from an API
const alerts = [
  {
    id: "1",
    service: "API Server",
    status: "resolved",
    message: "High response time detected",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    service: "Database",
    status: "active",
    message: "Connection timeout",
    timestamp: "3 hours ago",
  },
  {
    id: "3",
    service: "Frontend",
    status: "active",
    message: "High error rate",
    timestamp: "5 hours ago",
  },
  {
    id: "4",
    service: "Auth Service",
    status: "active",
    message: "Increased latency",
    timestamp: "1 day ago",
  },
  {
    id: "5",
    service: "CDN",
    status: "resolved",
    message: "Cache invalidation failed",
    timestamp: "2 days ago",
  },
]

export function RecentAlerts() {
  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <div key={alert.id}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {alert.status === "active" ? (
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">{alert.service}</p>
                  <Badge variant={alert.status === "active" ? "destructive" : "outline"}>
                    {alert.status === "active" ? "Active" : "Resolved"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{alert.timestamp}</p>
              </div>
            </div>
          </div>
          {index < alerts.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}
