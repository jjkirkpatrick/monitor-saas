import { CheckCircle2, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Sample data - in a real app, this would come from an API
const services = [
  {
    id: "1",
    name: "API Server",
    status: "operational",
    uptime: 99.98,
  },
  {
    id: "2",
    name: "Database",
    status: "degraded",
    uptime: 98.5,
  },
  {
    id: "3",
    name: "Frontend",
    status: "operational",
    uptime: 100,
  },
  {
    id: "4",
    name: "Auth Service",
    status: "operational",
    uptime: 99.9,
  },
  {
    id: "5",
    name: "CDN",
    status: "operational",
    uptime: 99.95,
  },
]

export function StatusOverview() {
  const operationalCount = services.filter(
    (service) => service.status === "operational"
  ).length
  const totalServices = services.length
  const allOperational = operationalCount === totalServices

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">System Status</h3>
          <div className="flex items-center gap-2">
            {allOperational ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-500">All Systems Operational</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">
                  {operationalCount} of {totalServices} Systems Operational
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{service.name}</span>
                {service.status === "operational" ? (
                  <span className="flex items-center text-xs text-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Operational
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-amber-500">
                    <XCircle className="mr-1 h-3 w-3" />
                    Degraded
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={service.uptime}
                  className={cn(
                    "h-2",
                    service.uptime > 99.9
                      ? "bg-primary/20 [&>div]:bg-green-500"
                      : service.uptime > 99
                      ? "bg-primary/20 [&>div]:bg-amber-500"
                      : "bg-primary/20 [&>div]:bg-destructive"
                  )}
                />
                <span className="text-xs text-muted-foreground">{service.uptime}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
