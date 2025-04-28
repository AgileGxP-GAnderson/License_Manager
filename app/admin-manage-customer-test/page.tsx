"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Edit, Loader2 } from "lucide-react";
import debounce from 'lodash.debounce';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerStore } from "@/lib/stores/customerStore";
import { useUserStore } from "@/lib/stores/userStore";
import CustomerForm from "@/components/customer-form";
import CustomerDetails from "@/components/customer-details";
import UserList from "@/components/user-list";
import type { Customer, User } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

export default function AdminManageCustomerPage() {
  // --- Select state and actions from Customer Store ---
  const {
    selectedCustomer,
    loading: customerLoading,
    error: customerError,
    fetchCustomerById,
    clearSelectedCustomer, // <-- Select the action directly
  } = useCustomerStore(state => ({
    selectedCustomer: state.selectedCustomer,
    loading: state.loading,
    error: state.error,
    fetchCustomerById: state.fetchCustomerById,
    clearSelectedCustomer: state.clearSelectedCustomer, // <-- Select the action directly from the store state
  }));

  // --- Select state and actions from User Store ---
  const {
    users: allUsers,
    loading: userLoading,
    error: userError,
    fetchUsersByCustomerId,
  } = useUserStore(state => ({
    users: state.users,
    loading: state.loading,
    error: state.error,
    // Ensure this matches the actual action name in userStore
    fetchUsersByCustomerId: state.fetchUsersByCustomerId,
  }));

  // --- Local UI State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false); // Keep local search loading separate

  // --- Derived State ---
  const usersForSelectedCustomer = useMemo(() => {
    if (!selectedCustomer?.id) return [];
    // Filter users based on the selected customer ID from the store
    return allUsers.filter(user => user.customerId === selectedCustomer.id); // Adjust property name if needed
  }, [selectedCustomer?.id, allUsers]);

  // --- Effects ---

  // Fetch users when the selected customer changes
  useEffect(() => {
    const customerId = selectedCustomer?.id;
    if (customerId && fetchUsersByCustomerId) {
      console.log(`Effect: Fetching users for customer ${customerId}`);
      fetchUsersByCustomerId(customerId)
        .catch(error => {
           console.error(`Failed to fetch users for customer ${customerId}:`, error);
           // Error is now handled by reading userStore.error, but toast can remain
           toast({ variant: "destructive", title: "Error Loading Users", description: error.message || "Could not load users." });
        });
    }
    // If customerId is cleared, the users list will naturally become empty via useMemo
  }, [selectedCustomer?.id, fetchUsersByCustomerId]);

  // Reset isEditing when form is hidden
  useEffect(() => {
    if (!showAddCustomer) {
      setIsEditing(false);
    }
  }, [showAddCustomer]);

  // --- Local Search Functionality (can be moved to store later if needed) ---
  const fetchCustomersForSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]); setIsLoadingSearch(false); return;
    }
    setIsLoadingSearch(true); setSearchError(null);
    try {
      // Use the same API endpoint as before
      const response = await fetch(`/api/customers?businessName=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data: Customer[] = await response.json();
      setSearchResults(data);
    } catch (error: any) {
      console.error('Error searching customers:', error);
      setSearchError(error.message || "Failed to search customers");
      setSearchResults([]);
    } finally { setIsLoadingSearch(false); }
  }, []);

  const debouncedSearch = useCallback(debounce(fetchCustomersForSearch, 300), [fetchCustomersForSearch]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]); setSearchError(null); debouncedSearch.cancel();
    }
    return () => { debouncedSearch.cancel(); };
  }, [searchQuery, debouncedSearch]);

  // --- Event Handlers ---
  const handleSelectCustomer = (customer: Customer) => {
    console.log(`Selecting customer: ${customer.id}`);
    fetchCustomerById(customer.id); // Fetch details and set selectedCustomer in store

    // Clear search UI, hide forms etc.
    setSearchResults([]); setSearchQuery(""); setSearchError(null);
    setShowAddCustomer(false); setIsEditing(false);
  }

  const handleEditClick = () => {
    if (selectedCustomer) { // Check store state
      setIsEditing(true); setShowAddCustomer(true);
      setSearchResults([]); setSearchQuery(""); // Clear search
    }
  }

  const handleAddClick = () => {
    setIsEditing(false); setShowAddCustomer(true);
    setSearchResults([]); setSearchQuery(""); // Clear search
    clearSelectedCustomer(); // <-- This now correctly calls the action selected from the store
  }

  const handleCancelForm = () => {
    setShowAddCustomer(false); setIsEditing(false);
    // No need to clear selection here unless intended
  }

  const handleSuccessForm = (customerData: Customer | null) => {
    // After add/edit, fetch the definitive data to ensure store is up-to-date
    if (customerData?.id) {
        console.log(`Form success, fetching updated customer: ${customerData.id}`);
        fetchCustomerById(customerData.id);
    } else {
        // If adding resulted in null (shouldn't happen ideally), clear selection
        clearSelectedCustomer();
    }
    setShowAddCustomer(false); setIsEditing(false);
  }

  // --- Render Logic ---
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-brand-purple">Manage Customer / User</h1>

      {/* Display Current Customer Name from Store */}
      {selectedCustomer && !showAddCustomer && ( // Show only if selected and form is hidden
        <div className="mt-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Current Customer: <span className="text-brand-purple">{selectedCustomer.businessName}</span>
          </h2>
        </div>
      )}

      {/* Customer Management Card */}
      <Card className="enhanced-card">
        <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search and Action Buttons */}
          <div className="flex items-center justify-between mb-6 gap-2">
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 max-w-sm relative">
                <Input
                  placeholder="Search customers (min 2 chars)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                  disabled={customerLoading} // Disable search while customer store is busy
                />
                {isLoadingSearch && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleEditClick} disabled={!selectedCustomer || showAddCustomer || customerLoading} className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple micro-interaction">
                <Edit className="mr-2 h-4 w-4" /> Edit Customer
              </Button>
              <Button onClick={handleAddClick} disabled={showAddCustomer || customerLoading} className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </div>
          </div>

          {/* Search Results or Error */}
          {searchError && <p className="text-red-500 mb-4 text-sm">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5">
              <h3 className="font-medium mb-2">Search Results</h3>
              <ul className="space-y-2">
                {searchResults.map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between p-2 hover:bg-brand-purple/5 rounded-md transition-colors">
                    <span>{customer.businessName} ({customer.contactName})</span>
                    <Button variant="ghost" size="sm" onClick={() => handleSelectCustomer(customer)} className="text-brand-purple hover:text-brand-purple hover:bg-brand-purple/10">
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

          {/* Loading/Error from Customer Store */}
          {customerLoading && !isLoadingSearch && <p className="text-blue-500 mb-4">Loading customer data...</p>}
          {customerError && <p className="text-red-500 mb-4">Customer Error: {customerError}</p>}

          {/* Customer Form or Details */}
          {showAddCustomer ? (
            <CustomerForm
              // Pass selectedCustomer from store for editing
              initialData={isEditing ? selectedCustomer : null}
              onCancel={handleCancelForm}
              onSuccess={handleSuccessForm}
            />
          ) : (
            // Show details if a customer is selected in the store
            selectedCustomer && <CustomerDetails customer={selectedCustomer} />
          )}
        </CardContent>
      </Card>

      {/* User Management Section */}
      {/* Show UserList only when a customer is selected and form is hidden */}
      {selectedCustomer && !showAddCustomer && (
        <Card className="enhanced-card mt-6">
          <CardHeader>
             <CardTitle>Manage Users for: {selectedCustomer.businessName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Loading/Error from User Store */}
            {userLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : userError ? (
               <p className="text-red-500">User Error: {userError}</p>
            ) : (
              <UserList
                 users={usersForSelectedCustomer} // Pass the memoized list
                 customerId={selectedCustomer.id} // Pass the ID
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
