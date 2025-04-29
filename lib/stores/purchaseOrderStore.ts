import { create } from 'zustand';
// Removed devtools import
import { PurchaseOrder, PurchaseOrderInput } from '@/lib/types'; // Adjust path and types as needed

// --- Combined State and Actions Interface ---
interface PurchaseOrderStoreState {
  // State
  purchaseOrders: PurchaseOrder[];
  isLoadingPurchaseOrders: boolean;
  purchaseOrderError: string | null;

  // Actions
  fetchPurchaseOrdersByCustomerId: (customerId: string) => Promise<void>;
  addPurchaseOrder: (poData: PurchaseOrderInput) => Promise<PurchaseOrder | null>;
  updatePurchaseOrder: (poId: string, poData: Partial<PurchaseOrderInput>) => Promise<PurchaseOrder | null>;
  deletePurchaseOrder: (poId: string) => Promise<boolean>;
  setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
  clearPurchaseOrders: () => void;
}

// --- Initial State ---
const initialState = {
  purchaseOrders: [],
  isLoadingPurchaseOrders: false,
  purchaseOrderError: null,
};

// --- Store Creator ---
// Removed the devtools wrapper
export const usePurchaseOrderStore = create<PurchaseOrderStoreState>()(
  (set, get) => ({
    // --- Initial State ---
    ...initialState,

    // --- Actions Implementation ---

    setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),

    clearPurchaseOrders: () => set({ purchaseOrders: [], purchaseOrderError: null }),

    fetchPurchaseOrdersByCustomerId: async (customerId) => {
      if (!customerId) {
        set({ purchaseOrders: [], isLoadingPurchaseOrders: false, purchaseOrderError: null });
        return;
      }
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const response = await fetch(`/api/purchaseOrders?customerId=${customerId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch purchase orders (${response.status})`);
        }
        const data: PurchaseOrder[] = await response.json();
        set({ purchaseOrders: data, isLoadingPurchaseOrders: false });
      } catch (error: any) {
        console.error("Error fetching purchase orders:", error);
        set({ purchaseOrderError: error.message || 'Failed to fetch purchase orders', isLoadingPurchaseOrders: false, purchaseOrders: [] });
      }
    },

    addPurchaseOrder: async (poData) => {
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const response = await fetch('/api/purchaseOrders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(poData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to add purchase order (${response.status})`);
        }
        const newPurchaseOrder: PurchaseOrder = await response.json();
        // Option 1: Add directly
        // set((state) => ({
        //   purchaseOrders: [...state.purchaseOrders, newPurchaseOrder],
        //   isLoadingPurchaseOrders: false,
        // }));
        // Option 2: Refetch (simpler if order/complex state matters)
        await get().fetchPurchaseOrdersByCustomerId(poData.customerId); // Assumes customerId is in poData
        set({ isLoadingPurchaseOrders: false }); // Loading is finished by fetch
        return newPurchaseOrder;
      } catch (error: any) {
        console.error("Error adding purchase order:", error);
        set({ purchaseOrderError: error.message || 'Failed to add purchase order', isLoadingPurchaseOrders: false });
        return null;
      }
    },

    updatePurchaseOrder: async (poId, poData) => {
      set({ isLoadingPurchaseOrders: true, purchaseOrderError: null });
      try {
        const response = await fetch(`/api/purchaseOrders/${poId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(poData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update purchase order (${response.status})`);
        }
        const updatedPurchaseOrder: PurchaseOrder = await response.json();
        // Update in state
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === updatedPurchaseOrder.id ? updatedPurchaseOrder : po
          ),
          isLoadingPurchaseOrders: false,
        }));
        return updatedPurchaseOrder;
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
        // Remove from state
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
  })
);

// --- Usage ---
// import { usePurchaseOrderStore } from '@/lib/store/purchaseOrderStore';
//
// function MyComponent() {
//   const { purchaseOrders, isLoadingPurchaseOrders, fetchPurchaseOrdersByCustomerId } = usePurchaseOrderStore();
//   // ...
// }