"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { addYears } from "date-fns"
import type { StoreState } from "./types"

export const useStore = create<StoreState>()(
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

      addCustomer: (customer) => {
        const id = uuidv4()
        const newCustomer = { ...customer, id }

        set((state) => ({
          customers: [...state.customers, newCustomer],
          currentCustomerId: id,
        }))

        return id
      },

      updateCustomer: (id, customer) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...customer } : c)),
        }))
      },

      setCurrentCustomer: (id) => {
        set({ currentCustomerId: id })
      },

      searchCustomers: (query) => {
        const { customers } = get()
        const lowerQuery = query.toLowerCase()
        return customers.filter(
          (c) => c.name.toLowerCase().includes(lowerQuery) || c.email.toLowerCase().includes(lowerQuery),
        )
      },

      isPONumberUnique: (poNumber) => {
        const { purchaseOrders } = get()
        return !purchaseOrders.some((po) => po.poNumber === poNumber)
      },

      addPurchaseOrder: (customerId, po) => {
        const id = uuidv4()
        set((state) => ({
          purchaseOrders: [
            ...state.purchaseOrders,
            {
              ...po,
              id,
              customerId,
              purchaseDate: new Date(po.purchaseDate),
              licenses: po.licenses.map((license) => ({
                ...license,
                activationDate: license.activationDate ? new Date(license.activationDate) : undefined,
                expirationDate:
                  license.duration === "Perpetual"
                    ? null
                    : license.expirationDate
                      ? new Date(license.expirationDate)
                      : null,
              })),
            },
          ],
        }))
        return id
      },

      updatePurchaseOrder: (id, po) => {
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

      getPurchaseOrdersByCustomerId: (customerId) => {
        const { purchaseOrders } = get()
        return purchaseOrders.filter((po) => po.customerId === customerId)
      },

      updateLicense: (poId, licenseIndex, licenseData) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              updatedLicenses[licenseIndex] = {
                ...updatedLicenses[licenseIndex],
                ...licenseData,
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      requestLicenseActivation: (poId, licenseIndex, serverId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              updatedLicenses[licenseIndex] = {
                ...updatedLicenses[licenseIndex],
                status: "Activation Requested",
                serverId,
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      activateLicense: (poId, licenseIndex) => {
        const { purchaseOrders, getServerById } = get()
        const po = purchaseOrders.find((p) => p.id === poId)

        if (!po) return

        const license = po.licenses[licenseIndex]
        if (!license || license.status !== "Activation Requested" || !license.serverId) return

        // Verify server exists (confirm fingerprint exists)
        const server = getServerById(license.serverId)
        if (!server || !server.fingerprint) return

        const now = new Date()
        let expirationDate: Date | null = null

        // Calculate expiration date based on duration
        if (license.duration !== "Perpetual") {
          const durationYears = Number.parseInt(license.duration.split(" ")[0])
          expirationDate = addYears(now, durationYears)
        }

        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              updatedLicenses[licenseIndex] = {
                ...updatedLicenses[licenseIndex],
                status: "Activated",
                activationDate: now,
                expirationDate: expirationDate,
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      deactivateLicense: (poId, licenseIndex) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id === poId) {
              const updatedLicenses = [...po.licenses]
              updatedLicenses[licenseIndex] = {
                ...updatedLicenses[licenseIndex],
                status: "Available",
                activationDate: undefined,
                expirationDate: null,
                serverId: undefined,
              }
              return { ...po, licenses: updatedLicenses }
            }
            return po
          }),
        }))
      },

      // Server management
      addServer: (server) => {
        const id = uuidv4()
        const newServer = { ...server, id }

        set((state) => ({
          servers: [...state.servers, newServer],
        }))

        return id
      },

      getServersByCustomerId: (customerId) => {
        const { servers } = get()
        return servers.filter((server) => server.customerId === customerId)
      },

      getServerById: (id) => {
        const { servers } = get()
        return servers.find((server) => server.id === id)
      },

      // User management
      addUser: (user) => {
        const id = uuidv4()
        const newUser = { ...user, id }

        set((state) => ({
          users: [...state.users, newUser],
        }))

        return id
      },

      updateUser: (id, user) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...user } : u)),
        }))
      },

      getUsersByCustomerId: (customerId) => {
        const { users } = get()
        return users.filter((user) => user.customerId === customerId)
      },

      isUsernameUnique: (username) => {
        const { users } = get()
        return !users.some((user) => user.username.toLowerCase() === username.toLowerCase())
      },
    })
)
