"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { addYears } from "date-fns"
// --- Ensure all relevant types are imported ---
import type { StoreState, Customer, PurchaseOrder, Server, User, License } from "./types" // Removed Add...Input types

// Apply persist middleware to store state in localStorage
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

      // --- Customer Actions ---
      addCustomer: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
        console.log('[Store Action] addCustomer called with data:', customer);
        try {
          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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

          set((state) => ({
            customers: [...state.customers, savedCustomer],
          }));

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
            headers: {
              'Content-Type': 'application/json',
            },
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

          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updatedCustomerFromServer } : c
            ),
          }));

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

      // --- Purchase Order Actions ---
      isPONumberUnique: (poNumber: string) => {
        const { purchaseOrders } = get()
        return !purchaseOrders.some((po) => po.poNumber === poNumber)
      },

      addPurchaseOrder: async (customerId: string, po: Pick<PurchaseOrder, 'poNumber' | 'purchaseDate' | 'licenses'>): Promise<string> => { // Return PO ID
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

          return processedPO.id;

        } catch (error) {
          console.error('[Store Action] Error during addPurchaseOrder fetch:', error);
          throw error;
        }
      },

      updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => {
        console.warn("updatePurchaseOrder currently only updates local state. API call needed.");
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...po,
                  purchaseDate: po.purchaseDate ? new Date(po.purchaseDate) : p.purchaseDate,
                  licenses: po.licenses
                    ? po.licenses.map((license) => ({
                        ...license,
                        activationDate: license.activationDate ? new Date(license.activationDate) : undefined,
                        expirationDate: license.expirationDate ? new Date(license.expirationDate) : null,
                      }))
                    : p.licenses,
                }
              : p,
          ),
        }))
      },

      getPurchaseOrdersByCustomerId: (customerId: string) => {
        const { purchaseOrders } = get()
        return purchaseOrders.filter((po) => po.customerId === customerId)
      },

      // --- License Actions (within Purchase Orders) ---
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

      // --- Server Actions ---
      addServer: (server: Omit<Server, 'id'>) => {
        // --- TODO: Implement API call for addServer ---
        console.warn("addServer currently only updates local state. API call needed.");
        const id = uuidv4()
        const newServer = { ...server, id }
        set((state) => ({
          servers: [...state.servers, newServer],
        }))
        return id // Return temporary ID until API call is implemented
      },

      getServersByCustomerId: (customerId: string) => {
        const { servers } = get()
        return servers.filter((server) => server.customerId === customerId)
      },

      getServerById: (id: string) => {
        const { servers } = get()
        return servers.find((server) => server.id === id)
      },

      // --- User Actions ---
      addUser: async (user: Omit<User, 'id' | 'customerId'> & { password?: string }): Promise<User> => {
        console.log('[Store Action] addUser called with initial data:', user);

        // --- Get currentCustomerId from store state ---
        const currentCustomerId = get().currentCustomerId;

        // --- Validate that a customer is selected ---
        if (!currentCustomerId) {
          console.error("[Store Action] Cannot add user: No current customer selected.");
          throw new Error("Cannot add user: No customer is currently selected.");
        }

        // --- Prepare payload for API, ensuring currentCustomerId is included ---
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
                // Check if API provided specific field errors in the body
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
         // --- TODO: Implement API call for updateUser ---
         console.warn("updateUser currently only updates local state. API call needed.");
         // Steps:
         // 1. Make fetch PUT request to /api/users/{id} with userUpdateData
         // 2. Handle response (check if ok, handle errors)
         // 3. Parse updated user from response body
         // 4. Update state using set() with the data received from API
         // 5. Return updated user object from API
         // 6. Handle password updates securely (likely separate endpoint/process)

         // Temporary local update (replace with API logic)
         set((state) => ({
           users: state.users.map((u) => (u.id === id ? { ...u, ...userUpdateData } : u)),
         }));
         const updatedUser = get().users.find(u => u.id === id);
         if (!updatedUser) throw new Error("User not found after local update attempt.");
         return updatedUser;
      },

      getUsersByCustomerId: (customerId: string) => {
        const { users } = get()
        return users.filter((user) => user.customerId === customerId)
      },

      isUsernameUnique: (username: string) => {
        // Note: Checks local state. A database check via API is more reliable.
        const { users } = get()
        return !users.some((user) => user.login.toLowerCase() === username.toLowerCase())
      },

      // Action to fetch from API
      fetchUsers: async (customerId: string): Promise<void> => {
        if (!customerId) { /* ... handle missing ID ... */ return; }
        console.log(`[Store Action] getUsers called for customer ${customerId}`);
        try {
          const apiUrl = `/api/customers/${encodeURIComponent(customerId)}/users`;
          const response = await fetch(apiUrl);
          if (!response.ok) { /* ... handle error ... */ throw new Error(/*...*/); }
          const fetchedUsers: User[] = await response.json();
          console.log(`[Store Action] Received users for customer ${customerId} from API:`, fetchedUsers);
          set((state) => ({
            users: [
              ...state.users.filter(u => u.customerId !== customerId),
              ...fetchedUsers
            ]
          }));
        } catch (error) { /* ... handle error ... */ throw error; }
      },

      // Selector to filter state
      getUsersByCustomerId: (customerId: string) => {
        const { users } = get();
        // Ensure comparison is correct (string vs number if applicable)
        // Assuming user.customerId is stored consistently (e.g., always string or always number)
        return users.filter((user) => String(user.customerId) === String(customerId));
      },

      // --- User Selector Implementation ---
      getUsersByCustomerId: (customerId: string): User[] => {
        const { users } = get();
        if (!customerId) return [];
        // Ensure consistent comparison (e.g., both as strings)
        return users.filter((user) => String(user.customerId) === String(customerId));
      },
      // --- End User Selector ---

      // --- User Fetch Action Implementation ---
      fetchUsersForCustomer: async (customerId: string): Promise<void> => {
        if (!customerId) {
          console.warn("[Store Action] fetchUsersForCustomer called with no customerId.");
          // Optionally clear users for the non-existent/cleared customer ID if needed
          // set((state) => ({ users: state.users.filter(u => String(u.customerId) !== 'null' && String(u.customerId) !== 'undefined') }));
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

          // Update state: Replace users for this customer, keep others
          set((state) => ({
            users: [
              // Keep users from other customers
              ...state.users.filter(u => String(u.customerId) !== String(customerId)),
              // Add/replace users for the current customer (ensure they have customerId)
              ...fetchedUsers.map(u => ({ ...u, customerId: String(customerId) })) // Ensure customerId consistency if needed
            ]
          }), false, 'fetchUsersForCustomer'); // Added action name for debugging

        } catch (error) {
          console.error(`[Store Action] Error in fetchUsersForCustomer action for customer ${customerId}:`, error);
          // Re-throw the error so the component can catch it
          throw error;
        }
      },
      // --- End User Fetch Action ---

    }),
    {
      name: 'license-manager-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      // Define which parts of the state should be persisted
      partialize: (state) => ({
        currentCustomerId: state.currentCustomerId,
      }),
    }
  )
)

// --- Export types if not already done in types.ts ---
export type { StoreState, Customer, PurchaseOrder, Server, User, License }; // Removed Add...Input types
