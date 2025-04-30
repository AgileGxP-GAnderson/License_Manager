import { create } from 'zustand';
import { PurchaseOrder, PurchaseOrderInput, License } from '@/lib/types'; // Adjust path and types as needed
import { addYears } from 'date-fns'; // Needed for activateLicense

// --- Combined State and Actions Interface ---
interface PurchaseOrderStoreState {
  // State
  purchaseOrders: PurchaseOrder[];
  isLoadingPurchaseOrders: boolean;
  purchaseOrderError: string | null;

  // Actions for Purchase Orders
  fetchPurchaseOrdersByCustomerId: (customerId: string) => Promise<void>;
  addPurchaseOrder: (poData: PurchaseOrderInput) => Promise<PurchaseOrder | null>;
  updatePurchaseOrder: (poId: string, poData: Partial<PurchaseOrderInput>) => Promise<PurchaseOrder | null>;
  deletePurchaseOrder: (poId: string) => Promise<boolean>;
  setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
  clearPurchaseOrders: () => void;
  isPONameUnique: (poNumber: string) => boolean; // Added helper
  getPurchaseOrdersByCustomerId: (customerId: string) => PurchaseOrder[]; // Added selector

  // --- Actions for Licenses within Purchase Orders ---
  updateLicense: (poId: string, licenseIndex: number, licenseData: Partial<License>) => Promise<void>; // Added API call
  activateLicense: (poId: string, licenseIndex: number) => Promise<void>; // Added API call
  requestLicenseActivation: (poId: string, licenseIndex: number, serverId: string) => Promise<void>; // Added API call
  deactivateLicense: (poId: string, licenseIndex: number) => Promise<void>; // Added API call
}

// --- Initial State ---
const initialState = {
  purchaseOrders: [],
  isLoadingPurchaseOrders: false,
  purchaseOrderError: null,
};

