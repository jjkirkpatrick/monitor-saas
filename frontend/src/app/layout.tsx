import { ThemeProvider } from "@/components/theme-provider"
import { Inter as FontSans } from "next/font/google"
import "./globals.css";
import { cn } from "@/lib/utils";

const defaultUrl = process.env.NEXT_PUBLIC_URL as string || "http://localhost:3000";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Monitor SaaS",
  description: "Website and API monitoring service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(
      "min-h-screen bg-background font-sans antialiased",
      fontSans.variable
    )}>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
