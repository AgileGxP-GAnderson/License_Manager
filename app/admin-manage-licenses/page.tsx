"use client";

import React, { useState, useEffect, useCallback } from "react";
import debounce from 'lodash.debounce'; // Ensure lodash.debounce is installed
import { Search, ArrowBigDown } from "lucide-react"; // Existing icons
import { Input } from "@/components/ui/input";       // Existing component
import { Button } from "@/components/ui/button";     // Existing component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Existing component
import { useCustomerStore } from "@/lib/stores/customerStore"; // Existing store
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore"; // +++ Re-add Purchase Order store +++
import type { Customer, PurchaseOrder } from "@/lib/types"; // Existing type + Add PurchaseOrder type
import { toast } from "@/components/ui/use-toast"; // Existing component
// +++ Assuming PurchaseOrderList component exists at this path +++
// +++ Adjust if your component has a different name/path +++
import PurchaseOrderList from "@/components/purchase-order-list";

export default function AdminManageLicensesPage() {
  // --- Customer Store State & Actions ---
  const {
    selectedCustomer,
    fetchCustomerById,
    loading: isLoadingCustomer,
    error: customerError,
    clearSelectedCustomer
  } = useCustomerStore();

  // +++ Purchase Order Store State & Actions +++
  const {
    purchaseOrders,
    fetchPurchaseOrdersByCustomerId,
    loading: isLoadingPurchaseOrders,
    error: purchaseOrderError,
    // clearPurchaseOrders // Optional: Add if needed
  } = usePurchaseOrderStore();

  // --- Local UI State for Customer Search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- Async function to fetch customers for search ---
  const fetchCustomersSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]); setIsLoadingSearch(false); setSearchError(null); return;
    }
    setIsLoadingSearch(true); setSearchError(null);
    try {
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
      setSearchResults([]);
    } finally { setIsLoadingSearch(false); }
  }, []);

  // --- Debounced search function ---
  const debouncedSearch = useCallback(debounce(fetchCustomersSearch, 300), [fetchCustomersSearch]);

  // --- useEffect to trigger debounced search on query change ---
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]); setSearchError(null); debouncedSearch.cancel();
    }
    return () => { debouncedSearch.cancel(); };
  }, [searchQuery, debouncedSearch]);

  // --- Handle selecting a customer from search results ---
  const handleSelectCustomer = (customer: Customer) => {
    console.log("Selecting customer from search:", customer.id);
    fetchCustomerById(customer.id); // Update selectedCustomer in the store
    setSearchResults([]); setSearchQuery(""); setSearchError(null); // Clear search UI
  }

  // +++ useEffect to fetch Purchase Orders when selectedCustomer changes +++
  useEffect(() => {
    const customerId = selectedCustomer?.id;
    if (customerId) {
      console.log(`Fetching purchase orders for customer ${customerId}`);
      fetchPurchaseOrdersByCustomerId(customerId)
        .catch(error => {
          console.error(`Failed to fetch purchase orders for customer ${customerId}:`, error);
          toast({ variant: "destructive", title: "Error Loading Purchase Orders", description: error.message || "Could not load purchase orders." });
        });
    } else {
      // Optionally clear purchase orders if customer is deselected
      // usePurchaseOrderStore.setState({ purchaseOrders: [], error: null }); // Or add a clear action
      console.log("No customer selected, clearing/not fetching purchase orders.");
    }
  }, [selectedCustomer?.id, fetchPurchaseOrdersByCustomerId]); // Depend on selected customer ID

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Keep page title */}
      <h1 className="text-3xl font-bold text-brand-purple">Manage Licenses</h1>

      {/* --- Customer Search & Selection Card (Remains the same) --- */}
      <Card className="enhanced-card">
        <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          <CardTitle>Select Customer</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search Input & Clear Button */}
          <div className="flex items-center space-x-2 flex-1 mb-4">
            <div className="flex-1 max-w-sm relative">
              <Input
                placeholder="Search customers (min 2 chars)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
              />
              {isLoadingSearch && <ArrowBigDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin duration-500 text-muted-foreground" />}
            </div>
            {selectedCustomer && (
               <Button variant="outline" size="sm" onClick={clearSelectedCustomer} className="text-xs">Clear Selection</Button>
            )}
          </div>

          {/* Search Error Display */}
          {searchError && <p className="text-red-500 mb-4 text-sm">{searchError}</p>}

          {/* Search Results List */}
          {searchResults.length > 0 && (
            <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5 max-h-60 overflow-y-auto">
              <h3 className="font-medium mb-2 text-sm text-muted-foreground">Search Results</h3>
              <ul className="space-y-1">
                {searchResults.map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between p-2 hover:bg-brand-purple/10 rounded-md transition-colors text-sm">
                    <span>{customer.businessName} <span className="text-xs text-muted-foreground">({customer.contactName})</span></span>
                    <Button variant="ghost" size="sm" onClick={() => handleSelectCustomer(customer)} className="text-brand-purple hover:text-brand-purple hover:bg-brand-purple/10 h-7 px-2">
                      Select
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* No Results Message */}
          {!isLoadingSearch && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchError && (
             <p className="text-muted-foreground mb-4 text-sm">No customers found matching "{searchQuery}".</p>
          )}

          {/* Display Selected Customer Info */}
          {isLoadingCustomer && (
            <div className="mt-2 mb-4 p-2 border rounded bg-gray-100">
              <p className="text-muted-foreground text-sm">Loading customer details...</p>
            </div>
          )}
          {selectedCustomer && !isLoadingCustomer && (
            <div className="mt-2 mb-4 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
              {/* Changed title slightly to be more generic */}
              <h2 className="text-lg font-semibold text-gray-700">
                Current Customer: <span className="text-brand-purple">{selectedCustomer.businessName}</span>
              </h2>
            </div>
          )}
          {customerError && !isLoadingCustomer && (
             <div className="mt-2 mb-4 p-2 border rounded bg-red-100">
               <p className="text-red-700 text-sm">Error loading customer: {customerError}</p>
             </div>
          )}
        </CardContent>
      </Card>

      {/* --- Purchase Order Display Section --- */}
      {/* Conditionally render based on selected customer */}
      {selectedCustomer && !isLoadingCustomer && !customerError && (
        <Card className="enhanced-card">
          <CardHeader>
            {/* Title related to Purchase Orders */}
            <CardTitle>Purchase Orders for {selectedCustomer.businessName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Use purchase order loading state */}
            {isLoadingPurchaseOrders ? (
              <div className="flex items-center justify-center p-4">
                <ArrowBigDown className="h-6 w-6 animate-spin text-brand-purple" />
                <span className="ml-2">Loading purchase orders...</span>
              </div>
            // Use purchase order error state
            ) : purchaseOrderError ? (
              <p className="text-red-500">Error loading purchase orders: {purchaseOrderError}</p>
            // Render the PurchaseOrderList component (ensure it exists and path is correct)
            ) : (
              <PurchaseOrderList
                purchaseOrders={purchaseOrders} // Pass POs from the store
                isLoading={isLoadingPurchaseOrders} // Pass loading state if needed by component
                error={purchaseOrderError} // Pass error state if needed by component
                // Pass any other props needed by PurchaseOrderList
              />
            )}
          </CardContent>
        </Card>
      )}

       {/* Message when no customer is selected */}
       {!selectedCustomer && !isLoadingCustomer && !customerError && (
          <p className="text-center text-gray-500 mt-6">Please search for and select a customer above to view their purchase orders.</p>
       )}

    </div>
  );
}
