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
import { useToast } from "@/components/ui/use-toast";
import ServerRegistrationModal from "@/components/server-registration-modal"
import ServerSelectionModal from "@/components/server-selection-modal"
import LicenseDownloadModal from "@/components/license-download-modal"
import LicenseDeactivationModal from "@/components/license-deactivation-modal"
import Link from "next/link"
import { assert } from "console";
import { useLicenseStore } from "@/lib/stores/licenseStore";

export default function CustomerPortal() {
  const { toast } = useToast();
  
  // --- Get state/actions from the customer store ---
  const {
    selectedCustomer: customer,
    loading: customerLoading,
    error: customerError,
    fetchCustomerById,
  } = useCustomerStore();

  // --- Get state/actions from the purchase order store ---
  const {
    purchaseOrders: allPurchaseOrders, // Get all POs from the store
    isLoadingPurchaseOrders,          // Loading state for POs
    purchaseOrderError,               // Error state for POs
    fetchPurchaseOrdersByCustomerId,  // Action to fetch POs
    getPurchaseOrdersByCustomerId,    // Selector to filter POs (if needed, or filter manually)
    // Add other PO actions if used (e.g., activateLicense, requestLicenseActivation)
  } = usePurchaseOrderStore();

  // --- Get state/actions from the license store ---
  const {
    licenses,
    pendingChanges,
    isLoadingLicenses,
    licenseError,
    updateLicense,
    activateLicense,
    deactivateLicense,
    hasUnsavedChanges,
    saveChanges,
    discardChanges,
  } = useLicenseStore();

  // --- Get state/actions from the server store ---
  const {
    servers: allServers,
    loading: isLoadingServers,
    error: serverError,
    fetchServersByCustomerId,
    getServerById,
    createServer,
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
    const customerId = customer?.id;

    if (customerId) {
      console.log("Fetching data for customer:", customerId);
      fetchPurchaseOrdersByCustomerId(customerId);
      fetchServersByCustomerId(customerId);
    } else {
      console.log("No customer ID, clearing local lists");
      setCustomerPurchaseOrders([]);
      setCustomerServers([]);
    }
  }, [customer?.id, fetchPurchaseOrdersByCustomerId, fetchServersByCustomerId]);

  // --- useEffect to update local filtered state when store data changes ---
  useEffect(() => {
    console.log("Data filter useEffect triggered.");
    console.log("allPurchaseOrders:", allPurchaseOrders);
    console.log("allServers:", allServers);

    if (customer?.id) {
      // Filter Purchase Orders
      const filteredPOs = allPurchaseOrders.filter(po => {
        const matches = String(po.customerId) === String(customer.id);
        console.log(`PO ${po.id}: Customer ID match? ${matches}`);
        return matches;
      });
      console.log("Filtered POs:", filteredPOs);
      setCustomerPurchaseOrders(filteredPOs);

      // Filter Servers
      const filteredServers = allServers.filter(srv => {
        const matches = String(srv.customerId) === String(customer.id);
        console.log(`Server ${srv.id}: Customer ID match? ${matches}`);
        return matches;
      });
      console.log("Filtered servers:", filteredServers);
      setCustomerServers(filteredServers);
    } else {
      console.log("No customer ID, clearing local lists");
      setCustomerPurchaseOrders([]);
      setCustomerServers([]);
    }
  }, [customer?.id, allPurchaseOrders, allServers]);

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
  const handleServerRegistration = async (name: string, fingerprint: string, description?: string) => { // Add description parameter
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
          description, // Pass description
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
      
      // Find the license ID from the PO
      const license = po?.licenses?.[licenseIndex];
      if (!license?.id) {
        console.error("Cannot update license: License ID not found");
        return;
      }

      // Call updateLicense with all required parameters
      await updateLicense(
        license.id,
        poId,
        {
          status: "Activation Requested",
          latestServerName: customerServers.find(s => s.id.toString() === serverId)?.name
        },
        2, // Assuming 2 is the action type ID for activation request
        "License activation requested" // Optional comment
      );

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

  // --- Add save changes handler ---
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges()) return;

    const success = await saveChanges();
    if (success) {
      toast({
        title: "Changes saved",
        description: "All license changes have been saved successfully.",
      });
      // Optionally refresh data
      if (customer?.id) {
        fetchPurchaseOrdersByCustomerId(customer.id);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error saving changes",
        description: "There was a problem saving your changes. Please try again.",
      });
    }
  };

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
                    <TableBody>
                      {customerPurchaseOrders.flatMap((po: PurchaseOrder) =>
                        po.licenses?.map((license, licenseIndex) => (
                          <React.Fragment key={`${po.id}-${license.id || licenseIndex}`}>
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
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Server Fingerprint</TableHead>
                    </TableRow>
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
                        <TableCell>
                          {server.description || "N/A"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {server.fingerprint ? 
                            (typeof server.fingerprint === 'string' ? server.fingerprint : Buffer.from(server.fingerprint as any).toString('hex')) 
                            : 'N/A'}
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

          {/* Add Save Changes button when there are pending changes */}
          {hasUnsavedChanges() && (
            <div className="fixed bottom-4 right-4 flex gap-2">
              <Button
                variant="outline"
                onClick={discardChanges}
                className="bg-red-50 hover:bg-red-100"
              >
                Discard Changes
              </Button>
              <Button
                onClick={handleSaveChanges}
                className="bg-brand-purple hover:bg-brand-purple/90"
              >
                Save Changes
              </Button>
            </div>
          )}
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
