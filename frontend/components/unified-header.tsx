"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut } from "lucide-react"

interface UnifiedHeaderProps {
  user: any | null
}

export default function UnifiedHeader({ user }: UnifiedHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={user ? "/app" : "/"} className="font-bold text-xl">
            Monitor SaaS
          </Link>
          {user ? (
            <div className="hidden md:flex gap-6">
              <Link href="/app/monitors" className="text-muted-foreground hover:text-foreground">
                Monitors
              </Link>
              <Link href="/app/stats" className="text-muted-foreground hover:text-foreground">
                Stats
              </Link>
              <Link href="/app/alerts" className="text-muted-foreground hover:text-foreground">
                Alerts
              </Link>
              <Link href="/app/settings" className="text-muted-foreground hover:text-foreground">
                Settings
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground">
                Testimonials
              </a>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Link 
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
