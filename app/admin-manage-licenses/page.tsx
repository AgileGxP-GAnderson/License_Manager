"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { Customer } from "@/lib/types" // Assuming PurchaseOrder is part of Customer type or fetched with it
import CustomerDetails from "@/components/customer-details"
import PurchaseOrderList from "@/components/purchase-order-list"
import PurchaseOrderForm from "@/components/purchase-order-form"
import { debounce } from "lodash" // Ensure lodash is installed: npm install lodash @types/lodash

export default function AdministratorPage() {
  // --- Store State ---
  // We can only READ customers, READ currentCustomerId, and SET currentCustomerId
  const { customers, currentCustomerId, setCurrentCustomer } = useStore()

  // --- Local Component State ---
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null); // Holds full data for display
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [showAddPurchaseOrder, setShowAddPurchaseOrder] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Loading indicator for the details/PO section
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Tracks initial page load state

  // --- Function to Fetch Full Customer Details ---
  const fetchCustomerDetails = useCallback(async (id: string) => {
    console.log(`Fetching full details for customer ID: ${id}`);
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        // Handle specific errors like 404
        if (response.status === 404) {
          console.error(`Customer with ID ${id} not found.`);
          // Optionally clear the invalid ID from the store if it came from there
          if (id === currentCustomerId) {
             // We can't directly remove, but setting to null might be appropriate
             // setCurrentCustomer(null); // Decide if this is desired behavior
          }
          setSelectedCustomerData(null); // Clear local display data
        } else {
          throw new Error(`Failed to fetch customer details (status: ${response.status}).`);
        }
      } else {
        const data: Customer = await response.json();
        setSelectedCustomerData(data); // Update local state with full data
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setSelectedCustomerData(null); // Clear data on error
      // Optionally show a user-facing error message
    } finally {
      setIsLoadingDetails(false);
      // Initial loading is done once we attempt the first fetch (or determine none is needed)
      setIsInitialLoading(false);
    }
  }, [currentCustomerId]); // Include currentCustomerId if logic inside depends on it (e.g., clearing store ID)

  // --- Effect for Initial Load & currentCustomerId Changes ---
  useEffect(() => {
    if (currentCustomerId) {
      // Check store first for *sufficiently detailed* data
      const customerFromStore = customers.find(c => c.id === currentCustomerId);
      // Define what "sufficiently detailed" means (e.g., includes purchaseOrders array)
      if (customerFromStore?.purchaseOrders && customerFromStore?.contactEmail) {
        console.log("Using sufficiently detailed customer from store:", currentCustomerId);
        setSelectedCustomerData(customerFromStore);
        setIsLoadingDetails(false); // Not loading from API
        setIsInitialLoading(false); // Initial load complete
      } else {
        // Fetch from API if not in store or not detailed enough
        fetchCustomerDetails(currentCustomerId);
      }
    } else {
      // No current customer ID in store
      setSelectedCustomerData(null);
      setIsLoadingDetails(false);
      setIsInitialLoading(false); // Initial load complete (no customer to load)
    }
    // This effect depends on the ID changing and potentially the customers list
    // if we want to react to store updates providing sufficient detail later.
  }, [currentCustomerId, customers, fetchCustomerDetails]);

  // --- Customer Search Logic (remains largely the same) ---
  const fetchCustomersSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    try {
      // Assuming the search endpoint returns basic customer info (id, name)
      const response = await fetch(`/api/customers?businessName=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data: Customer[] = await response.json(); // Expecting basic Customer data
      setSearchResults(data);
      setSearchError(null);
    } catch (error: any) {
      console.error('Error searching customers:', error);
      setSearchError(error.message || "Failed to search customers");
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => { fetchCustomersSearch(query); }, 300),
    [fetchCustomersSearch]
  );

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
    return () => { debouncedSearch.cancel(); };
  }, [searchQuery, debouncedSearch]);

  // --- Handle Selecting a Customer from Search Results ---
  const handleSelectCustomer = (customerFromSearch: Customer) => {
    console.log("Selecting customer from search:", customerFromSearch.id);

    // 1. Update store ID - This triggers the main useEffect to fetch/display
    setCurrentCustomer(customerFromSearch.id);

    // 2. Clear search UI
    setSearchResults([]);
    setSearchQuery("");
    setSearchError(null);

    // 3. Reset PO form state if it was open
    setShowAddPurchaseOrder(false);

    // The main useEffect will now handle fetching details based on the new currentCustomerId
  };

  // --- Handle Successful Purchase Order Creation ---
  const handlePurchaseOrderSuccess = () => {
    setShowAddPurchaseOrder(false); // Close the form
    // Re-fetch the current customer's details to include the new PO
    if (selectedCustomerData?.id) {
      console.log("Refreshing customer data after PO add...");
      fetchCustomerDetails(selectedCustomerData.id);
    } else {
       console.warn("Cannot refresh customer data: No customer selected.");
    }
  };

  // --- Data for Display ---
  // Always use the local state which is updated by fetches/store checks
  const customerToDisplay = selectedCustomerData;

  // --- Render Logic ---
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-brand-purple">Administrator Portal - License Manager</h1>
          {isInitialLoading ? (
             <div className="mt-2 p-3 border rounded bg-gray-100 border-gray-200">
               <p className="text-muted-foreground">Loading initial customer state...</p>
             </div>
          ) : customerToDisplay ? (
            <div className="mt-2 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
              <p className="text-lg">
                Current Customer: <span className="font-semibold">{customerToDisplay.businessName}</span>
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-2">No customer selected</p>
          )}
        </div>
      </div>

      {/* Customer Search and Details Card */}
      <Card className="enhanced-card">
        <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search Input */}
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 max-w-sm relative">
                <Input
                  placeholder="Type to search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                />
                {/* Search Loading Spinner */}
                {isLoadingSearch && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-brand-purple border-opacity-50 border-t-brand-purple rounded-full"></div>
                  </div>
                )}
              </div>
              {searchError && <span className="text-red-500 ml-2">{searchError}</span>}
            </div>
          </div>

          {/* Search Results List */}
          {searchResults.length > 0 && (
            <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5">
              <h3 className="font-medium mb-2">Search Results</h3>
              <ul className="space-y-2">
                {searchResults.map((customer) => (
                  <li
                    key={customer.id}
                    className="flex items-center justify-between p-2 hover:bg-brand-purple/5 rounded-md transition-colors"
                  >
                    <span>{customer.businessName}</span>
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

          {/* No Search Results Message */}
          {searchQuery.trim().length >= 2 && !isLoadingSearch && searchResults.length === 0 && (
             <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5">
               <p className="text-center text-muted-foreground">No customers found matching "{searchQuery}"</p>
             </div>
           )}

          {/* Customer Details Section */}
          {isLoadingDetails ? (
            <div className="text-center py-4">
              <p>Loading customer details...</p>
              {/* You could add a spinner component here */}
            </div>
          ) : customerToDisplay ? (
            <CustomerDetails customer={customerToDisplay} />
          ) : (
            // Show placeholder only if not initial loading and not actively searching
            !isInitialLoading && !searchQuery && (
              <p className="text-center py-4 text-muted-foreground">
                Search for a customer above to view details.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Card - Only shown when a customer is selected and details are NOT loading */}
      {!isLoadingDetails && customerToDisplay && (
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
                customerId={customerToDisplay.id}
                onCancel={() => setShowAddPurchaseOrder(false)}
                onSuccess={handlePurchaseOrderSuccess} // Use handler to refresh data
              />
            ) : (
              // Pass the customerId and potentially the POs if already fetched
              // Assuming PurchaseOrderList fetches its own data if not provided
              <PurchaseOrderList
                 customerId={customerToDisplay.id}
                 initialPurchaseOrders={customerToDisplay.purchaseOrders} // Pass fetched POs
                 isAdminView={true}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
