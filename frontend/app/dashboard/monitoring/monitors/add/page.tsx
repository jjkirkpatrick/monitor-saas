"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function AddMonitorPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    // In a real app, this would send data to an API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success("Monitor created successfully")
      router.push("/dashboard/monitoring/monitors")
    } catch (error) {
      toast.error("Failed to create monitor")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/monitoring/monitors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Monitor</h2>
          <p className="text-muted-foreground">
            Create a new service monitor
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Monitor Details</CardTitle>
            <CardDescription>
              Enter the details of the service you want to monitor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                id="name"
                placeholder="API Health Check"
                required
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name for your monitor
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://api.example.com/health"
                required
              />
              <p className="text-xs text-muted-foreground">
                The URL to monitor
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Monitor Type</Label>
                <Select defaultValue="http">
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
                <p className="text-xs text-muted-foreground">
                  The type of check to perform
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Check Interval (seconds)</Label>
                <Select defaultValue="60">
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
                <p className="text-xs text-muted-foreground">
                  How often to check the service
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                max="60"
                defaultValue="10"
                required
              />
              <p className="text-xs text-muted-foreground">
                How long to wait for a response before marking as down
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected">Expected Status Code</Label>
              <Input
                id="expected"
                placeholder="200"
                defaultValue="200"
              />
              <p className="text-xs text-muted-foreground">
                For HTTP monitors, the expected status code (leave empty to accept any 2xx code)
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/monitoring/monitors">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Monitor"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
