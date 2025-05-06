"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { addYears } from "date-fns"
import type { StoreState, Customer, PurchaseOrder, Server, User, License } from "./types"
import * as inputTypes from "./api/input-types"
import * as adminFetch from "./api/admin-api-fetch"
import * as purchaseOrderFetch from "./api/purchaseOrder-api-fetch"
import * as userFetch from "./api/user-api-fetch"
import * as serverFetch from "./api/server-api-fetch"
import * as licenseLedgerFetch from "./api/licenseLedger-api-fetch"



const mergePOs = (existingPOs: PurchaseOrder[], newPOs: PurchaseOrder[], customerId: string): PurchaseOrder[] => {
  const otherCustomerPOs = existingPOs.filter(po => String(po.customerId) !== String(customerId));
  return [...otherCustomerPOs, ...newPOs];
};


export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      customers: [],
      purchaseOrders: [],
      servers: [],
      users: [],
      currentCustomerId: null,

      get currentCustomer() {
        const { customers, currentCustomerId } = get()
        if (!currentCustomerId) return null
        return customers.find((c) => c.id === currentCustomerId) || null
      },

      addCustomer: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
        console.log('[Store Action] addCustomer called with data:', customer);
        try {
          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer),
          });

          console.log('[Store Action] addCustomer API response status:', response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("[Store Action] API Error adding customer:", response.status, errorBody);
            throw new Error(`Failed to add customer: ${response.statusText} - ${errorBody}`);
          }

          const savedCustomer: Customer = await response.json();
          console.log('[Store Action] Received new customer from API:', savedCustomer);

          set((state) => {
            let updatedPOs = state.purchaseOrders;
            if (savedCustomer.purchaseOrders && savedCustomer.purchaseOrders.length > 0) {
              console.log(`[Store Action] Merging ${savedCustomer.purchaseOrders.length} POs from new customer ${savedCustomer.id}`);
              updatedPOs = mergePOs(state.purchaseOrders, savedCustomer.purchaseOrders, savedCustomer.id);
            }

            return {
              customers: [...state.customers, savedCustomer],
              purchaseOrders: updatedPOs, // Update purchaseOrders state
            };
          });

          return savedCustomer;

        } catch (error) {
          console.error("[Store Action] Error adding customer:", error);
          throw error;
        }
      },

      updateCustomer: async (id: string, customerUpdateData: Partial<Customer>): Promise<Customer> => {
        console.log('[Store Action] updateCustomer called for id:', id, 'with data:', customerUpdateData);
        try {
          const response = await fetch(`/api/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerUpdateData),
          });

          console.log('[Store Action] updateCustomer API response status:', response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("[Store Action] API Error updating customer:", response.status, errorBody);
            throw new Error(`Failed to update customer: ${response.statusText} - ${errorBody}`);
          }

          const updatedCustomerFromServer: Customer = await response.json();
          console.log('[Store Action] Received updated customer from API:', updatedCustomerFromServer);

          set((state) => {
            let updatedPOs = state.purchaseOrders;
            if (updatedCustomerFromServer.purchaseOrders && updatedCustomerFromServer.purchaseOrders.length > 0) {
               console.log(`[Store Action] Merging ${updatedCustomerFromServer.purchaseOrders.length} POs from updated customer ${id}`);
               updatedPOs = mergePOs(state.purchaseOrders, updatedCustomerFromServer.purchaseOrders, id);
            } else {
               console.log(`[Store Action] Updated customer ${id} response did not contain POs. Keeping existing POs in store for this customer.`);
            }

            return {
              customers: state.customers.map((c) =>
                c.id === id ? { ...c, ...updatedCustomerFromServer } : c // Update customer in customers array
              ),
              purchaseOrders: updatedPOs, // Update purchaseOrders state
            };
          });

          return updatedCustomerFromServer;

        } catch (error) {
          console.error("[Store Action] Error in updateCustomer action:", error);
          throw error;
        }
      },

      setCurrentCustomer: (id: string | null) => {
        set({ currentCustomerId: id })
      },

      searchCustomers: (query: string) => {
        const { customers } = get()
        const lowerQuery = query.toLowerCase()
        return customers.filter(
          (c) => c.businessName.toLowerCase().includes(lowerQuery) || (c.contactEmail ?? "").toLowerCase().includes(lowerQuery),
        )
      },

      isPONumberUnique: (poNumber: string) => {
        const { purchaseOrders } = get()
        return !purchaseOrders.some((po) => po.poNumber === poNumber)
      },

      addPurchaseOrder: async (customerId: string, po: Pick<PurchaseOrder, 'poNumber' | 'purchaseDate' | 'licenses'>): Promise<PurchaseOrder> => { // Return PO ID
        console.log('[Store Action] addPurchaseOrder called with customerId:', customerId, 'and data:', po);

        const apiPayload = {
          poNumber: po.poNumber,
          purchaseDate: typeof po.purchaseDate === 'string' ? po.purchaseDate : po.purchaseDate.toISOString(),
          customerId: parseInt(customerId, 10), // Assuming API expects number
          licenses: po.licenses.map(lic => ({
            ...lic,
            activationDate: lic.activationDate ? (typeof lic.activationDate === 'string' ? lic.activationDate : lic.activationDate.toISOString()) : null,
            expirationDate: lic.expirationDate ? (typeof lic.expirationDate === 'string' ? lic.expirationDate : lic.expirationDate.toISOString()) : null,
          })),
          isClosed: false,
          poName: po.poNumber,
        };

        console.log('[Store Action] Attempting fetch POST to /api/purchaseOrders with payload:', apiPayload);

        try {
          const response = await fetch('/api/purchaseOrders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
          });

          console.log('[Store Action] Fetch response status:', response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('[Store Action] API Error Response:', errorBody);
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
          }

          const newPurchaseOrderFromApi: PurchaseOrder = await response.json();
          console.log('[Store Action] Received new PO from API:', newPurchaseOrderFromApi);

          const processedPO = {
            ...newPurchaseOrderFromApi,
            purchaseDate: new Date(newPurchaseOrderFromApi.purchaseDate),
            licenses: newPurchaseOrderFromApi.licenses.map(lic => ({
              ...lic,
              activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
              expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
            }))
          };

          set((state) => ({
            purchaseOrders: [...state.purchaseOrders, processedPO],
          }));

          return processedPO;

        } catch (error) {
          console.error('[Store Action] Error during addPurchaseOrder fetch:', error);
          throw error;
        }
      },

      updatePurchaseOrder: async (id: string, poUpdateData: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
        console.log(`[Store Action] updatePurchaseOrder called for ID: ${id}`, poUpdateData);
        try {
          const response = await fetch(`/api/purchase-orders/${encodeURIComponent(id)}`, { // Assuming this is the update endpoint
            method: 'PUT', // Or PATCH
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poUpdateData),
          });
           if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Store Action] API Error updating PO ${id}:`, response.status, errorBody);
            throw new Error(`Failed to update purchase order: ${response.statusText} - ${errorBody}`);
          }
          const updatedPoFromApi: PurchaseOrder = await response.json();
           console.log(`[Store Action] Received updated PO ${id} from API:`, updatedPoFromApi);
           set((state) => ({
            purchaseOrders: state.purchaseOrders.map((po) =>
              String(po.id) === String(id) ? { ...po, ...updatedPoFromApi } : po
            ),
          }), false);
          return updatedPoFromApi;
        } catch (error) {
           console.error(`[Store Action] Error in updatePurchaseOrder action for ID ${id}:`, error);
           throw error;
        }
      },

      getPurchaseOrdersByCustomerId: (customerId: string) => {
        const { purchaseOrders } = get()
        return purchaseOrders.filter((po) => po.customerId === customerId)
      },

      updateLicense: (poId: string, licenseIndex: number, licenseData: Partial<License>) => {
        console.warn("updateLicense currently only updates local state. API call needed.");
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              if (updatedLicenses[licenseIndex]) {
                 updatedLicenses[licenseIndex] = {
                   ...updatedLicenses[licenseIndex],
                   ...licenseData,
                   activationDate: licenseData.activationDate ? new Date(licenseData.activationDate) : updatedLicenses[licenseIndex].activationDate,
                   expirationDate: licenseData.expirationDate ? new Date(licenseData.expirationDate) : updatedLicenses[licenseIndex].expirationDate,
                 }
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      requestLicenseActivation: (poId: string, licenseIndex: number, serverId: string) => {
        console.warn("requestLicenseActivation currently only updates local state. API call needed.");
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              if (updatedLicenses[licenseIndex]) {
                updatedLicenses[licenseIndex] = {
                  ...updatedLicenses[licenseIndex],
                  status: "Activation Requested",
                  serverId,
                }
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      activateLicense: (poId: string, licenseIndex: number) => {
        console.warn("activateLicense currently only updates local state. API call needed.");
        const { purchaseOrders, getServerById } = get()
        const po = purchaseOrders.find((p) => p.id === poId)

        if (!po) return

        const license = po.licenses[licenseIndex]
        if (!license || license.status !== "Activation Requested" || !license.serverId) return

        const server = getServerById(license.serverId)
        if (!server || !server.fingerprint) return

        const now = new Date()
        let expirationDate: Date | null = null

        if (license.duration !== "Perpetual") {
          const durationYears = Number.parseInt(license.duration.split(" ")[0])
          if (!isNaN(durationYears)) {
             expirationDate = addYears(now, durationYears)
          }
        }

        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((p) => {
            if (p.id === poId) {
              const updatedLicenses = [...p.licenses]
              if (updatedLicenses[licenseIndex]) {
                 updatedLicenses[licenseIndex] = {
                   ...updatedLicenses[licenseIndex],
                   status: "Activated",
                   activationDate: now,
                   expirationDate: expirationDate,
                 }
              }
              return { ...p, licenses: updatedLicenses }
            }
            return p
          }),
        }))
      },

      deactivateLicense: (poId: string, licenseIndex: number) => {
        console.warn("deactivateLicense currently only updates local state. API call needed.");
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              if (updatedLicenses[licenseIndex]) {
                 updatedLicenses[licenseIndex] = {
                   ...updatedLicenses[licenseIndex],
                   status: "Available",
                   activationDate: undefined,
                   expirationDate: null,
                   serverId: undefined,
                 }
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      addServer: async (server: Omit<Server, 'id'>): Promise<Server> => {
        console.warn("addServer currently only updates local state. API call needed.");
        const id = uuidv4()
        const newServer = { ...server, id }
        set((state) => ({
          servers: [...state.servers, newServer],
        }))
        return Promise.resolve(newServer);
      },

      getServersByCustomerId: (customerId: string) => {
        const { servers } = get()
        return servers.filter((server) => server.customerId === customerId)
      },

      getServerById: (id: string): Server | null => { // Update return type annotation
        const { servers } = get()
        const server = servers.find((server) => server.id === id)
        return server || null;
      },

      addUser: async (user: Omit<User, 'id' | 'customerId'> & { password?: string }): Promise<User> => {
        console.log('[Store Action] addUser called with initial data:', user);

        const currentCustomerId = get().currentCustomerId;

        if (!currentCustomerId) {
          console.error("[Store Action] Cannot add user: No current customer selected.");
          throw new Error("Cannot add user: No customer is currently selected.");
        }

        const apiPayload = {
          ...user, // Include username, password, email, etc. from the form
          customerId: currentCustomerId, // Explicitly set customerId from store state
        };

        console.log('[Store Action] Attempting fetch POST to /api/users with payload:', apiPayload);

        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload), // Send the payload with the correct customerId
          });

          console.log('[Store Action] addUser API response status:', response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("[Store Action] API Error adding user:", response.status, errorBody);
            let errorMessage = `Failed to add user: ${response.statusText}`;
            if (response.status === 409) {
                errorMessage = "Username already exists.";
            } else if (response.status === 400) {
                errorMessage = `Missing or invalid fields. API Response: ${errorBody}`;
            } else {
                errorMessage = `${errorMessage} - ${errorBody}`;
            }
            throw new Error(errorMessage);
          }

          const newUserFromApi: User = await response.json();
          console.log('[Store Action] Received new user from API:', newUserFromApi);

          set((state) => ({
            users: [...state.users, newUserFromApi],
          }));

          return newUserFromApi;

        } catch (error) {
          console.error("[Store Action] Error in addUser action:", error);
          throw error;
        }
      },

      updateUser: async (id: string, userUpdateData: Partial<User>): Promise<User> => {
        console.log(`[Store Action] updateUser called for ID: ${id}`, userUpdateData);
        try {
          const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
            method: 'PUT', // Or PATCH
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userUpdateData),
          });

          console.log(`[Store Action] updateUser API response status for ID ${id}:`, response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Store Action] API Error updating user ${id}:`, response.status, errorBody);
            throw new Error(`Failed to update user: ${response.statusText} - ${errorBody}`);
          }

          const updatedUserFromApi: User = await response.json();
          console.log(`[Store Action] Received updated user ${id} from API:`, updatedUserFromApi);

          set((state) => ({
            users: state.users.map((user) =>
              String(user.id) === String(id) ? { ...user, ...updatedUserFromApi } : user // Replace the old user with the updated one
            ),
          }), false); // Added action name for debugging

          return updatedUserFromApi;

        } catch (error) {
          console.error(`[Store Action] Error in updateUser action for ID ${id}:`, error);
          throw error;
        }
      },

      isUsernameUnique: (username: string) => {
        const { users } = get()
        return !users.some((user) => user.login.toLowerCase() === username.toLowerCase())
      },

      getUsersByCustomerId: (customerId: string): User[] => {
        const { users } = get();
        if (!customerId) return [];
        return users.filter((user) => String(user.customerId) === String(customerId));
      },

      fetchUsersForCustomer: async (customerId: string): Promise<void> => {
        if (!customerId) {
          console.warn("[Store Action] fetchUsersForCustomer called with no customerId.");
          return;
        }
        console.log(`[Store Action] fetchUsersForCustomer called for customer ${customerId}`);
        try {
          const apiUrl = `/api/customers/${encodeURIComponent(customerId)}/users`;
          const response = await fetch(apiUrl);

          console.log(`[Store Action] fetchUsers API response status for customer ${customerId}:`, response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Store Action] API Error getting users for customer ${customerId}:`, response.status, errorBody);
            throw new Error(`Failed to fetch users: ${response.statusText} - ${errorBody}`);
          }

          const fetchedUsers: User[] = await response.json();
          console.log(`[Store Action] Received users for customer ${customerId} from API:`, fetchedUsers);

          set((state) => ({
            users: [
              ...state.users.filter(u => String(u.customerId) !== String(customerId)),
              ...fetchedUsers.map(u => ({ ...u, customerId: String(customerId) })) // Ensure customerId consistency if needed
            ]
          }), false); // Added action name for debugging

        } catch (error) {
          console.error(`[Store Action] Error in fetchUsersForCustomer action for customer ${customerId}:`, error);
          throw error;
        }
      },

      fetchPurchaseOrdersForCustomer: async (customerId: string): Promise<void> => {
        console.log(`[Store Action] fetchPurchaseOrdersForCustomer called for customer ${customerId}`);
        try {
          const response = await fetch(`/api/customers/${encodeURIComponent(customerId)}/purchase-orders`); // Assuming this endpoint exists
          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Store Action] API Error fetching POs for customer ${customerId}:`, response.status, errorBody);
            throw new Error(`Failed to fetch purchase orders: ${response.statusText} - ${errorBody}`);
          }
          const fetchedPOs: PurchaseOrder[] = await response.json();
          console.log(`[Store Action] Received ${fetchedPOs.length} POs for customer ${customerId} from API via dedicated fetch.`);

          set((state) => ({
             purchaseOrders: mergePOs(state.purchaseOrders, fetchedPOs, customerId)
          }), false);

        } catch (error) {
          console.error(`[Store Action] Error in fetchPurchaseOrdersForCustomer action for ${customerId}:`, error);
          throw error;
        }
      },


    }),
    {
      name: 'license-manager-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentCustomerId: state.currentCustomerId,
      }),
    }
  )
)

export type { StoreState, Customer, PurchaseOrder, Server, User, License };
