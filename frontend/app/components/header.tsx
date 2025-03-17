"use client"

import { ThemeToggle } from "@/app/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 ml-64 w-[calc(100%-16rem)] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Monitor SaaS</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
