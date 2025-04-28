import { create } from 'zustand';
import { Customer } from '@/lib/types';

type CustomerState = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  createCustomer: (customer: Omit<Customer, 'id' | 'purchaseOrders'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  clearSelectedCustomer: () => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch customers');
      }
      const data: Customer[] = await response.json();
      set({ customers: data, loading: false });
    } catch (error) {
      let errorMessage = 'An unknown error occurred while fetching customers.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Error fetching customers:", errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ loading: true, error: null, selectedCustomer: null });
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch customer ${id}`);
      }
      const customer: Customer = await response.json();
      set({ selectedCustomer: customer, loading: false });
    } catch (error) {
      let errorMessage = `An unknown error occurred while fetching customer ${id}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error fetching customer ${id}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  createCustomer: async (customerData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create customer');
      }
      const newCustomer: Customer = await response.json();
      set((state) => ({
        customers: [...state.customers, newCustomer],
        loading: false,
      }));
    } catch (error) {
      let errorMessage = 'An unknown error occurred while creating the customer.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Error creating customer:", errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  updateCustomer: async (id: string, customerUpdateData: Partial<Customer>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerUpdateData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update customer ${id}`);
      }
      const updatedCustomer: Customer = await response.json();
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updatedCustomer } : c
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id ? { ...state.selectedCustomer, ...updatedCustomer } : state.selectedCustomer,
        loading: false,
      }));
    } catch (error) {
      let errorMessage = `An unknown error occurred while updating customer ${id}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error updating customer ${id}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete customer ${id}`);
      }
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
        loading: false,
      }));
    } catch (error) {
      let errorMessage = `An unknown error occurred while deleting customer ${id}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error deleting customer ${id}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  clearSelectedCustomer: () => {
    set({ selectedCustomer: null });
  },
}));