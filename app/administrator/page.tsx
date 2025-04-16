"use client"

import { useState } from "react"
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import CustomerDetails from "@/components/customer-details"
import PurchaseOrderList from "@/components/purchase-order-list"
import PurchaseOrderForm from "@/components/purchase-order-form"

export default function AdministratorPage() {
  // Get store state and subscribe to changes
  const { customers, currentCustomerId, setCurrentCustomer, searchCustomers } = useStore()

  // Find current customer directly from the customers array
  const currentCustomer = currentCustomerId ? customers.find((c) => c.id === currentCustomerId) : null

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showAddPurchaseOrder, setShowAddPurchaseOrder] = useState(false)
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
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-brand-purple">License Manager - Administrator Portal</h1>
          {currentCustomer ? (
            <div className="mt-2 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
              <p className="text-lg">
                Current Customer: <span className="font-semibold">{currentCustomer.name}</span>
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-2">No customer selected</p>
          )}
        </div>
      </div>

      <Card className="enhanced-card">
        <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center mb-6">
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
              <Button variant="outline" onClick={handleSearch} className="micro-interaction">
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
              {searchError && <span className="text-red-500 ml-2">{searchError}</span>}
            </div>
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

          {currentCustomer && <CustomerDetails customer={currentCustomer} />}
        </CardContent>
      </Card>

      {currentCustomer && (
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
            <CardTitle>Purchase Orders</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddPurchaseOrder(!showAddPurchaseOrder)}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
            >
              {showAddPurchaseOrder ? "Cancel" : "Add Purchase Order"}
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {showAddPurchaseOrder ? (
              <PurchaseOrderForm
                customerId={currentCustomer.id}
                onCancel={() => setShowAddPurchaseOrder(false)}
                onSuccess={() => setShowAddPurchaseOrder(false)}
              />
            ) : (
              <PurchaseOrderList customerId={currentCustomer.id} isAdminView={true} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
