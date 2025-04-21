"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Ticket, Factory, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore } from "@/lib/store"

export function SidebarNav() {
  const pathname = usePathname()
  const { currentCustomerId } = useStore()

  // --- UPDATE Path Checks ---
  const isAdminManageLicensesPage = pathname === "/admin-manage-licenses"
  const isCustomerPage = pathname.startsWith("/customer")
  const isAdminManageCustomerPage = pathname === "/admin-manage-customer"

  // Determine the customer page URL - if we have a customer ID, include it in the URL
  const customerPageUrl = currentCustomerId ? `/customer?id=${currentCustomerId}` : "/customer"

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-gradient-to-b from-brand-purple to-brand-purple/90 border-r border-brand-purple/20 flex flex-col items-center py-6 space-y-4 z-10">
      <TooltipProvider>
        {/* Admin Manage Licenses Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full text-white hover:bg-white/10",
                  // --- UPDATE Active State Check ---
                  isAdminManageLicensesPage && "bg-white/20 text-white pointer-events-none",
                )}
                // --- UPDATE Active State Check ---
                asChild={!isAdminManageLicensesPage}
                disabled={isAdminManageLicensesPage}
              >
                {/* --- UPDATE Link and Active State Check --- */}
                {!isAdminManageLicensesPage ? (
                  <Link href="/admin-manage-licenses">
                    <Ticket className="h-5 w-5 text-red-400" />
                    <span className="sr-only">Admin Manage Licenses</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-red-400" />
                  </div>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {/* Optional: Update tooltip text */}
            <p>Admin - Manage Licenses</p>
          </TooltipContent>
        </Tooltip>

        {/* Admin Manage Customer/User Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full text-white hover:bg-white/10",
                  // --- UPDATE Active State Check ---
                  isAdminManageCustomerPage && "bg-white/20 text-white pointer-events-none",
                )}
                // --- UPDATE Active State Check ---
                asChild={!isAdminManageCustomerPage}
                disabled={isAdminManageCustomerPage}
              >
                 {/* --- UPDATE Link and Active State Check --- */}
                {!isAdminManageCustomerPage ? (
                  <Link href="/admin-manage-customer">
                    <User className="h-5 w-5 text-red-400" />
                    <span className="sr-only">Admin Manage Customer / User</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center">
                    <User className="h-5 w-5 text-red-400" />
                  </div>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
             {/* Optional: Update tooltip text */}
            <p>Admin - Manage Customer</p>
          </TooltipContent>
        </Tooltip>

        {/* Customer Icon (moved to last position) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full text-white hover:bg-white/10",
                  isCustomerPage && "bg-white/20 text-white pointer-events-none",
                )}
                asChild={!isCustomerPage}
                disabled={isCustomerPage}
              >
                {!isCustomerPage ? (
                  <Link href={customerPageUrl}>
                    <Factory className="h-5 w-5" />
                    <span className="sr-only">Customer Portal</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center">
                    <Factory className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Customer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
