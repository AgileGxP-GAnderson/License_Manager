"use client"

import { useState } from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import CustomerForm from "@/components/customer-form"
import CustomerDetails from "@/components/customer-details"
import UserList from "@/components/user-list"

export default function AddCustomerUserPage() {
  // Get store state and subscribe to changes
  const { customers, currentCustomerId, setCurrentCustomer, searchCustomers } = useStore()

  // Find current customer directly from the customers array
  const currentCustomer = currentCustomerId ? customers.find((c) => c.id === currentCustomerId) : null

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleSearch = () => {
    setSearchError("Not implemented")
    if (searchQuery.trim()) {
      const results = searchCustomers(searchQuery)
      setSearchResults(results)
    }
  }

  const handleSelectCustomer = (customer: any) => {
    setCurrentCustomer(customer.id)
    setSearchResults([])
    setSearchQuery("")
    setSearchError(null)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-brand-purple">Add Customer / User</h1>

      <Card className="enhanced-card">
        <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSearchError(null)
                  }}
                  className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSearch}
                className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple micro-interaction"
              >
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
              {searchError && <span className="text-red-500 ml-2">{searchError}</span>}
            </div>
            <Button
              onClick={() => {
                setShowAddCustomer(true)
              }}
              className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5">
              <h3 className="font-medium mb-2">Search Results</h3>
              <ul className="space-y-2">
                {searchResults.map((customer) => (
                  <li
                    key={customer.id}
                    className="flex items-center justify-between p-2 hover:bg-brand-purple/5 rounded-md transition-colors"
                  >
                    <span>{customer.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectCustomer(customer)}
                      className="text-brand-purple hover:text-brand-purple hover:bg-brand-purple/10"
                    >
                      Select
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showAddCustomer ? (
            <CustomerForm onCancel={() => setShowAddCustomer(false)} onSuccess={() => setShowAddCustomer(false)} />
          ) : (
            currentCustomer && <CustomerDetails customer={currentCustomer} />
          )}
        </CardContent>
      </Card>

      {currentCustomer && !showAddCustomer && (
        <Card className="enhanced-card">
          <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <UserList customerId={currentCustomer.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
