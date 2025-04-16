import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarNav } from "@/components/sidebar-nav"
import { Toaster } from "@/components/toaster"
import Link from "next/link"
import { UserCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "License Manager",
  description: "Manage software licenses and customers",
  icons: {
    icon: "/favicon.svg",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen">
            <SidebarNav />
            <div className="flex-1 pl-16 relative">
              {/* Header Bar - adjust z-index to be lower than navigation elements */}
              <div className="fixed top-0 left-16 right-0 h-16 bg-gray-100 border-b border-gray-200 z-5 flex items-center justify-between">
                <div className="pl-4">
                  <Link href="/" className="block">
                    <img
                      src="/logo.svg"
                      alt="License Manager Logo"
                      className="w-10 h-10 sidebar-logo"
                      title="License Manager"
                    />
                  </Link>
                </div>

                {/* Login Icon */}
                <div className="pr-6">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="rounded-full p-1 hover:bg-brand-purple/10 transition-colors">
                          <UserCircle className="h-8 w-8 text-brand-purple" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Not yet implemented</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Main Content - now with top padding to account for header */}
              <div className="pt-16">{children}</div>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'