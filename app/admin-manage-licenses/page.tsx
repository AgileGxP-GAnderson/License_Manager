"use client"

import { useState, useEffect, useCallback } from "react"
// Removed Search import if not used
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store" // Assuming this is your combined store or customer store
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore" // Import the PO store
import { Customer } from "@/lib/types"
import CustomerDetails from "@/components/customer-details"
import PurchaseOrderList from "@/components/purchase-order-list"
import PurchaseOrderForm from "@/components/purchase-order-form"
import { debounce } from "lodash"

export default function AdministratorPage() {
  // --- Customer Store State ---
  const { currentCustomerId, setCurrentCustomer } = useStore() // Keep customer selection logic

  // --- Purchase Order Store State & Actions ---
  const {
    purchaseOrders,
    isLoadingPurchaseOrders,
    purchaseOrderError,
    fetchPurchaseOrdersByCustomerId,
    clearPurchaseOrders,
  } = usePurchaseOrderStore() // Use the dedicated PO store

  // --- Local Component State (for UI control, search, and customer details) ---
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [showAddPurchaseOrder, setShowAddPurchaseOrder] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [isLoadingCustomerDetails, setIsLoadingCustomerDetails] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // --- Function to Fetch Full Customer Details (remains mostly the same) ---
  const fetchCustomerDetails = useCallback(async (id: string) => {
    console.log(`Fetching full details for customer ID: ${id}`);
    setIsLoadingCustomerDetails(true);
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.error(`Customer with ID ${id} not found.`);
          setSelectedCustomerData(null);
          // Optionally clear the ID in the main store if it's invalid
          // if (id === currentCustomerId) { setCurrentCustomer(null); }
        } else {
          throw new Error(`Failed to fetch customer details (status: ${response.status}).`);
        }
      } else {
        const data: Customer = await response.json();
        setSelectedCustomerData(data);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setSelectedCustomerData(null);
    } finally {
      setIsLoadingCustomerDetails(false);
      setIsInitialLoading(false);
    }
  }, []); // Removed currentCustomerId dependency as it's read directly

  // --- Effect for Initial Load & currentCustomerId Changes ---
  useEffect(() => {
    if (currentCustomerId) {
      // Fetch customer details (local) AND purchase orders (via store)
      fetchCustomerDetails(currentCustomerId);
      fetchPurchaseOrdersByCustomerId(currentCustomerId); // Use store action
    } else {
      // No current customer ID, clear everything
      setSelectedCustomerData(null);
      clearPurchaseOrders(); // Use store action
      setIsLoadingCustomerDetails(false);
      setIsInitialLoading(false);
    }
    // Dependencies: ID change triggers both fetches (or clear)
  }, [currentCustomerId, fetchCustomerDetails, fetchPurchaseOrdersByCustomerId, clearPurchaseOrders]);

  // --- Customer Search Logic (remains the same) ---
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
    setCurrentCustomer(customerFromSearch.id); // Update store ID -> triggers useEffect
    setSearchResults([]);
    setSearchQuery("");
    setSearchError(null);
    setShowAddPurchaseOrder(false); // Reset PO form state
  };

  // --- Handle Successful Purchase Order Creation (from form) ---
  const handlePurchaseOrderSuccess = () => {
    setShowAddPurchaseOrder(false); // Close the form
    // No explicit refetch needed here, as the store's addPurchaseOrder action handles it
    console.log("Purchase order added/updated via store.");
  };

  // --- Data for Display ---
  const customerToDisplay = selectedCustomerData; // Use local state for customer details

  // --- Render Logic ---
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section (remains the same) */}
      <div className="flex justify-between items-start">
        {/* ... header content ... */}
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

      {/* Customer Search and Details Card (remains the same) */}
      <Card className="enhanced-card">
         {/* ... card header ... */}
        <CardContent className="pt-6">
          {/* Search Input (remains the same) */}
          {/* ... search input ... */}
          {/* Search Results List (remains the same) */}
          {/* ... search results ... */}
          {/* No Search Results Message (remains the same) */}
          {/* ... no results message ... */}
          {/* Customer Details Section (remains the same) */}
           {isLoadingCustomerDetails ? (
            <div className="text-center py-4">
              <p>Loading customer details...</p>
            </div>
          ) : customerToDisplay ? (
            <CustomerDetails customer={customerToDisplay} />
          ) : (
            !isInitialLoading && !searchQuery && (
              <p className="text-center py-4 text-muted-foreground">
                Search for a customer above to view details.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Card - Only shown when a customer is selected */}
      {customerToDisplay && (
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
            <CardTitle>Purchase Orders</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddPurchaseOrder(!showAddPurchaseOrder)}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
              // Disable button if customer details OR POs are loading
              disabled={isLoadingCustomerDetails || isLoadingPurchaseOrders}
            >
              {showAddPurchaseOrder ? "Cancel" : "Add Purchase Order"}
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {showAddPurchaseOrder ? (
              <PurchaseOrderForm
                customerId={customerToDisplay.id} // Pass customerId
                onCancel={() => setShowAddPurchaseOrder(false)}
                onSuccess={handlePurchaseOrderSuccess} // Callback on success
              />
            ) : (
              // Pass data and loading/error state directly from the PO store
              <PurchaseOrderList
                 // customerId={customerToDisplay.id} // No longer needed if list doesn't fetch
                 purchaseOrders={purchaseOrders} // From PO store
                 isLoading={isLoadingPurchaseOrders} // From PO store
                 error={purchaseOrderError} // From PO store
                 isAdminView={true}
                 // Pass delete/update actions if needed by the list component
                 // deletePurchaseOrder={usePurchaseOrderStore.getState().deletePurchaseOrder}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
