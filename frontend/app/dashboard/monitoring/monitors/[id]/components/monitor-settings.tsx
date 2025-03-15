"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

interface MonitorSettingsProps {
  monitorId: string
  monitor: {
    id: string
    name: string
    url: string
    type: string
    interval: number
    timeout: number
    expectedStatusCode: number
  }
}

export function MonitorSettings({ monitorId, monitor }: MonitorSettingsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    // In a real app, this would send data to an API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success("Monitor updated successfully")
    } catch (error) {
      toast.error("Failed to update monitor")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)

    // In a real app, this would send a delete request to an API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success("Monitor deleted successfully")
      router.push("/dashboard/monitoring/monitors")
    } catch (error) {
      toast.error("Failed to delete monitor")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Monitor Settings</CardTitle>
            <CardDescription>
              Update the settings for this monitor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                id="name"
                defaultValue={monitor.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                defaultValue={monitor.url}
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Monitor Type</Label>
                <Select defaultValue={monitor.type.toLowerCase()}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="ping">Ping</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Check Interval (seconds)</Label>
                <Select defaultValue={monitor.interval.toString()}>
                  <SelectTrigger id="interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                max="60"
                defaultValue={monitor.timeout}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected">Expected Status Code</Label>
              <Input
                id="expected"
                defaultValue={monitor.expectedStatusCode}
              />
              <p className="text-xs text-muted-foreground">
                For HTTP monitors, the expected status code (leave empty to accept any 2xx code)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="notifications" defaultChecked />
              <Label htmlFor="notifications">Enable Notifications</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(true)}>
              Delete Monitor
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {showDeleteConfirm && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Delete Monitor</AlertTitle>
          <AlertDescription>
            <p className="mb-4">
              Are you sure you want to delete this monitor? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete Monitor"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
