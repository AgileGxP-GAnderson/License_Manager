"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { Customer} from "@/lib/types"
import CustomerDetails from "@/components/customer-details"
import PurchaseOrderList from "@/components/purchase-order-list"
import PurchaseOrderForm from "@/components/purchase-order-form"
import { debounce } from "lodash" // You may need to install this

export default function AdministratorPage() {
  // Get store state and subscribe to changes
  const { customers, currentCustomerId, setCurrentCustomer } = useStore()

  // Local state to hold the full data of the *most recently selected* customer
  // This will now also hold the customer fetched on initial load if needed
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null);

  // Find customer from the main store list (for persistence/initial load)
  const storeCustomer = currentCustomerId ? customers.find((c) => c.id === currentCustomerId) : null

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [showAddPurchaseOrder, setShowAddPurchaseOrder] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false) // Renamed for clarity
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); // For loading full details
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For initial customer load

  // --- NEW: useEffect to fetch initial customer data if needed ---
  useEffect(() => {
    const fetchInitialCustomer = async (id: string) => {
      // Check if we already found the customer in the store's list
      const customerFromStore = customers.find(c => c.id === id);
      if (customerFromStore) {
        // Ensure store version has all details, otherwise fetch anyway
        if (customerFromStore.email && customerFromStore.addressLine1) { // Check for essential details
           setSelectedCustomerData(customerFromStore);
           setIsInitialLoading(false);
           return;
        }
      }

      console.log(`Initial/incomplete customer ID ${id}, fetching full details...`);
      setIsLoadingDetails(true); // Indicate details loading
      try {
        const response = await fetch(`/api/customers/${id}`); // Use the specific customer API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch initial customer details.");
        }
        const data: Customer = await response.json();
        setSelectedCustomerData(data);
      } catch (error) {
        console.error("Error fetching initial customer:", error);
        // Optionally clear the invalid ID from the store
        // setCurrentCustomer(null);
      } finally {
        setIsLoadingDetails(false);
        setIsInitialLoading(false);
      }
    };

    if (currentCustomerId) {
      fetchInitialCustomer(currentCustomerId);
    } else {
      // No initial customer ID
      setIsInitialLoading(false);
    }
  }, [currentCustomerId, customers]); // Rerun if ID changes or customers list updates

  // --- Existing fetchCustomers for search remains the same ---
  const fetchCustomers = useCallback(async (query: string) => {
    // ... (fetchCustomers implementation remains the same) ...
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    try {
      const response = await fetch(`/api/customers?businessName=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
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

  // --- Existing debouncedSearch and useEffect for search remain the same ---
  const debouncedSearch = useCallback(
    debounce((query: string) => { fetchCustomers(query); }, 300),
    [fetchCustomers]
  );

  useEffect(() => {
    // ... (search useEffect implementation remains the same) ...
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
    return () => { debouncedSearch.cancel(); };
  }, [searchQuery, debouncedSearch]);

  // --- MODIFIED: handleSelectCustomer to fetch full details ---
  const handleSelectCustomer = async (customerFromSearch: Customer) => {
    console.log("Selecting customer from search:", customerFromSearch);

    // 1. Update store ID
    setCurrentCustomer(customerFromSearch.id);

    // 2. Immediately set local state with potentially partial data for top display
    setSelectedCustomerData(customerFromSearch);

    // 3. Clear search UI
    setSearchResults([]);
    setSearchQuery("");
    setSearchError(null);

    // 4. Check if we already have full details (e.g., email, address)
    if (customerFromSearch.email && customerFromSearch.addressLine1) {
      console.log("Search result already has full details.");
      return; // No need to fetch again
    }

    // 5. Fetch full details asynchronously
    console.log("Fetching full details for selected customer:", customerFromSearch.id);
    setIsLoadingDetails(true); // Show loading indicator for details section
    try {
      const response = await fetch(`/api/customers/${customerFromSearch.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch full customer details after selection.");
      }
      const fullCustomerData: Customer = await response.json();
      setSelectedCustomerData(fullCustomerData); // Update local state with full data
      console.log("Successfully fetched and set full customer details:", fullCustomerData);
    } catch (error) {
      console.error("Error fetching full customer details:", error);
      // Keep the partial data for now, maybe show an error message near CustomerDetails
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // --- Existing useEffect to sync local state with store changes remains the same ---
  // This effect might need slight adjustment if fetchInitialCustomer runs later
  useEffect(() => {
    if (currentCustomerId) {
      const customerFromStore = customers.find(c => c.id === currentCustomerId);
      // Only update local state if customerFromStore is found AND
      // it's different from what's already selected (or nothing is selected yet)
      if (customerFromStore && customerFromStore.id !== selectedCustomerData?.id) {
         setSelectedCustomerData(customerFromStore);
      }
    } else if (!isInitialLoading) { // Avoid clearing if we are still loading the initial customer
       setSelectedCustomerData(null);
    }
  }, [currentCustomerId, customers, selectedCustomerData, isInitialLoading]);


  // Determine which customer data to display (prioritize local selection/fetch)
  // Use selectedCustomerData directly now as it holds both search selections and initial fetches
  const customerToDisplay = selectedCustomerData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-brand-purple">License Manager - Administrator Portal</h1>
          {/* Display based on initial loading state and customerToDisplay */}
          {isInitialLoading ? (
             <div className="mt-2 p-3 border rounded bg-gray-100 border-gray-200">
               <p className="text-muted-foreground">Loading customer...</p>
             </div>
          ) : customerToDisplay ? (
            <div className="mt-2 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
              <p className="text-lg">
                Current Customer: <span className="font-semibold">{customerToDisplay.businessName || customerToDisplay.name}</span>
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
              <div className="flex-1 max-w-sm relative">
                <Input
                  placeholder="Type to search customers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSearchError(null)
                  }}
                  className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                />
                {isLoadingSearch && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-brand-purple border-opacity-50 border-t-brand-purple rounded-full"></div>
                  </div>
                )}
              </div>
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
                    <span>{customer.businessName || customer.name}</span>
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

          {searchQuery.trim().length >= 2 && !isLoadingSearch && searchResults.length === 0 && (
            <div className="mb-6 border rounded-md p-4 border-brand-purple/20 bg-brand-purple/5">
              <p className="text-center text-muted-foreground">No customers found matching "{searchQuery}"</p>
            </div>
          )}

          {isLoadingDetails ? (
            <div className="text-center py-4">
              <p>Loading customer details...</p>
              {/* Optional spinner */}
            </div>
          ) : customerToDisplay ? (
            // Ensure CustomerDetails receives the correct prop
            <CustomerDetails customer={customerToDisplay} />
          ) : (
            !isInitialLoading && !searchQuery && ( // Show only if not loading initially and not searching
              <p className="text-center py-4 text-muted-foreground">
                Search for a customer above or select one if previously chosen.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {customerToDisplay && (
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
                customerId={customerToDisplay.id} // Use ID from customerToDisplay
                onCancel={() => setShowAddPurchaseOrder(false)}
                onSuccess={() => setShowAddPurchaseOrder(false)}
              />
            ) : (
              <PurchaseOrderList customerId={customerToDisplay.id} isAdminView={true} /> // Use ID from customerToDisplay
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
