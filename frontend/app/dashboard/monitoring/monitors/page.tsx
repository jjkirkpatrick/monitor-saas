import Link from "next/link"
import { ArrowUpDown, Edit, MoreHorizontal, PlusIcon, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Sample data - in a real app, this would come from an API
const monitors = [
  {
    id: "1",
    name: "API Server Health",
    url: "https://api.example.com/health",
    type: "HTTP",
    interval: 60,
    status: "up",
    lastChecked: "2 minutes ago",
    responseTime: 120,
  },
  {
    id: "2",
    name: "Database Connection",
    url: "https://db.example.com",
    type: "TCP",
    interval: 300,
    status: "down",
    lastChecked: "5 minutes ago",
    responseTime: 0,
  },
  {
    id: "3",
    name: "Frontend Website",
    url: "https://example.com",
    type: "HTTP",
    interval: 60,
    status: "up",
    lastChecked: "1 minute ago",
    responseTime: 230,
  },
  {
    id: "4",
    name: "Authentication Service",
    url: "https://auth.example.com/status",
    type: "HTTP",
    interval: 120,
    status: "up",
    lastChecked: "3 minutes ago",
    responseTime: 180,
  },
  {
    id: "5",
    name: "CDN Status",
    url: "https://cdn.example.com/status",
    type: "HTTP",
    interval: 300,
    status: "up",
    lastChecked: "4 minutes ago",
    responseTime: 95,
  },
]

export default function MonitorsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitors</h2>
          <p className="text-muted-foreground">
            Manage your service monitors and check their status
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

      <Card>
        <CardHeader>
          <CardTitle>All Monitors</CardTitle>
          <CardDescription>
            A list of all your service monitors and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor) => (
                <TableRow key={monitor.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/monitoring/monitors/${monitor.id}`}
                      className="hover:underline"
                    >
                      {monitor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{monitor.url}</TableCell>
                  <TableCell>{monitor.type}</TableCell>
                  <TableCell>{monitor.interval}s</TableCell>
                  <TableCell>
                    <Badge
                      variant={monitor.status === "up" ? "outline" : "destructive"}
                      className={
                        monitor.status === "up"
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                          : ""
                      }
                    >
                      {monitor.status === "up" ? "Up" : "Down"}
                    </Badge>
                  </TableCell>
                  <TableCell>{monitor.lastChecked}</TableCell>
                  <TableCell>
                    {monitor.status === "up" ? `${monitor.responseTime}ms` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/monitoring/monitors/${monitor.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/monitoring/monitors/${monitor.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