// --- Store Creator ---
export const usePurchaseOrderStore = create<PurchaseOrderStoreState>()(
  (set, get) => ({
    // --- Initial State ---
    ...initialState,

    // --- Actions Implementation ---

    setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),

    clearPurchaseOrders: () => set({ purchaseOrders: [], purchaseOrderError: null, isLoadingPurchaseOrders: false }),

    fetchPurchaseOrdersByCustomerId: async (customerId) => {
      if (!customerId) {
        set({ purchaseOrders: [], isLoadingPurchaseOrders: false, purchaseOrderError: null });
        return;
      }
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        // Assuming API endpoint exists and returns POs for a customer
        const response = await fetch(`/api/purchaseOrders?customerId=${customerId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to fetch purchase orders (${response.status})` }));
          throw new Error(errorData.message || `Failed to fetch purchase orders (${response.status})`);
        }
        const data: PurchaseOrder[] = await response.json();
        // Process dates after fetching
        const processedData = data.map(po => ({
            ...po,
            purchaseDate: new Date(po.purchaseDate),
            licenses: po.licenses?.map(lic => ({
                ...lic,
                activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
            }))
        }));
        set({ purchaseOrders: processedData, isLoadingPurchaseOrders: false });
      } catch (error: any) {
        console.error("Error fetching purchase orders:", error);
        set({ purchaseOrderError: error.message || 'Failed to fetch purchase orders', isLoadingPurchaseOrders: false, purchaseOrders: [] });
      }
    },

    addPurchaseOrder: async (poData) => {
      if (!poData.customerId) {
          const errorMsg = "Cannot add purchase order: Customer ID is missing.";
          console.error(errorMsg);
          set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
          return null;
      }
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        // Prepare payload, converting dates to strings if needed by API
        const apiPayload = {
            ...poData,
            purchaseDate: typeof poData.purchaseDate === 'string' ? poData.purchaseDate : poData.purchaseDate.toISOString(),
            licenses: poData.licenses?.map(lic => ({
                ...lic,
                activationDate: lic.activationDate ? (typeof lic.activationDate === 'string' ? lic.activationDate : lic.activationDate.toISOString()) : null,
                expirationDate: lic.expirationDate ? (typeof lic.expirationDate === 'string' ? lic.expirationDate : lic.expirationDate.toISOString()) : null,
            }))
        };

        const response = await fetch('/api/purchaseOrders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to add purchase order (${response.status})` }));
          throw new Error(errorData.message || `Failed to add purchase order (${response.status})`);
        }
        const newPurchaseOrder: PurchaseOrder = await response.json();
        // Process dates from API response
        const processedPO = {
            ...newPurchaseOrder,
            purchaseDate: new Date(newPurchaseOrder.purchaseDate),
            licenses: newPurchaseOrder?.licenses?.map(lic => ({
                ...lic,
                activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
            }))
        };
        set((state) => ({
          purchaseOrders: [...state.purchaseOrders, processedPO],
          isLoadingPurchaseOrders: false,
        }));
        return processedPO;
      } catch (error: any) {
        console.error("Error adding purchase order:", error);
        set({ purchaseOrderError: error.message || 'Failed to add purchase order', isLoadingPurchaseOrders: false });
        return null;
      }
    },

    updatePurchaseOrder: async (poId, poData) => {
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
         // Prepare payload, converting dates to strings if needed by API
         const apiPayload = {
            ...poData,
            // Only include dates if they are part of the update data
            ...(poData.purchaseDate && { purchaseDate: typeof poData.purchaseDate === 'string' ? poData.purchaseDate : poData.purchaseDate.toISOString() }),
            ...(poData.licenses && { licenses: poData.licenses.map(lic => ({
                ...lic,
                activationDate: lic.activationDate ? (typeof lic.activationDate === 'string' ? lic.activationDate : lic.activationDate.toISOString()) : null,
                expirationDate: lic.expirationDate ? (typeof lic.expirationDate === 'string' ? lic.expirationDate : lic.expirationDate.toISOString()) : null,
            }))})
         };

        const response = await fetch(`/api/purchaseOrders/${poId}`, {
          method: 'PUT', // Or PATCH
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to update purchase order (${response.status})` }));
          throw new Error(errorData.message || `Failed to update purchase order (${response.status})`);
        }
        const updatedPurchaseOrder: PurchaseOrder = await response.json();
        // Process dates from API response
        const processedPO = {
            ...updatedPurchaseOrder,
            purchaseDate: new Date(updatedPurchaseOrder.purchaseDate),
            licenses: updatedPurchaseOrder?.licenses?.map(lic => ({
                ...lic,
                activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
            }))
        };
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === processedPO.id ? processedPO : po
          ),
          isLoadingPurchaseOrders: false,
        }));
        return processedPO;
      } catch (error: any) {
        console.error("Error updating purchase order:", error);
        set({ purchaseOrderError: error.message || 'Failed to update purchase order', isLoadingPurchaseOrders: false });
        return null;
      }
    },

    deletePurchaseOrder: async (poId) => {
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const response = await fetch(`/api/purchaseOrders/${poId}`, {
          method: 'DELETE',
        });
        if (!response.ok && response.status !== 204) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to delete purchase order' }));
          throw new Error(errorData.message || `Failed to delete purchase order (${response.status})`);
        }
        set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== poId),
          isLoadingPurchaseOrders: false,
        }));
        return true;
      } catch (error: any) {
        console.error("Error deleting purchase order:", error);
        set({ purchaseOrderError: error.message || 'Failed to delete purchase order', isLoadingPurchaseOrders: false });
        return false;
      }
    },

    // --- Helper ---
    isPONameUnique: (poNumber: string) => {
        const { purchaseOrders } = get();
        return !purchaseOrders.some((po) => po.poName === poNumber);
    },

    // --- Selector ---
    getPurchaseOrdersByCustomerId: (customerId: string) => {
        const { purchaseOrders } = get();
        return purchaseOrders.filter((po) => String(po.customerId) === String(customerId)); // Ensure consistent comparison
    },

    // --- License Actions Implementation ---

    updateLicense: async (poId: string, licenseIndex: number, licenseData: Partial<License>) => {
        const originalPOs = get().purchaseOrders;
        const poIndex = originalPOs.findIndex(p => p.id === poId);
        if (poIndex === -1 || !originalPOs[poIndex].licenses || licenseIndex < 0 || licenseIndex >= originalPOs[poIndex].licenses!.length) {
            const errorMsg = "Purchase Order or License not found for update.";
            console.error(errorMsg);
            set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
            return;
        }

        // Optimistic Update
        const updatedPOsOptimistic = [...originalPOs];
        const updatedLicensesOptimistic = [...updatedPOsOptimistic[poIndex].licenses!];
        // Ensure dates are Date objects locally
        const updatedLicenseData = {
            ...updatedLicensesOptimistic[licenseIndex],
            ...licenseData,
            activationDate: licenseData.activationDate ? new Date(licenseData.activationDate) : updatedLicensesOptimistic[licenseIndex].activationDate,
            expirationDate: licenseData.expirationDate ? new Date(licenseData.expirationDate) : updatedLicensesOptimistic[licenseIndex].expirationDate,
        };
        updatedLicensesOptimistic[licenseIndex] = updatedLicenseData;
        updatedPOsOptimistic[poIndex] = { ...updatedPOsOptimistic[poIndex], licenses: updatedLicensesOptimistic };
        set({ purchaseOrders: updatedPOsOptimistic, isLoadingPurchaseOrders: true, purchaseOrderError: null });

        try {
            // Prepare payload for API (convert dates back to strings if needed)
            const apiPayload = {
                ...licenseData,
                activationDate: licenseData.activationDate ? new Date(licenseData.activationDate).toISOString() : undefined,
                expirationDate: licenseData.expirationDate ? new Date(licenseData.expirationDate).toISOString() : undefined,
            };

            // API Call - Assuming endpoint like PATCH /api/purchaseOrders/{poId}/licenses/{licenseIndex}
            const response = await fetch(`/api/purchaseOrders/${poId}/licenses/${licenseIndex}`, {
                method: 'PATCH', // Or PUT
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update license via API');
            }

            // API Success: Refetch the updated PO for consistency
            const updatedPOResponse = await fetch(`/api/purchaseOrders/${poId}`);
            if (!updatedPOResponse.ok) throw new Error('Failed to refetch PO after license update');
            const updatedPO: PurchaseOrder = await updatedPOResponse.json();
            // Process dates from API response
            const processedPO = {
                ...updatedPO,
                purchaseDate: new Date(updatedPO.purchaseDate),
                licenses: updatedPO?.licenses?.map(lic => ({
                    ...lic,
                    activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                    expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
                }))
            };

            set(state => ({
                purchaseOrders: state.purchaseOrders.map(p => p.id === poId ? processedPO : p),
                isLoadingPurchaseOrders: false,
                purchaseOrderError: null
            }));

        } catch (error) {
            let errorMessage = 'An unknown error occurred during license update.';
            if (error instanceof Error) { errorMessage = error.message; }
            console.error("Error updating license:", errorMessage, error);
            // Rollback optimistic update on error
            set({ purchaseOrders: originalPOs, purchaseOrderError: errorMessage, isLoadingPurchaseOrders: false });
        }
    },

    activateLicense: async (poId: string, licenseIndex: number) => {
      const originalPOs = get().purchaseOrders;
      const poIndex = originalPOs.findIndex(p => p.id === poId);
      if (poIndex === -1 || !originalPOs[poIndex].licenses || licenseIndex < 0 || licenseIndex >= originalPOs[poIndex].licenses!.length) {
        const errorMsg = "Purchase Order or License not found for activation.";
        console.error(errorMsg);
        set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
        return;
      }

      const licenseToUpdate = originalPOs[poIndex].licenses![licenseIndex];
      if (licenseToUpdate.status !== 'Activation Requested') {
        const errorMsg = "License not in 'Activation Requested' state.";
        console.warn(errorMsg);
        set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
        return;
      }
      // Removed server/fingerprint check - assuming API handles this validation

      // Optimistic Update
      const now = new Date();
      let expirationDate: Date | null = null;
      if (licenseToUpdate.duration !== "Perpetual") {
        const durationYears = Number.parseInt(licenseToUpdate.duration.split(" ")[0]);
        if (!isNaN(durationYears)) {
           expirationDate = addYears(now, durationYears);
        }
      }
      const updatedPOsOptimistic = [...originalPOs];
      const updatedLicensesOptimistic = [...updatedPOsOptimistic[poIndex].licenses!];
      updatedLicensesOptimistic[licenseIndex] = {
        ...licenseToUpdate,
        status: 'Activated',
        activationDate: now,
        expirationDate: expirationDate,
      };
      updatedPOsOptimistic[poIndex] = { ...updatedPOsOptimistic[poIndex], licenses: updatedLicensesOptimistic };
      set({ purchaseOrders: updatedPOsOptimistic, isLoadingPurchaseOrders: true, purchaseOrderError: null });

      try {
        // API Call - Assuming endpoint like POST /api/purchaseOrders/{poId}/licenses/{licenseIndex}/activate
        const response = await fetch(`/api/purchaseOrders/${poId}/licenses/${licenseIndex}/activate`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to activate license via API');
        }

        // API Success: Refetch the updated PO for consistency
        const updatedPOResponse = await fetch(`/api/purchaseOrders/${poId}`);
        if (!updatedPOResponse.ok) throw new Error('Failed to refetch PO after activation');
        const updatedPO: PurchaseOrder = await updatedPOResponse.json();
        // Process dates
        const processedPO = {
            ...updatedPO,
            purchaseDate: new Date(updatedPO.purchaseDate),
            licenses: updatedPO?.licenses?.map(lic => ({
                ...lic,
                activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
            }))
        };

        set(state => ({
          purchaseOrders: state.purchaseOrders.map(p => p.id === poId ? processedPO : p),
          isLoadingPurchaseOrders: false,
          purchaseOrderError: null
        }));

      } catch (error) {
        let errorMessage = 'An unknown error occurred during license activation.';
        if (error instanceof Error) { errorMessage = error.message; }
        console.error("Error activating license:", errorMessage, error);
        // Rollback optimistic update on error
        set({ purchaseOrders: originalPOs, purchaseOrderError: errorMessage, isLoadingPurchaseOrders: false });
      }
    },

    requestLicenseActivation: async (poId: string, licenseIndex: number, serverId: string) => {
       const originalPOs = get().purchaseOrders;
       const poIndex = originalPOs.findIndex(p => p.id === poId);
       if (poIndex === -1 || !originalPOs[poIndex].licenses || licenseIndex < 0 || licenseIndex >= originalPOs[poIndex].licenses!.length) {
         const errorMsg = "Purchase Order or License not found for activation request.";
         console.error(errorMsg);
         set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
         return;
       }
       const licenseToUpdate = originalPOs[poIndex].licenses![licenseIndex];
       if (licenseToUpdate.status === 'Activated' || licenseToUpdate.status === 'Activation Requested') {
          const errorMsg = `License already ${licenseToUpdate.status}.`;
          console.warn(errorMsg);
          set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
          return;
       }
       if (!serverId) {
          const errorMsg = "Server ID is required to request activation.";
          console.error(errorMsg);
          set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
          return;
       }

       // Optimistic update
       const updatedPOsOptimistic = [...originalPOs];
       const updatedLicensesOptimistic = [...updatedPOsOptimistic[poIndex].licenses!];
       updatedLicensesOptimistic[licenseIndex] = { ...licenseToUpdate, status: 'Activation Requested', serverId: serverId };
       updatedPOsOptimistic[poIndex] = { ...updatedPOsOptimistic[poIndex], licenses: updatedLicensesOptimistic };
       set({ purchaseOrders: updatedPOsOptimistic, isLoadingPurchaseOrders: true, purchaseOrderError: null });

       try {
          // API Call - Assuming endpoint like POST /api/purchaseOrders/{poId}/licenses/{licenseIndex}/request-activation
          const response = await fetch(`/api/purchaseOrders/${poId}/licenses/${licenseIndex}/request-activation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ serverId }),
          });
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || 'Failed to request license activation via API');
          }
          // Refetch PO
          const updatedPOResponse = await fetch(`/api/purchaseOrders/${poId}`);
          if (!updatedPOResponse.ok) throw new Error('Failed to refetch PO after request');
          const updatedPO: PurchaseOrder = await updatedPOResponse.json();
          // Process dates
          const processedPO = {
              ...updatedPO,
              purchaseDate: new Date(updatedPO.purchaseDate),
              licenses: updatedPO?.licenses?.map(lic => ({
                  ...lic,
                  activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                  expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
              }))
          };
          set(state => ({
              purchaseOrders: state.purchaseOrders.map(p => p.id === poId ? processedPO : p),
              isLoadingPurchaseOrders: false,
              purchaseOrderError: null
          }));

       } catch (error) {
          let errorMessage = 'Failed to request license activation.';
          if (error instanceof Error) { errorMessage = error.message; }
          console.error("Error requesting license activation:", errorMessage, error);
          // Rollback optimistic update
          set({ purchaseOrders: originalPOs, purchaseOrderError: errorMessage, isLoadingPurchaseOrders: false });
       }
    },

    deactivateLicense: async (poId: string, licenseIndex: number) => {
        const originalPOs = get().purchaseOrders;
        const poIndex = originalPOs.findIndex(p => p.id === poId);
        if (poIndex === -1 || !originalPOs[poIndex].licenses || licenseIndex < 0 || licenseIndex >= originalPOs[poIndex].licenses!.length) {
          const errorMsg = "Purchase Order or License not found for deactivation.";
          console.error(errorMsg);
          set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
          return;
        }

        const licenseToUpdate = originalPOs[poIndex].licenses![licenseIndex];
        if (licenseToUpdate.status !== 'Activated' && licenseToUpdate.status !== 'Activation Requested') {
            const errorMsg = `License is not in a state that can be deactivated (current: ${licenseToUpdate.status}).`;
            console.warn(errorMsg);
            set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
            return;
        }

        // Optimistic Update
        const updatedPOsOptimistic = [...originalPOs];
        const updatedLicensesOptimistic = [...updatedPOsOptimistic[poIndex].licenses!];
        updatedLicensesOptimistic[licenseIndex] = {
            ...licenseToUpdate,
            status: 'Available',
            serverId: undefined,
            activationDate: undefined,
            expirationDate: null,
        };
        updatedPOsOptimistic[poIndex] = { ...updatedPOsOptimistic[poIndex], licenses: updatedLicensesOptimistic };
        set({ purchaseOrders: updatedPOsOptimistic, isLoadingPurchaseOrders: true, purchaseOrderError: null });

        try {
            // API Call - Assuming endpoint like POST /api/purchaseOrders/{poId}/licenses/{licenseIndex}/deactivate
            const response = await fetch(`/api/purchaseOrders/${poId}/licenses/${licenseIndex}/deactivate`, {
                method: 'POST', // Or DELETE?
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to deactivate license via API');
            }

            // Refetch PO
            const updatedPOResponse = await fetch(`/api/purchaseOrders/${poId}`);
            if (!updatedPOResponse.ok) throw new Error('Failed to refetch PO after deactivation');
            const updatedPO: PurchaseOrder = await updatedPOResponse.json();
            // Process dates
            const processedPO = {
                ...updatedPO,
                purchaseDate: new Date(updatedPO.purchaseDate),
                licenses: updatedPO?.licenses?.map(lic => ({
                    ...lic,
                    activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
                    expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
                }))
            };
            set(state => ({
                purchaseOrders: state.purchaseOrders.map(p => p.id === poId ? processedPO : p),
                isLoadingPurchaseOrders: false,
                purchaseOrderError: null
            }));

        } catch (error) {
            let errorMessage = 'Failed to deactivate license.';
            if (error instanceof Error) { errorMessage = error.message; }
            console.error("Error deactivating license:", errorMessage, error);
            // Rollback optimistic update
            set({ purchaseOrders: originalPOs, purchaseOrderError: errorMessage, isLoadingPurchaseOrders: false });
        }
    },

  })
);