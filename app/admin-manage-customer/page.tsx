"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit, Loader2 } from "lucide-react";
import debounce from 'lodash.debounce';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store"; // Uses the updated store
import CustomerForm from "@/components/customer-form";
import CustomerDetails from "@/components/customer-details";
import UserList from "@/components/user-list"; // Import updated UserList
import type { Customer, User } from "@/lib/types"; // Import User type
import { toast } from "@/components/ui/use-toast";

export default function AdminManageCustomerPage() {
  // --- Select state and actions ---
  const customers = useStore((state) => state.customers);
  const currentCustomerId = useStore((state) => state.currentCustomerId);
  const setCurrentCustomer = useStore((state) => state.setCurrentCustomer);
  // --- Select the action (API fetch) ---
  const getUsersAction = useStore((state) => state.getUsers); // Renamed for clarity
  // --- Select the selector (state filter) ---
  const getUsersByCustomerIdSelector = useStore((state) => state.getUsersByCustomerId);
  // --- End selection ---

  const [selectedCustomerObject, setSelectedCustomerObject] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Effect to sync local state and fetch users based on currentCustomerId from store
  useEffect(() => {
    if (currentCustomerId) {
      if (selectedCustomerObject?.id === currentCustomerId) return;

      const customerFromStore = customers.find((c) => c.id === currentCustomerId);
      if (customerFromStore) {
        setSelectedCustomerObject(customerFromStore);

        // --- Call the action to fetch users ---
        if (getUsersAction) {
            setIsLoadingUsers(true);
            getUsersAction(currentCustomerId) // Call the action
              .catch(error => {
                 console.error(`Failed initial get users for customer ${currentCustomerId}:`, error);
                 toast({ variant: "destructive", title: "Error Loading Users", description: "Could not load users initially." });
              })
              .finally(() => setIsLoadingUsers(false));
        } else {
            console.error("Store action 'getUsers' not found!");
            toast({ variant: "destructive", title: "Configuration Error", description: "User loading function missing." });
        }
      } else {
        // ... handle customer not found ...
      }
    } else {
      setSelectedCustomerObject(null);
    }
    // Add the action to dependency array
  }, [currentCustomerId, customers, getUsersAction, selectedCustomerObject?.id, toast]);

  // Reset isEditing when showAddCustomer becomes false
  useEffect(() => {
    if (!showAddCustomer) {
      setIsEditing(false);
    }
  }, [showAddCustomer]);

  // Async function to fetch customers from API
  const fetchCustomers = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]); setIsLoadingSearch(false); return;
    }
    setIsLoadingSearch(true); setSearchError(null);
    try {
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

  // Debounced search function
  const debouncedSearch = useCallback(debounce(fetchCustomers, 300), [fetchCustomers]);

  // useEffect to trigger debounced search on query change
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]); setSearchError(null); debouncedSearch.cancel();
    }
    return () => { debouncedSearch.cancel(); };
  }, [searchQuery, debouncedSearch]);

  const handleSelectCustomer = async (customer: Customer) => {
    setCurrentCustomer(customer.id);
    setSelectedCustomerObject(customer);

    // Clear search UI
    setSearchResults([]);
    setSearchQuery("");
    setSearchError(null);
    setShowAddCustomer(false);
    setIsEditing(false);

    // --- Call the action to fetch users ---
    if (getUsersAction) {
        setIsLoadingUsers(true);
        try {
          await getUsersAction(customer.id); // Call the action
        } catch (error: any) {
          console.error(`[handleSelectCustomer] Failed to fetch users for customer ${customer.id}:`, error);
          toast({
            variant: "destructive",
            title: "Error Loading Users",
            description: error.message || "Could not load users for the selected customer.",
          });
        } finally {
          setIsLoadingUsers(false);
        }
    } else {
        console.error("Store action 'getUsers' not found!");
        toast({ variant: "destructive", title: "Configuration Error", description: "User loading function missing." });
    }
  }

  const handleEditClick = () => {
    if (selectedCustomerObject) {
      setIsEditing(true); setShowAddCustomer(true); setSearchResults([]); setSearchQuery("");
    }
  }

  const handleAddClick = () => {
    setIsEditing(false); setShowAddCustomer(true); setSearchResults([]); setSearchQuery("");
    setCurrentCustomer(null); setSelectedCustomerObject(null);
  }

  const handleCancelForm = () => {
    setShowAddCustomer(false); setIsEditing(false);
  }

  const handleSuccessForm = (updatedCustomer: Customer | null) => {
    if (updatedCustomer) {
        setSelectedCustomerObject(updatedCustomer); setCurrentCustomer(updatedCustomer.id);
    }
    setShowAddCustomer(false); setIsEditing(false);
  }

  // --- Use the selector to get the filtered list from the store state ---
  const usersForSelectedCustomer: User[] = selectedCustomerObject?.id
    ? getUsersByCustomerIdSelector(selectedCustomerObject.id) // Use the selector here
    : []; // Default to empty array if no customer selected

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-brand-purple">Manage Customer / User</h1>

      {/* Display Current Customer Name */}
      {selectedCustomerObject && (
        <div className="mt-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Current Customer: <span className="text-brand-purple">{selectedCustomerObject.businessName}</span>
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
            {/* Search Input */}
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 max-w-sm relative">
                <Input
                  placeholder="Search customers (min 2 chars)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                />
                {isLoadingSearch && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleEditClick} disabled={!selectedCustomerObject || showAddCustomer} className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple micro-interaction">
                <Edit className="mr-2 h-4 w-4" /> Edit Customer
              </Button>
              <Button onClick={handleAddClick} disabled={showAddCustomer} className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction">
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

          {/* Customer Form or Details */}
          {showAddCustomer ? (
            <CustomerForm
              initialData={isEditing ? selectedCustomerObject : null}
              onCancel={handleCancelForm}
              onSuccess={handleSuccessForm}
            />
          ) : (
            selectedCustomerObject && <CustomerDetails customer={selectedCustomerObject} />
          )}
        </CardContent>
      </Card>

      {/* --- User Management Section --- */}
      {selectedCustomerObject && !showAddCustomer && (
        <Card className="enhanced-card">
          <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
              // --- Pass the filtered list obtained via selector to UserList ---
              <UserList
                 users={usersForSelectedCustomer} // Pass the filtered array
                 customerId={selectedCustomerObject.id} // Pass customerId for the form
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
