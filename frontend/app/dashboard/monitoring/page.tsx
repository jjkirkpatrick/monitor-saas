import Link from "next/link"
import { ArrowRightIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "./components/overview"
import { RecentAlerts } from "./components/recent-alerts"
import { StatusOverview } from "./components/status-overview"

export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your services and view performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/monitoring/monitors/add">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Monitor
            </Link>
          </Button>
        </div>
      </div>
      
      <StatusOverview />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/dashboard/monitoring/monitors"
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              View all monitors
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">
              +0.2% from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/dashboard/monitoring/metrics"
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              View detailed metrics
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              -2 from last week
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/dashboard/monitoring/alerts"
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              View all alerts
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Average response time across all monitors
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>
              Latest incidents and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAlerts />
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/monitoring/alerts">View All Alerts</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
