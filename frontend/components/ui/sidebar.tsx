"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "Overview",
    href: "/app",
    icon: Activity
  },
  {
    title: "Monitors",
    href: "/app/monitors",
    icon: Activity,
    children: [
      {
        title: "All Monitors",
        href: "/app/monitors"
      },
      {
        title: "Add Monitor",
        href: "/app/monitors/new",
        icon: Plus
      }
    ]
  },
  {
    title: "Stats",
    href: "/app/stats",
    icon: BarChart3
  },
  {
    title: "Alerts",
    href: "/app/alerts",
    icon: AlertTriangle
  },
  {
    title: "Notifications",
    href: "/app/notifications",
    icon: Bell
  },
  {
    title: "Settings",
    href: "/app/settings",
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-16 border-r bg-background">
      <div className="flex flex-col gap-2 p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  isActive ? "text-foreground bg-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
              {item.children && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon
                    const isChildActive = pathname === child.href

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                          isChildActive ? "text-foreground bg-accent" : "text-muted-foreground"
                        )}
                      >
                        {ChildIcon && <ChildIcon className="h-4 w-4" />}
                        {child.title}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
