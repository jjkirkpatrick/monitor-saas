"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  Settings,
  AlertTriangle,
  MonitorCheck
} from "lucide-react"

interface DashboardNavProps {
  user: {
    email?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/app", label: "Overview", icon: LayoutDashboard },
    { href: "/app/monitors", label: "Monitors", icon: MonitorCheck },
    { href: "/app/stats", label: "Stats", icon: Activity },
    { href: "/app/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/app/notifications", label: "Notifications", icon: Bell },
    { href: "/app/settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Monitor SaaS</h1>
      </div>
      <nav className="flex-1 px-4 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="block mb-1"
            >
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 hover:bg-accent/50 ${
                  pathname === item.href ? "bg-accent" : ""
                }`}
              >
                <Icon size={20} className="text-muted-foreground" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-sm font-medium">
              {user.email?.[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Logged in
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
