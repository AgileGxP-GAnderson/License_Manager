"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit, Loader2 } from "lucide-react"
import debounce from 'lodash.debounce';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import CustomerForm from "@/components/customer-form"
import CustomerDetails from "@/components/customer-details"
import UserList from "@/components/user-list"
import type { Customer } from "@/lib/types"

export default function AddCustomerUserPage() {
  // Get store state and actions
  // We still need setCurrentCustomer to potentially update the ID in persisted state
  const { customers, currentCustomerId, setCurrentCustomer } = useStore()

  // --- NEW: Local state to hold the actual selected customer object ---
  const [selectedCustomerObject, setSelectedCustomerObject] = useState<Customer | null>(null);

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // --- NEW: Effect to sync local state with store ID if possible ---
  // This handles cases where the ID might be set externally or from persisted state
  useEffect(() => {
    if (currentCustomerId) {
      // If local object is already set and matches ID, do nothing
      if (selectedCustomerObject?.id === currentCustomerId) {
        return;
      }
      // Try to find the customer in the main store list
      const customerFromStore = customers.find((c) => c.id === currentCustomerId);
      if (customerFromStore) {
        setSelectedCustomerObject(customerFromStore);
      } else {
        // Optional: If not found in store list, maybe clear local state or fetch details?
        // For now, we'll assume selection via search is the primary way here.
        // If the ID was persisted but the object isn't in the initial 'customers' list,
        // selectedCustomerObject might remain null until a selection happens.
      }
    } else {
      // If store ID is null, clear local object state
      setSelectedCustomerObject(null);
    }
  }, [currentCustomerId, customers, selectedCustomerObject]); // Add selectedCustomerObject dependency


  // Reset isEditing when showAddCustomer becomes false
  useEffect(() => {
    if (!showAddCustomer) {
      setIsEditing(false);
    }
  }, [showAddCustomer]);

  // Async function to fetch customers from API
  const fetchCustomers = useCallback(async (query: string) => {
    // ... (fetchCustomers implementation remains the same) ...
    if (!query.trim() || query.trim().length < 2) { // Only search if query is >= 2 chars
      setSearchResults([]);
      setIsLoadingSearch(false); // Ensure loading is false if query is too short
      return;
    }
    setIsLoadingSearch(true); // Start loading
    setSearchError(null);
    try {
      // Use the same API endpoint as the administrator page
      const response = await fetch(`/api/customers?businessName=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch customers' }));
        throw new Error(errorData.message || 'Failed to fetch customers');
      }
      const data: Customer[] = await response.json();
      setSearchResults(data);
    } catch (error: any) {
      console.error('Error searching customers:', error);
      setSearchError(error.message || "Failed to search customers");
      setSearchResults([]); // Clear results on error
    } finally {
      setIsLoadingSearch(false); // Stop loading
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(debounce(fetchCustomers, 300), [fetchCustomers]);

  // useEffect to trigger debounced search on query change
  useEffect(() => {
    // ... (useEffect for debounced search remains the same) ...
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]); // Clear results if query is too short
      setSearchError(null); // Clear error
      debouncedSearch.cancel(); // Cancel any pending debounced calls
    }
    // Cleanup function to cancel debounce on unmount or query change
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);


  const handleSelectCustomer = (customer: Customer) => {
    // --- UPDATE: Set both the store ID and the local customer object ---
    setCurrentCustomer(customer.id); // Update store ID (for persistence/consistency)
    setSelectedCustomerObject(customer); // Update local state with the full object

    setSearchResults([]) // Clear search results
    setSearchQuery("") // Clear search input
    setSearchError(null)
    setShowAddCustomer(false) // Hide form when selecting
    setIsEditing(false); // Ensure not in edit mode
  }

  const handleEditClick = () => {
    // --- UPDATE: Use selectedCustomerObject for editing ---
    if (selectedCustomerObject) {
      setIsEditing(true);
      setShowAddCustomer(true);
      setSearchResults([]);
      setSearchQuery("");
    }
  }

  const handleAddClick = () => {
    setIsEditing(false);
    setShowAddCustomer(true);
    setSearchResults([]);
    setSearchQuery("");
    // --- UPDATE: Clear the selected customer object when adding new ---
    setCurrentCustomer(null);
    setSelectedCustomerObject(null);
  }

  const handleCancelForm = () => {
    setShowAddCustomer(false);
    setIsEditing(false);
  }

  const handleSuccessForm = (updatedCustomer: Customer | null) => {
    console.log("handleSuccessForm triggered with data:", updatedCustomer);

    if (updatedCustomer) {
        // Directly use the data passed back from the form/store action
        setSelectedCustomerObject(updatedCustomer);
        console.log("Set selectedCustomerObject state directly to:", updatedCustomer);
        // Ensure store ID is also consistent (it should be already)
        setCurrentCustomer(updatedCustomer.id);
    } else {
        // This case happens if adding a customer (and addCustomer doesn't return data)
        // or if updateCustomer somehow failed to return data (shouldn't happen on success)
        console.log("handleSuccessForm called without updated customer data (likely added new or error).");
        if (isEditing) {
             console.warn("Received null customer data after successful edit, selection might be lost.");
             // Fallback: Clear selection if the updated data can't be confirmed.
             // setSelectedCustomerObject(null);
             // setCurrentCustomer(null);
        }
        // If adding a new customer, you might want specific logic here,
        // like fetching the newly added customer if addCustomer returns an ID.
    }

    // --- Close the form and reset editing state regardless ---
    setShowAddCustomer(false);
    setIsEditing(false);
    console.log("Set showAddCustomer to false, isEditing to false");
  }


  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-brand-purple">Manage Customer / User</h1>

      {/* --- UPDATE: Display name using selectedCustomerObject --- */}
      {selectedCustomerObject && (
        <div className="mt-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Current Customer: <span className="text-brand-purple">{selectedCustomerObject.businessName}</span>
          </h2>
        </div>
      )}

      <Card className="enhanced-card">
        <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6 gap-2">
            {/* Search Section */}
            {/* ... (search input remains the same) ... */}
             <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 max-w-sm relative">
                <Input
                  placeholder="Search customers (min 2 chars)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                  }}
                  className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                />
                {isLoadingSearch && (
                   <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>


            {/* Action Buttons Section */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleEditClick}
                // --- UPDATE: Disable based on selectedCustomerObject ---
                disabled={!selectedCustomerObject || showAddCustomer}
                className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple micro-interaction"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Customer
              </Button>
              <Button
                onClick={handleAddClick}
                disabled={showAddCustomer}
                className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </div>
          </div>

          {/* Search Results or Error */}
          {/* ... (search results display remains the same) ... */}
           {searchError && <p className="text-red-500 mb-4 text-sm">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5">
              <h3 className="font-medium mb-2">Search Results</h3>
              <ul className="space-y-2">
                {searchResults.map((customer) => (
                  <li
                    key={customer.id}
                    className="flex items-center justify-between p-2 hover:bg-brand-purple/5 rounded-md transition-colors"
                  >
                    <span>{customer.businessName} ({customer.contactName})</span>
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
          {!isLoadingSearch && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchError && (
             <p className="text-muted-foreground mb-4 text-sm">No customers found matching "{searchQuery}".</p>
          )}


          {/* Customer Form or Details */}
          {showAddCustomer ? (
            <CustomerForm
              // --- UPDATE: Pass selectedCustomerObject for editing ---
              initialData={isEditing ? selectedCustomerObject : null}
              onCancel={handleCancelForm}
              onSuccess={handleSuccessForm} // Pass the updated function
            />
          ) : (
            // --- UPDATE: Show details using selectedCustomerObject ---
            selectedCustomerObject && <CustomerDetails customer={selectedCustomerObject} />
          )}
        </CardContent>
      </Card>

      {/* User Management Section */}
      {/* --- UPDATE: Conditionally render based on selectedCustomerObject --- */}
      {selectedCustomerObject && !showAddCustomer && (
        <Card className="enhanced-card">
          <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* --- UPDATE: Pass ID from selectedCustomerObject --- */}
            <UserList customerId={selectedCustomerObject.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
