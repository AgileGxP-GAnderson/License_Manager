import { create } from 'zustand';
import { PurchaseOrder, PurchaseOrderInput, LicenseInput } from '@/lib/types';

interface PurchaseOrderStoreState {
  purchaseOrders: PurchaseOrder[];
  isLoadingPurchaseOrders: boolean;
  purchaseOrderError: string | null;

  fetchPurchaseOrdersByCustomerId: (customerId: string) => Promise<void>;
  addPurchaseOrder: (poData: PurchaseOrderInput) => Promise<PurchaseOrder | null>;
  updatePurchaseOrder: (poId: string, poData: Partial<PurchaseOrderInput>) => Promise<PurchaseOrder | null>;
  deletePurchaseOrder: (poId: string) => Promise<boolean>;

  addLicenseToPurchaseOrder: (licenseData: Pick<LicenseInput, 'poId' | 'typeId' | 'duration' | 'externalName'>) => Promise<boolean>;

  setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
  clearPurchaseOrders: () => void;
  isPONameUnique: (poNumber: string) => boolean;
  getPurchaseOrdersByCustomerId: (customerId: string) => PurchaseOrder[];
}

const initialState = {
  purchaseOrders: [],
  isLoadingPurchaseOrders: false,
  purchaseOrderError: null,
};

export const usePurchaseOrderStore = create<PurchaseOrderStoreState>()(
  (set, get) => ({
    ...initialState,

    setPurchaseOrders: (purchaseOrders) => set({
      purchaseOrders: purchaseOrders.map(po => ({
        ...po,
        purchaseDate: po.purchaseDate ? new Date(po.purchaseDate) : new Date(),
        licenses: po.licenses?.map(lic => ({
          ...lic,
          activationDate: lic.activationDate ? new Date(lic.activationDate) : null,
          expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
        })) ?? []
      })),
      isLoadingPurchaseOrders: false,
      purchaseOrderError: null
    }),

    clearPurchaseOrders: () => set({ ...initialState }),

    fetchPurchaseOrdersByCustomerId: async (customerId) => {
      if (!customerId) {
        set({ purchaseOrders: [], isLoadingPurchaseOrders: false, purchaseOrderError: null });
        return;
      }

      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const response = await fetch(`/api/purchaseOrders?customerId=${customerId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to fetch purchase orders (${response.status})` }));
          throw new Error(errorData.message || `Failed to fetch purchase orders (${response.status})`);
        }

        const data = await response.json();
        const processedData = data.map(po => ({
          ...po,
          purchaseDate: po.purchaseDate ? new Date(po.purchaseDate) : new Date(),
          licenses: po.licenses?.map(lic => ({
            ...lic,
            activationDate: lic.activationDate ? new Date(lic.activationDate) : null,
            expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
          })) ?? []
        }));

        set({ purchaseOrders: processedData, isLoadingPurchaseOrders: false });
      } catch (error: any) {
        console.error("Error fetching purchase orders:", error);
        set({
          purchaseOrderError: error.message || 'Failed to fetch purchase orders',
          isLoadingPurchaseOrders: false,
          purchaseOrders: []
        });
      }
    },

    addPurchaseOrder: async (poData) => {
      if (!poData.customerId) {
        const errorMsg = "Cannot add purchase order: Customer ID is missing.";
        set({ purchaseOrderError: errorMsg, isLoadingPurchaseOrders: false });
        return null;
      }

      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const apiPayload = {
          ...poData,
          purchaseDate: typeof poData.purchaseDate === 'string'
            ? poData.purchaseDate
            : poData.purchaseDate.toISOString()
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

        const newPO = await response.json();
        const processedPO = {
          ...newPO,
          purchaseDate: new Date(newPO.purchaseDate),
          licenses: newPO.licenses?.map(lic => ({
            ...lic,
            activationDate: lic.activationDate ? new Date(lic.activationDate) : null,
            expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
          })) ?? []
        };

        set(state => ({
          purchaseOrders: [...state.purchaseOrders, processedPO],
          isLoadingPurchaseOrders: false,
        }));

        return processedPO;
      } catch (error: any) {
        console.error("Error adding purchase order:", error);
        set({
          purchaseOrderError: error.message || 'Failed to add purchase order',
          isLoadingPurchaseOrders: false
        });
        return null;
      }
    },

    addLicenseToPurchaseOrder: async (licenseData) => {
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const response = await fetch(`/api/purchaseOrders/${licenseData.poId}/licenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            typeId: licenseData.typeId,
            duration: licenseData.duration,
            externalName: licenseData.externalName, // Add externalName to payload
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to add license (${response.status})` }));
          throw new Error(errorData.message || `Failed to add license (${response.status})`);
        }

        const newLicense = await response.json();

        set(state => ({
          purchaseOrders: state.purchaseOrders.map(po => {
            if (po.id === licenseData.poId) {
              return {
                ...po,
                licenses: [...(po.licenses || []), {
                  ...newLicense,
                  activationDate: newLicense.activationDate ? new Date(newLicense.activationDate) : null,
                  expirationDate: newLicense.expirationDate ? new Date(newLicense.expirationDate) : null,
                }],
              };
            }
            return po;
          }),
          isLoadingPurchaseOrders: false,
        }));

        return true;
      } catch (error: any) {
        console.error("Error adding license to purchase order:", error);
        set({
          purchaseOrderError: error.message || 'Failed to add license to purchase order',
          isLoadingPurchaseOrders: false,
        });
        return false;
      }
    },

    updatePurchaseOrder: async (poId, poData) => {
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const apiPayload = {
          ...poData,
          ...(poData.purchaseDate && {
            purchaseDate: typeof poData.purchaseDate === 'string'
              ? poData.purchaseDate
              : poData.purchaseDate.toISOString()
          })
        };

        const response = await fetch(`/api/purchaseOrders/${poId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to update purchase order (${response.status})` }));
          throw new Error(errorData.message || `Failed to update purchase order (${response.status})`);
        }

        const updatedPO = await response.json();
        const processedPO = {
          ...updatedPO,
          purchaseDate: new Date(updatedPO.purchaseDate),
          licenses: updatedPO.licenses?.map(lic => ({
            ...lic,
            activationDate: lic.activationDate ? new Date(lic.activationDate) : null,
            expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
          })) ?? []
        };

        set(state => ({
          purchaseOrders: state.purchaseOrders.map(po =>
            po.id === processedPO.id ? processedPO : po
          ),
          isLoadingPurchaseOrders: false,
        }));

        return processedPO;
      } catch (error: any) {
        console.error("Error updating purchase order:", error);
        set({
          purchaseOrderError: error.message || 'Failed to update purchase order',
          isLoadingPurchaseOrders: false
        });
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

        set(state => ({
          purchaseOrders: state.purchaseOrders.filter(po => po.id !== poId),
          isLoadingPurchaseOrders: false,
        }));

        return true;
      } catch (error: any) {
        console.error("Error deleting purchase order:", error);
        set({
          purchaseOrderError: error.message || 'Failed to delete purchase order',
          isLoadingPurchaseOrders: false
        });
        return false;
      }
    },

    isPONameUnique: (poNumber) => {
      const { purchaseOrders } = get();
      return !purchaseOrders.some(po => po.poName === poNumber);
    },

    getPurchaseOrdersByCustomerId: (customerId) => {
      const { purchaseOrders } = get();
      return purchaseOrders.filter(po =>
        String(po.customerId) === String(customerId)
      );
    },
  })
);