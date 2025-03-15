import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Sample data - in a real app, this would come from an API
const historyEvents = [
  {
    id: "1",
    timestamp: "2023-01-30 14:32:15",
    status: "up",
    responseTime: 125,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "2",
    timestamp: "2023-01-30 14:17:15",
    status: "up",
    responseTime: 130,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "3",
    timestamp: "2023-01-30 14:02:15",
    status: "up",
    responseTime: 128,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "4",
    timestamp: "2023-01-30 13:47:15",
    status: "down",
    responseTime: 0,
    statusCode: 500,
    message: "Internal Server Error",
  },
  {
    id: "5",
    timestamp: "2023-01-30 13:32:15",
    status: "up",
    responseTime: 132,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "6",
    timestamp: "2023-01-30 13:17:15",
    status: "up",
    responseTime: 129,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "7",
    timestamp: "2023-01-30 13:02:15",
    status: "up",
    responseTime: 131,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "8",
    timestamp: "2023-01-30 12:47:15",
    status: "up",
    responseTime: 127,
    statusCode: 200,
    message: "Monitor is up",
  },
  {
    id: "9",
    timestamp: "2023-01-30 12:32:15",
    status: "down",
    responseTime: 0,
    statusCode: 503,
    message: "Service Unavailable",
  },
  {
    id: "10",
    timestamp: "2023-01-30 12:17:15",
    status: "up",
    responseTime: 130,
    statusCode: 200,
    message: "Monitor is up",
  },
]

interface MonitorHistoryProps {
  monitorId: string
}

export function MonitorHistory({ monitorId }: MonitorHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor History</CardTitle>
        <CardDescription>
          Recent check history for this monitor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historyEvents.map((event, index) => (
            <div key={event.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {event.status === "up" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{event.timestamp}</p>
                      <Badge variant={event.status === "up" ? "outline" : "destructive"} className={
                        event.status === "up"
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                          : ""
                      }>
                        {event.status === "up" ? "Up" : "Down"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.message}
                    </p>
                    <div className="mt-1 flex gap-4">
                      <p className="text-xs text-muted-foreground">
                        Response Time: {event.status === "up" ? `${event.responseTime}ms` : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status Code: {event.statusCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {index < historyEvents.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
