"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Users, Factory, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore } from "@/lib/store"

export function SidebarNav() {
  const pathname = usePathname()
  const { currentCustomerId } = useStore()

  const isAdminPage = pathname === "/administrator"
  const isCustomerPage = pathname.startsWith("/customer")
  const isAddCustomerUserPage = pathname === "/add-customer-user"

  // Determine the customer page URL - if we have a customer ID, include it in the URL
  const customerPageUrl = currentCustomerId ? `/customer?id=${currentCustomerId}` : "/customer"

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-gradient-to-b from-brand-purple to-brand-purple/90 border-r border-brand-purple/20 flex flex-col items-center py-6 space-y-4 z-10">
      <TooltipProvider>
        {/* Administrator Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full text-white hover:bg-white/10",
                  isAdminPage && "bg-white/20 text-white pointer-events-none",
                )}
                asChild={!isAdminPage}
                disabled={isAdminPage}
              >
                {!isAdminPage ? (
                  <Link href="/administrator">
                    <Users className="h-5 w-5" />
                    <span className="sr-only">Administrator Portal</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Administrator</p>
          </TooltipContent>
        </Tooltip>

        {/* Add Customer/User Icon - Now active on both Admin and Customer pages */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full text-white hover:bg-white/10",
                  isAddCustomerUserPage && "bg-white/20 text-white pointer-events-none",
                  !isAdminPage && !isCustomerPage && !isAddCustomerUserPage && "opacity-50 pointer-events-none",
                )}
                asChild={!isAddCustomerUserPage && (isAdminPage || isCustomerPage)}
                disabled={isAddCustomerUserPage || (!isAdminPage && !isCustomerPage)}
              >
                {!isAddCustomerUserPage && (isAdminPage || isCustomerPage) ? (
                  <Link href="/add-customer-user">
                    <UserPlus className="h-5 w-5" />
                    <span className="sr-only">Add Customer / User</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add Customer / User</p>
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
