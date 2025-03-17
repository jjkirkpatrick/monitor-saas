import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Sidebar } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/sign-in")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 bg-background">
        <div className="max-w-[1800px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
