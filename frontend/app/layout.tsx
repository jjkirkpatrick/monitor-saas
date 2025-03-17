import { createClient } from "@/utils/supabase/server"
import { ThemeProvider } from "@/components/ui/theme-provider"
import UnifiedHeader from "@/components/unified-header"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Monitor SaaS - Enterprise Monitoring Solution",
  description: "Comprehensive monitoring solution for modern applications and services",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <UnifiedHeader user={user} />
            <main>
              {children}
            </main>
            <footer className="border-t py-12 mt-auto">
              <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <h3 className="font-bold">Monitor SaaS</h3>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade monitoring solution for modern applications and services.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Product</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#features" className="text-muted-foreground hover:text-foreground">Features</a></li>
                    <li><a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
                    <li><a href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</a></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Company</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/about" className="text-muted-foreground hover:text-foreground">About</a></li>
                    <li><a href="/blog" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                    <li><a href="/careers" className="text-muted-foreground hover:text-foreground">Careers</a></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
                    <li><a href="/terms" className="text-muted-foreground hover:text-foreground">Terms</a></li>
                  </ul>
                </div>
              </div>
              <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t">
                <p className="text-center text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Monitor SaaS. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
