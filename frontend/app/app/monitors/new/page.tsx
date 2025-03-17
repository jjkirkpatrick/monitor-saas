"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewMonitorPage() {
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // In a real app, this would send data to your backend
    const formData = new FormData(e.currentTarget)
    console.log({
      name: formData.get("name"),
      url: formData.get("url"),
      type: formData.get("type"),
      interval: formData.get("interval"),
    })
    
    // Redirect back to monitors list
    router.push("/app/monitors")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/monitors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold mb-2">Add New Monitor</h1>
          <p className="text-muted-foreground">
            Configure a new service monitor
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Production API"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL or Endpoint</Label>
              <Input
                id="url"
                name="url"
                placeholder="https://api.example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Monitor Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP(S)</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="ping">Ping</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Check Interval</Label>
              <Select name="interval" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30s">30 seconds</SelectItem>
                  <SelectItem value="1m">1 minute</SelectItem>
                  <SelectItem value="5m">5 minutes</SelectItem>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Create Monitor</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
