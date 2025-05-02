"use client"; // Ensure this is a Client Component

import React, { useState, useEffect } from "react"; // Import React here
// --- Remove the old store import ---
// import { useStore } from "@/lib/store";
// +++ Import the new stores +++
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore";
import { useServerStore } from "@/lib/stores/serverStore";
// +++ Import the customer store (assuming it's separate now) +++
import { useCustomerStore } from "@/lib/stores/customerStore"; // Adjust path if needed

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Server } from 'lucide-react'
// +++ Import specific types from types.ts +++
import { Customer, PurchaseOrder, Server as ServerType } from "@/lib/types" // Rename Server to ServerType to avoid conflict
import ServerRegistrationModal from "@/components/server-registration-modal"
import ServerSelectionModal from "@/components/server-selection-modal"
import LicenseDownloadModal from "@/components/license-download-modal"
import LicenseDeactivationModal from "@/components/license-deactivation-modal"
import Link from "next/link"
import { assert } from "console";


export default function CustomerPortal() {
  // --- Get state/actions from the customer store ---
  const {
    selectedCustomer: customer, // Assuming selectedCustomer holds the full object now
    isLoading: customerLoading, // Assuming isLoading is for customer loading
    error: customerError,       // Assuming error is for customer loading
    fetchCustomerById,         // Assuming this action exists
  } = useCustomerStore();

  // --- Get state/actions from the purchase order store ---
  const {
    purchaseOrders: allPurchaseOrders, // Get all POs from the store
    isLoadingPurchaseOrders,          // Loading state for POs
    purchaseOrderError,               // Error state for POs
    fetchPurchaseOrdersByCustomerId,  // Action to fetch POs
    getPurchaseOrdersByCustomerId,    // Selector to filter POs (if needed, or filter manually)
    updateLicense,                    // Action to update a license
    // Add other PO actions if used (e.g., activateLicense, requestLicenseActivation)
  } = usePurchaseOrderStore();

  // --- Get state/actions from the server store ---
  const {
    servers: allServers, // Get all servers from the store
    isLoadingServers,     // Loading state for servers
    serverError,          // Error state for servers
    fetchServersByCustomerId, // Action to fetch servers
    getServersByCustomerId,   // Selector to filter servers (if needed, or filter manually)
    getServerById,          // Selector to get a specific server
    createServer,              // Action to add a server
  } = useServerStore();


  // --- Local state for UI ---
  // No longer need local customer, isLoading, error state if using store's state directly
  // const [customer, setCustomer] = useState<Customer | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // State for filtered data (if not using selectors directly in JSX)
  const [customerPurchaseOrders, setCustomerPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [customerServers, setCustomerServers] = useState<ServerType[]>([]) // Use renamed ServerType

  // Modal states remain the same
  const [serverRegistrationModal, setServerRegistrationModal] = useState(false)
  const [serverSelectionModal, setServerSelectionModal] = useState({
    isOpen: false,
    poId: "",
    licenseIndex: -1,
  })
  const [licenseDownloadModal, setLicenseDownloadModal] = useState(false)
  const [licenseDeactivationModal, setLicenseDeactivationModal] = useState(false)
  const [activatedLicenses, setActivatedLicenses] = useState<Record<string, boolean>>({})

  // --- useEffect to fetch data when customer ID changes ---
  useEffect(() => {
    // Assuming currentCustomerId is managed elsewhere or passed as prop/context
    // If customer object is directly available from useCustomerStore, use its ID
    const customerId = customer?.id; // Use ID from the selected customer object

    if (customerId) {
      // Fetch data using actions from respective stores
      fetchPurchaseOrdersByCustomerId(customerId);
      fetchServersByCustomerId(customerId);
    } else {
      // Clear local filtered data if no customer is selected
      setCustomerPurchaseOrders([]);
      setCustomerServers([]);
      // Optionally clear store data if needed via actions like clearPurchaseOrders(), clearServers()
    }
  }, [customer, fetchPurchaseOrdersByCustomerId, fetchServersByCustomerId]); // Depend on customer object and fetch actions

  // --- useEffect to update local filtered state when store data changes ---
  useEffect(() => {
    console.log("Data filter useEffect triggered. Customer:", customer?.id);
    console.log("allServers:", allServers);
    console.log("allPurchaseOrders:", allPurchaseOrders);

    if (customer?.id) {
      // Filter Servers
      const filteredServers = allServers.filter(srv => {
        console.log(`Filtering server ID ${srv.id}, customerId: ${srv.customerId}, Comparing with: ${customer.id}`);
        return String(srv.customerId) === String(customer.id);
      });
      console.log("Filtered servers:", filteredServers);
      setCustomerServers(filteredServers);

      // +++ Filter Purchase Orders +++
      const filteredPOs = allPurchaseOrders.filter(po => {
         console.log(`Filtering PO ID ${po.id}, customerId: ${po.customerId}, Comparing with: ${customer.id}`);
         return String(po.customerId) === String(customer.id);
      });
      console.log("Filtered POs:", filteredPOs);
      setCustomerPurchaseOrders(filteredPOs);

    } else {
      console.log("No customer ID, clearing local lists.");
      setCustomerPurchaseOrders([]); // Clear POs
      setCustomerServers([]);      // Clear Servers
    }
    // Dependencies remain the same
  }, [customer, allPurchaseOrders, allServers]);


  // --- Modal Handlers ---
  const openServerSelectionModal = (poId: string, licenseIndex: number) => {
    setServerSelectionModal({
      isOpen: true,
      poId,
      licenseIndex,
    })
  }

  const closeServerSelectionModal = () => {
    setServerSelectionModal({
      isOpen: false,
      poId: "",
      licenseIndex: -1,
    })
  }

  // --- Server Registration ---
  const handleServerRegistration = async (name: string, fingerprint: string) => {
    if (customer?.id) {
      const customerIdNum = parseInt(customer.id, 10); // Convert string ID to number

      if (isNaN(customerIdNum)) {
          console.error("Cannot register server: Invalid Customer ID format.");
          // Optionally set an error state for the UI
          return; // Stop if ID is not a valid number
      }

      // Pass customerId as the first argument, server data as the second
      await createServer(
        customerIdNum, // First argument (now number)
        {             // Second argument
          customerId: customerIdNum, // Pass customer ID (now number)
          name,
          fingerprint,
          isActive: true
        }
      );
      // Refetching/state update is handled by the store or useEffects
    } else {
        console.error("Cannot register server: Customer ID is missing.");
        // Optionally set an error state for the UI
    }
  }

  // --- Activation Request ---
  const handleActivationRequest = async (serverId: string) => { // Make async if updateLicense is async
    const { poId, licenseIndex } = serverSelectionModal
    if (poId && licenseIndex >= 0 && customer?.id) { // Check customer ID
      const now = new Date()
      let expirationDate: Date | null = null

      // Find the correct PO and license from the filtered local state
      const po = customerPurchaseOrders.find((p) => String(p.id) === String(poId));
      const license = po?.licenses?.[licenseIndex];

      // Use totalDuration if available, otherwise fallback logic might be needed
      if (license && license.totalDuration && license.totalDuration !== 100 /* perpetualDurationValue */) {
        // Assuming totalDuration is in years
        expirationDate = new Date(now);
        expirationDate.setFullYear(expirationDate.getFullYear() + license.totalDuration);
      }

      // Call updateLicense from the purchase order store
      await updateLicense(poId, licenseIndex, { // Await if it returns a promise
        // Assuming updateLicense handles status, dates, serverId based on ledger logic or API response
        // Pass only necessary info if updateLicense triggers backend logic
        serverId: serverId, // Pass serverId for association
        // status: "Activated", // Status might be set by backend/store logic
        // activationDate: now,
        // expirationDate: expirationDate,
      });

      // Mark license as activated locally for UI feedback
      setActivatedLicenses((prev) => ({
        ...prev,
        [`${poId}-${licenseIndex}`]: true,
      }));

      // Close the modal
      closeServerSelectionModal();

      // Data refresh is handled by useEffect reacting to store changes.
    }
  }

  // --- Helper to check for activated licenses ---
  const hasActivatedLicenses = () => {
    // Check the filtered purchase orders
    return customerPurchaseOrders.some((po) => po.licenses?.some((license) => license.status === "Activated"));
  }

  // --- Render Logic ---

  // Use loading states from stores
  if (customerLoading || isLoadingPurchaseOrders || isLoadingServers) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p>Loading data...</p>
        {/* Optional: Add a spinner */}
      </div>
    );
  }

  // Use error states from stores
  const combinedError = customerError || purchaseOrderError || serverError;
  if (combinedError) {
     return (
      <div className="container mx-auto py-6 text-center text-red-600">
        <p>Error loading data: {combinedError}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-purple">Customer Portal - License Manager</h1>
        {/* Display customer info if loaded */}
        {customer ? (
          <div className="mt-2 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
            <p className="text-lg">
              Current Customer: <span className="font-semibold">{customer.businessName}</span>
            </p>
          </div>
        ) : (
           <p className="text-muted-foreground mt-2">No customer selected or loaded.</p>
        )}
      </div>

      {/* Show content only if a customer is loaded */}
      {customer ? (
        <>
          {/* Customer Info Card - Uses 'customer' directly */}
          <Card className="enhanced-card">
            {/* ... CardHeader ... */}
            <CardContent className="pt-6">
              {/* ... grid displaying customer details ... */}
            </CardContent>
          </Card>

          {/* Licenses Card - Uses 'customerPurchaseOrders' */}
          <Card className="enhanced-card">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
              <CardTitle>Your Licenses</CardTitle>
              {/* ... Buttons (Deactivate, Download) ... */}
            </CardHeader>
            <CardContent className="pt-6">
              {customerPurchaseOrders.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">You don't have any licenses yet.</p>
              ) : (
                <div>
                  <Table>
                    <TableHeader className="bg-brand-purple/5">
                      {/* ... TableHead ... */}
                    </TableHeader>
                    <TableBody>{customerPurchaseOrders.flatMap((po) =>
                        po.licenses?.map((license: any, licenseIndex: number) => ( // Add type safety for license if possible
                          <React.Fragment key={`${po.id}-${license.id || licenseIndex}`}> {/* Use license.id if available, fallback to index */}
                            <TableRow className="hover:bg-brand-purple/5">
                              {/* Use license.type?.name */}
                              <TableCell>{license.type?.name ?? 'Unknown Type'}</TableCell>
                              <TableCell>
                                {/* Use license.status and license.lastActionName */}
                                <Badge
                                  variant={
                                    license.status === "Activated" ? "default" :
                                    license.status === "Activation Requested" ? "outline" :
                                    license.status === "Expired" ? "destructive" :
                                    "secondary"
                                  }
                                >
                                  {license.lastActionName || license.status || 'N/A'}
                                </Badge>
                              </TableCell>
                              {/* Use license.totalDuration */}
                              <TableCell>{license.totalDuration === 100 ? 'Perpetual' : `${license.totalDuration} Year(s)`}</TableCell>
                              {/* Use license.activationDate */}
                              <TableCell>
                                {license.activationDate
                                  ? format(new Date(license.activationDate), "PPP")
                                  : "Not activated"}
                              </TableCell>
                              {/* Use license.expirationDate */}
                              <TableCell>
                                {license.type?.name === "Perpetual" // Check type name
                                  ? "Perpetual"
                                  : license.expirationDate
                                    ? format(new Date(license.expirationDate), "PPP")
                                    : "Not set"}
                              </TableCell>
                              {/* Use license.latestServerName */}
                              <TableCell>{license.latestServerName ?? "None"}</TableCell>
                              <TableCell>
                                {/* Use license.status for button logic */}
                                {license.status === "Available" && (
                                  <Button
                                    size="sm"
                                    onClick={() => openServerSelectionModal(String(po.id), licenseIndex)} // Ensure po.id is string
                                    className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction"
                                  >
                                    Request Activation
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {/* ... Activated license message row (if any) ... */}
                          </React.Fragment>
                        )),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Servers Card - Uses 'customerServers' */}
          <Card className="enhanced-card">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
              <CardTitle>Your Servers</CardTitle>
              <Button
                size="sm"
                onClick={() => setServerRegistrationModal(true)}
                className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Server
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Use customerServers */}
              {customerServers.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">You haven't registered any servers yet.</p>
              ) : (
                <Table>
                  <TableHeader className="bg-brand-purple/5">
                    {/* ... TableHead ... */}
                  </TableHeader>
                  <TableBody>
                    {/* Use customerServers */}
                    {customerServers.map((server) => (
                      <TableRow key={server.id} className="hover:bg-brand-purple/5">
                         <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Server className="h-4 w-4 mr-2 text-brand-purple" />
                            {server.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {server.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            {server.fingerprint}
                          </div>
                        </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Modals - Pass customer.id */}
          <ServerRegistrationModal
            isOpen={serverRegistrationModal}
            onClose={() => setServerRegistrationModal(false)}
            onSubmit={handleServerRegistration}
          />

          <ServerSelectionModal
            isOpen={serverSelectionModal.isOpen}
            onClose={closeServerSelectionModal}
            onSubmit={handleActivationRequest}
            customerId={customer.id || ""} // Pass customer ID
          />

          <LicenseDownloadModal
            isOpen={licenseDownloadModal}
            onClose={() => setLicenseDownloadModal(false)}
            customerId={customer.id || ""} // Pass customer ID
          />

          <LicenseDeactivationModal
            isOpen={licenseDeactivationModal}
            onClose={() => setLicenseDeactivationModal(false)}
            customerId={customer.id || ""} // Pass customer ID
          />
        </>
      ) : (
        // No customer selected view
        <Card className="enhanced-card">
            {/* ... No customer message and link ... */}
        </Card>
      )}
    </div>
  );
}
