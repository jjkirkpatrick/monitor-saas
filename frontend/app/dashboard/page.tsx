import Link from "next/link"
import { ArrowRightIcon } from "@radix-ui/react-icons"
import { ActivityIcon, SettingsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardHome() {
  return (
    <div className="flex flex-1 flex-grow flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome to UptimeMonitor</h2>
      <p className="text-muted-foreground">
        Monitor your services and manage your organization settings
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5 text-primary" />
              <CardTitle>Monitoring Dashboard</CardTitle>
            </div>
            <CardDescription>
              Monitor your services and view performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              The monitoring dashboard allows you to track the status of your services in real-time. 
              Add monitors, view detailed metrics, and receive alerts when issues arise.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/monitoring" className="w-full">
              <Button className="w-full">
                Go to Monitoring
                <ArrowRightIcon className="ml-2 size-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>Organization Settings</CardTitle>
            </div>
            <CardDescription>
              Manage your organization settings and members
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Configure your organization settings, manage team members, set up single sign-on,
              and customize security policies for your organization.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/organization/general" className="w-full">
              <Button className="w-full">
                Go to Settings
                <ArrowRightIcon className="ml-2 size-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Note: Some administrative features require an &quot;admin&quot; role in your organization.
      </p>
    </div>
  )
}
