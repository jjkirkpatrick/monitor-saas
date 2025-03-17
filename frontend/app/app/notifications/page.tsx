"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Bell,
  MailIcon,
  MessageSquare,
  Phone,
  Slack,
  Filter,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NotificationsPage() {
  // Example data - in a real app this would come from your backend
  const notifications = [
    {
      id: 1,
      title: "Production API Down",
      message: "HTTP 500 error detected on Production API endpoint",
      channel: "Email",
      recipients: ["team@example.com"],
      status: "Delivered",
      timestamp: "2025-03-17T15:10:00Z",
      icon: MailIcon
    },
    {
      id: 2,
      title: "High Latency Alert",
      message: "Backend Service experiencing high latency (>2s)",
      channel: "Slack",
      recipients: ["#monitoring"],
      status: "Delivered",
      timestamp: "2025-03-17T14:55:00Z",
      icon: Slack
    },
    {
      id: 3,
      title: "Database Connection Issue",
      message: "Connection timeout on Database Cluster",
      channel: "SMS",
      recipients: ["+1234567890"],
      status: "Failed",
      timestamp: "2025-03-17T12:30:00Z",
      icon: MessageSquare
    },
    {
      id: 4,
      title: "Cache Service Alert",
      message: "Memory usage exceeded threshold (90%)",
      channel: "Phone",
      recipients: ["On-call Team"],
      status: "Delivered",
      timestamp: "2025-03-17T10:15:00Z",
      icon: Phone
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            View notification history across all channels
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = notification.icon
              return (
                <Card key={notification.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            {notification.status === "Delivered" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm ${
                              notification.status === "Delivered"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}>
                              {notification.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Via {notification.channel}</span>
                          <span>To: {notification.recipients.join(", ")}</span>
                          <span>
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Load More Button */}
      <div className="flex justify-center">
        <Button variant="outline">
          Load More
        </Button>
      </div>
    </div>
  )
}
