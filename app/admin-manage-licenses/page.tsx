"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { useStore } from "@/lib/store" // --- REMOVE / COMMENT OUT ---
import { useCustomerStore } from "@/lib/stores/customerStore" // Use Customer Store
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore"
import { Customer } from "@/lib/types"
import CustomerDetails from "@/components/customer-details"
import PurchaseOrderList from "@/components/purchase-order-list"
import PurchaseOrderForm from "@/components/purchase-order-form"
import { debounce } from "lodash"

export default function AdministratorPage() {
  // --- Customer Store State ---
  // const { currentCustomerId, setCurrentCustomer } = useStore() // --- REMOVE / COMMENT OUT ---
  const {
    selectedCustomer,      // +++ USE THIS +++
    fetchCustomerById,     // +++ USE THIS +++
    loading: isLoadingCustomer, // +++ USE THIS (renamed to avoid conflict) +++
    error: customerError,       // +++ USE THIS (renamed to avoid conflict) +++
    clearSelectedCustomer  // +++ USE THIS +++
  } = useCustomerStore()

  // --- Purchase Order Store State & Actions ---
  const {
    purchaseOrders,
    isLoadingPurchaseOrders,
    purchaseOrderError,
    fetchPurchaseOrdersByCustomerId,
    clearPurchaseOrders,
  } = usePurchaseOrderStore()

  // --- Local Component State (for UI control and search ONLY) ---
  // const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null); // --- REMOVE ---
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [showAddPurchaseOrder, setShowAddPurchaseOrder] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  // const [isLoadingCustomerDetails, setIsLoadingCustomerDetails] = useState(false); // --- REMOVE ---
  // const [isInitialLoading, setIsInitialLoading] = useState(true); // --- REMOVE (Store handles loading state) ---

  // --- Function to Fetch Full Customer Details ---
  // const fetchCustomerDetails = useCallback(async (id: string) => { ... }, []); // --- REMOVE ---

  // --- Effect for Purchase Order Fetching (depends on selectedCustomer) ---
  useEffect(() => {
    // Fetch/clear POs when the selected customer (from the store) changes
    if (selectedCustomer?.id) {
      console.log(`Selected customer changed to ${selectedCustomer.id}, fetching POs...`);
      fetchPurchaseOrdersByCustomerId(selectedCustomer.id);
    } else {
      console.log("No selected customer, clearing POs...");
      clearPurchaseOrders();
    }
    // This effect depends on the selected customer object and PO actions
  }, [selectedCustomer, fetchPurchaseOrdersByCustomerId, clearPurchaseOrders]);

  // --- Customer Search Logic (remains the same - direct fetch) ---
  const fetchCustomersSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    try {
      const response = await fetch(`/api/customers?businessName=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data: Customer[] = await response.json();
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
    // Call the store action to fetch the customer by ID
    fetchCustomerById(customerFromSearch.id); // +++ USE THIS +++
    // Clear search UI
    setSearchResults([]);
    setSearchQuery("");
    setSearchError(null);
    setShowAddPurchaseOrder(false);
  };

  // --- Handle Successful Purchase Order Creation (remains the same) ---
  const handlePurchaseOrderSuccess = () => {
    setShowAddPurchaseOrder(false);
    console.log("Purchase order added/updated via store.");
  };

  // --- Data for Display ---
  const customerToDisplay = selectedCustomer; // +++ Use directly from store +++

  // --- Render Logic ---
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        {/* ... header title ... */}
         {/* Use isLoadingCustomer for initial/loading state */}
         {isLoadingCustomer && (
             <div className="mt-2 p-3 border rounded bg-gray-100 border-gray-200">
               <p className="text-muted-foreground">Loading customer...</p>
             </div>
          )}
          {/* Display customer name once loaded */}
          {customerToDisplay && !isLoadingCustomer && ( // Ensure not loading before showing name
            <div className="mt-2 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
              <p className="text-lg">
                Current Customer: <span className="font-semibold">{customerToDisplay.businessName}</span>
              </p>
            </div>
          )}
          {/* Handle fetch error */}
          {customerError && !isLoadingCustomer && (
             <div className="mt-2 p-3 border rounded bg-red-100 border-red-200">
               <p className="text-red-700">Error loading customer: {customerError}</p>
             </div>
          )}
          {/* Handle case where no customer is selected and not loading/error */}
          {!customerToDisplay && !isLoadingCustomer && !customerError && (
            <p className="text-muted-foreground mt-2">No customer selected</p>
          )}
      </div>

      {/* Customer Search and Details Card */}
      <Card className="enhanced-card">
         {/* ... card header ... */}
        <CardContent className="pt-6">
          {/* Search Input (remains the same) */}
          {/* ... search input ... */}
          {/* Search Results List (remains the same) */}
          {/* ... search results ... */}
          {/* No Search Results Message (remains the same) */}
          {/* ... no results message ... */}

          {/* Customer Details Section - Use store state */}
           {isLoadingCustomer ? ( // Use store's loading state
            <div className="text-center py-4">
              <p>Loading customer details...</p>
            </div>
          ) : customerToDisplay ? ( // Use store's selected customer
            <CustomerDetails customer={customerToDisplay} />
          ) : customerError ? ( // Use store's error state
             <p className="text-center py-4 text-red-600">
                Error loading customer details: {customerError}
             </p>
          ) : (
            !searchQuery && ( // Show prompt only if not loading/error and no search query
              <p className="text-center py-4 text-muted-foreground">
                Search for a customer above to view details.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Card - Only shown when a customer is successfully loaded */}
      {customerToDisplay && !isLoadingCustomer && !customerError && ( // Only show if customer data is available and no error/loading
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
            <CardTitle>Purchase Orders</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddPurchaseOrder(!showAddPurchaseOrder)}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
              // Disable button if customer OR POs are loading
              disabled={isLoadingCustomer || isLoadingPurchaseOrders}
            >
              {showAddPurchaseOrder ? "Cancel" : "Add Purchase Order"}
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {showAddPurchaseOrder ? (
              <PurchaseOrderForm
                customerId={customerToDisplay.id} // Pass customerId from store object
                onCancel={() => setShowAddPurchaseOrder(false)}
                onSuccess={handlePurchaseOrderSuccess}
              />
            ) : (
              <PurchaseOrderList
                 purchaseOrders={purchaseOrders}
                 isLoading={isLoadingPurchaseOrders}
                 error={purchaseOrderError}
                 isAdminView={true}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
