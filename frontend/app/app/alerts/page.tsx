"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  Clock, 
  MailIcon,
  MessageSquare,
  Phone,
  Plus,
  Settings,
  Slack,
  XCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AlertsPage() {
  // Example data - in a real app this would come from your backend
  const activeAlerts = [
    {
      id: 1,
      monitor: "Production API",
      status: "Down",
      message: "HTTP 500 error",
      duration: "10m",
      timestamp: "2025-03-17T15:10:00Z",
      severity: "critical"
    },
    {
      id: 2,
      monitor: "Backend Service",
      status: "Degraded",
      message: "High latency detected",
      duration: "25m",
      timestamp: "2025-03-17T14:55:00Z",
      severity: "warning"
    }
  ]

  const alertHistory = [
    {
      id: 3,
      monitor: "Database Cluster",
      status: "Resolved",
      message: "Connection timeout",
      duration: "15m",
      timestamp: "2025-03-17T12:30:00Z",
      severity: "critical",
      resolution: "Auto-recovered"
    },
    {
      id: 4,
      monitor: "Cache Service",
      status: "Resolved",
      message: "Memory usage exceeded 90%",
      duration: "8m",
      timestamp: "2025-03-17T10:15:00Z",
      severity: "warning",
      resolution: "Manual intervention"
    }
  ]

  const notificationChannels = [
    {
      type: "Email",
      icon: MailIcon,
      status: "Configured",
      recipients: "team@example.com, alerts@example.com"
    },
    {
      type: "Slack",
      icon: Slack,
      status: "Configured",
      recipients: "#monitoring, #incidents"
    },
    {
      type: "SMS",
      icon: MessageSquare,
      status: "Not Configured",
      recipients: "-"
    },
    {
      type: "Phone",
      icon: Phone,
      status: "Not Configured",
      recipients: "-"
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Alerts</h1>
          <p className="text-muted-foreground">
            Manage alerts and notification settings
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Configure Alert
        </Button>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{alert.monitor}</h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        alert.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {alert.status}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Duration: {alert.duration}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Alert History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alertHistory.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{alert.monitor}</h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="text-sm text-green-600">
                        Resolution: {alert.resolution}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {alert.status}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Duration: {alert.duration}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationChannels.map((channel) => {
              const Icon = channel.icon
              return (
                <Card key={channel.type}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <h3 className="font-medium">{channel.type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {channel.recipients}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
