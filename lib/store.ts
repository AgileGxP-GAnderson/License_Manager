"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { addYears } from "date-fns"
import type { StoreState, Customer, PurchaseOrder, Server, User, License } from "./types" // Ensure all relevant types are imported

// Define the input type expected by the store action for adding a customer
interface AddCustomerInput extends Omit<Customer, 'id'> {}

// Define the input type expected by the store action for adding a PO
interface AddPurchaseOrderInput extends Omit<PurchaseOrder, 'id' | 'customerId' | 'purchaseDate' | 'licenses'> {
  purchaseDate: Date | string; // Allow string from form, convert later
  licenses: Array<Omit<License, 'id' | 'purchaseOrderId' | 'activationDate' | 'expirationDate'> & {
    activationDate?: Date | string | null; // Allow string from form
    expirationDate?: Date | string | null; // Allow string from form
  }>;
}

// Define the input type expected by the store action for adding a Server
interface AddServerInput extends Omit<Server, 'id'> {}

// Define the input type expected by the store action for adding a User
interface AddUserInput extends Omit<User, 'id'> {}


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
      addCustomer: async (customer: AddCustomerInput) => {
        // Note: This currently only adds to local state.
        // Needs API call similar to updateCustomer for persistence.
        console.warn("addCustomer currently only updates local state. API call needed.");
        const id = uuidv4() // Use UUID for local state before API confirmation if needed
        const newCustomer = { ...customer, id }

        // --- TODO: Add API Call Here ---
        // try {
        //   const response = await fetch('/api/customers', { method: 'POST', ... });
        //   if (!response.ok) throw new Error('Failed to add customer via API');
        //   const savedCustomer = await response.json();
        //   set((state) => ({
        //     customers: [...state.customers, savedCustomer],
        //     currentCustomerId: savedCustomer.id, // Use ID from API
        //   }));
        //   return savedCustomer.id;
        // } catch (error) {
        //   console.error("Error adding customer:", error);
        //   throw error; // Re-throw for component handling
        // }

        // --- Temporary Local State Update ---
        set((state) => ({
          customers: [...state.customers, newCustomer],
          currentCustomerId: id,
        }))
        return id; // Return temporary ID
      },

      updateCustomer: async (id: string, customerUpdateData: Partial<Customer>): Promise<Customer> => { // <-- Specify return type Promise<Customer>
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

          // Update the Zustand state
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updatedCustomerFromServer } : c // Use server data
            ),
          }));

          // --- RETURN the updated customer object ---
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
        // Note: This searches local state. For large datasets, API search is better.
        const { customers } = get()
        const lowerQuery = query.toLowerCase()
        return customers.filter(
          (c) => c.businessName.toLowerCase().includes(lowerQuery) || (c.contactEmail ?? "").toLowerCase().includes(lowerQuery),
        )
      },

      // --- Purchase Order Actions ---
      isPONumberUnique: (poNumber: string) => {
        // Note: Checks local state. A database check via API is more reliable for uniqueness.
        const { purchaseOrders } = get()
        return !purchaseOrders.some((po) => po.poNumber === poNumber)
      },

      addPurchaseOrder: async (customerId: string, po: AddPurchaseOrderInput) => {
        console.log('[Store Action] addPurchaseOrder called with customerId:', customerId, 'and data:', po);

        // Prepare data for the API (ensure customerId is included, convert dates)
        const apiPayload = {
          poNumber: po.poNumber,
          purchaseDate: typeof po.purchaseDate === 'string' ? po.purchaseDate : po.purchaseDate.toISOString(), // Ensure ISO string for API
          customerId: parseInt(customerId, 10), // Assuming API expects number
          licenses: po.licenses.map(lic => ({
            ...lic,
            // API might expect dates as strings or handle Date objects
            activationDate: lic.activationDate ? (typeof lic.activationDate === 'string' ? lic.activationDate : lic.activationDate.toISOString()) : null,
            expirationDate: lic.expirationDate ? (typeof lic.expirationDate === 'string' ? lic.expirationDate : lic.expirationDate.toISOString()) : null,
          })),
          // Add other fields required by API, like isClosed if needed
          isClosed: false, // Example: Set default if needed by API
          poName: po.poNumber, // Example: Map poNumber to poName if API expects that
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

          const newPurchaseOrderFromApi: PurchaseOrder = await response.json(); // Assuming API returns the created PO
          console.log('[Store Action] Received new PO from API:', newPurchaseOrderFromApi);

          // Ensure dates from API are converted back to Date objects for store consistency
          const processedPO = {
            ...newPurchaseOrderFromApi,
            purchaseDate: new Date(newPurchaseOrderFromApi.purchaseDate),
            licenses: newPurchaseOrderFromApi.licenses.map(lic => ({
              ...lic,
              activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
              expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
            }))
          };

          // Update the local store state
          set((state) => ({
            purchaseOrders: [...state.purchaseOrders, processedPO],
          }));

          return processedPO.id; // Return ID from API

        } catch (error) {
          console.error('[Store Action] Error during addPurchaseOrder fetch:', error);
          throw error; // Re-throw for component handling
        }
      },

      updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => {
        // Note: This currently only updates local state. Needs API call.
        console.warn("updatePurchaseOrder currently only updates local state. API call needed.");
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...po,
                  // Ensure dates are handled correctly if updated
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
      // Note: These only update local state. API calls are needed for persistence.
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
                   // Handle date conversions if necessary
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

        // Verify server exists (confirm fingerprint exists) - This check remains local
        const server = getServerById(license.serverId)
        if (!server || !server.fingerprint) return

        const now = new Date()
        let expirationDate: Date | null = null

        // Calculate expiration date based on duration
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
      // Note: These only update local state. API calls are needed for persistence.
      addServer: (server: AddServerInput) => {
        console.warn("addServer currently only updates local state. API call needed.");
        const id = uuidv4()
        const newServer = { ...server, id }
        set((state) => ({
          servers: [...state.servers, newServer],
        }))
        return id
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
      // Note: These only update local state. API calls are needed for persistence.
      addUser: (user: AddUserInput) => {
        console.warn("addUser currently only updates local state. API call needed.");
        const id = uuidv4()
        const newUser = { ...user, id }
        set((state) => ({
          users: [...state.users, newUser],
        }))
        return id
      },

      updateUser: (id: string, user: Partial<User>) => {
        console.warn("updateUser currently only updates local state. API call needed.");
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...user } : u)),
        }))
      },

      getUsersByCustomerId: (customerId: string) => {
        const { users } = get()
        return users.filter((user) => user.customerId === customerId)
      },

      isUsernameUnique: (username: string) => {
        // Note: Checks local state. A database check via API is more reliable.
        const { users } = get()
        return !users.some((user) => user.username.toLowerCase() === username.toLowerCase())
      },
    }),
    {
      name: 'license-manager-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      // Define which parts of the state should be persisted
      partialize: (state) => ({
        // Persist only things that make sense to keep across sessions
        // Avoid persisting large lists if they are always fetched from API on load
        currentCustomerId: state.currentCustomerId,
        // customers: state.customers, // Decide if you want to persist these
        // purchaseOrders: state.purchaseOrders,
        // servers: state.servers,
        // users: state.users,
      }),
      // Custom replacer/reviver for Date objects if persisting lists containing them
      // storage: createJSONStorage(() => localStorage, {
      //   reviver: (key, value) => {
      //     // Example: Revive date strings back to Date objects
      //     if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
      //       return new Date(value);
      //     }
      //     return value;
      //   },
      // }),
    }
  )
)
