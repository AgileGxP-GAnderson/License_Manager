"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Server } from 'lucide-react'
import ServerRegistrationModal from "@/components/server-registration-modal"
import ServerSelectionModal from "@/components/server-selection-modal"
import LicenseDownloadModal from "@/components/license-download-modal"
import LicenseDeactivationModal from "@/components/license-deactivation-modal"
import Link from "next/link"

export default function CustomerPortal() {
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get("id")

  const {
    customers,
    currentCustomerId,
    getPurchaseOrdersByCustomerId,
    getServersByCustomerId,
    addServer,
    getServerById,
    updateLicense,
  } = useStore()

  // Use either the ID from URL or the current customer ID from the store
  const customerId = idFromUrl || currentCustomerId

  // Find the customer
  const customer = customerId ? customers.find((c) => c.id === customerId) : null

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [servers, setServers] = useState<any[]>([])
  const [serverRegistrationModal, setServerRegistrationModal] = useState(false)
  const [serverSelectionModal, setServerSelectionModal] = useState({
    isOpen: false,
    poId: "",
    licenseIndex: -1,
  })
  const [licenseDownloadModal, setLicenseDownloadModal] = useState(false)
  const [licenseDeactivationModal, setLicenseDeactivationModal] = useState(false)
  const [activatedLicenses, setActivatedLicenses] = useState<Record<string, boolean>>({})

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

  const handleServerRegistration = (name: string, fingerprint: string) => {
    if (customerId) {
      addServer({
        customerId,
        name,
        fingerprint,
      })

      // Refresh the servers list
      if (customerId) {
        setServers(getServersByCustomerId(customerId))
      }
    }
  }

  const handleActivationRequest = (serverId: string) => {
    const { poId, licenseIndex } = serverSelectionModal
    if (poId && licenseIndex >= 0) {
      // Directly change status to "Activated" (not "Activation Requested")
      // and associate the server ID with the license
      const now = new Date()
      let expirationDate: Date | null = null

      // Get the license to calculate expiration date
      const license = purchaseOrders.find((po) => po.id === poId)?.licenses[licenseIndex]

      if (license && license.duration !== "Perpetual") {
        const durationYears = Number.parseInt(license.duration.split(" ")[0])
        expirationDate = new Date(now)
        expirationDate.setFullYear(expirationDate.getFullYear() + durationYears)
      }

      updateLicense(poId, licenseIndex, {
        status: "Activated",
        serverId,
        activationDate: now,
        expirationDate: expirationDate,
      })

      // Update the local state to reflect the change
      setPurchaseOrders((prev) =>
        prev.map((po) => {
          if (po.id === poId) {
            const updatedLicenses = [...po.licenses]
            updatedLicenses[licenseIndex] = {
              ...updatedLicenses[licenseIndex],
              status: "Activated",
              serverId,
              activationDate: now,
              expirationDate: expirationDate,
            }
            return { ...po, licenses: updatedLicenses }
          }
          return po
        }),
      )

      // Mark this license as newly activated to show the download message
      setActivatedLicenses((prev) => ({
        ...prev,
        [`${poId}-${licenseIndex}`]: true,
      }))
    }
  }

  // Load purchase orders and servers when customer changes
  useEffect(() => {
    if (customerId) {
      const orders = getPurchaseOrdersByCustomerId(customerId)
      setPurchaseOrders(orders)

      const customerServers = getServersByCustomerId(customerId)
      setServers(customerServers)
    }
  }, [customerId, getPurchaseOrdersByCustomerId, getServersByCustomerId])

  const hasActivatedLicenses = () => {
    return purchaseOrders.some((po) => po.licenses.some((license) => license.status === "Activated"))
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-purple">License Manager - Customer Portal</h1>
        {customer && (
          <div className="mt-2 p-3 border rounded bg-brand-purple/5 border-brand-purple/20">
            <p className="text-lg">
              Current Customer: <span className="font-semibold">{customer.name}</span>
            </p>
          </div>
        )}
      </div>

      {!customer && (
        <Card className="enhanced-card">
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-brand-purple">No Customer Selected</h2>
              <p className="text-muted-foreground">Please select a customer in the Administrator Portal first.</p>
              <Button asChild className="mt-4 bg-brand-purple hover:bg-brand-purple/90 micro-interaction">
                <Link href="/administrator">Go to Administrator Portal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {customer && (
        <>
          <Card className="enhanced-card">
            <CardHeader className="border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p>{customer.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{customer.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{customer.addressLine1}</p>
                  {customer.addressLine2 && <p>{customer.addressLine2}</p>}
                  <p>
                    {customer.city}, {customer.state} {customer.zipCode}
                  </p>
                  <p>{customer.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-brand-purple/5 to-transparent">
              <CardTitle>Your Licenses</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLicenseDeactivationModal(true)}
                  disabled={!hasActivatedLicenses()}
                  className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple micro-interaction"
                >
                  Deactivate Licenses
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLicenseDownloadModal(true)}
                  disabled={!hasActivatedLicenses()}
                  className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
                >
                  Download License File
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {purchaseOrders.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">You don't have any licenses yet.</p>
              ) : (
                <div>
                  <Table>
                    <TableHeader className="bg-brand-purple/5">
                      <TableRow>
                        <TableHead>License Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Activation Date</TableHead>
                        <TableHead>Expiration Date</TableHead>
                        <TableHead>Server</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.flatMap((po) =>
                        po.licenses.map((license: any, licenseIndex: number) => (
                          <>
                            <TableRow key={`${po.id}-${licenseIndex}`} className="hover:bg-brand-purple/5">
                              <TableCell>{license.licenseType}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    license.status === "Activated"
                                      ? "default"
                                      : license.status === "Activation Requested"
                                        ? "outline"
                                        : "secondary"
                                  }
                                  className={
                                    license.status === "Activated"
                                      ? "bg-brand-green text-brand-purple"
                                      : license.status === "Activation Requested"
                                        ? "border-brand-purple/30 text-brand-purple"
                                        : ""
                                  }
                                >
                                  {license.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{license.duration}</TableCell>
                              <TableCell>
                                {license.activationDate
                                  ? format(new Date(license.activationDate), "PPP")
                                  : "Not activated"}
                              </TableCell>
                              <TableCell>
                                {license.duration === "Perpetual"
                                  ? "Perpetual"
                                  : license.expirationDate
                                    ? format(new Date(license.expirationDate), "PPP")
                                    : "Not set"}
                              </TableCell>
                              <TableCell>{license.serverId ? getServerById(license.serverId)?.name : "None"}</TableCell>
                              <TableCell>
                                {license.status === "Available" && (
                                  <Button
                                    size="sm"
                                    onClick={() => openServerSelectionModal(po.id, licenseIndex)}
                                    className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction"
                                  >
                                    Request Activation
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {activatedLicenses[`${po.id}-${licenseIndex}`] && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-brand-green text-sm py-1 bg-brand-green/5">
                                  Click the 'Download License File' button above to get your activated licenses.
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

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
              {servers.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">You haven't registered any servers yet.</p>
              ) : (
                <Table>
                  <TableHeader className="bg-brand-purple/5">
                    <TableRow>
                      <TableHead>Server Name</TableHead>
                      <TableHead>Fingerprint</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id} className="hover:bg-brand-purple/5">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Server className="h-4 w-4 mr-2 text-brand-purple" />
                            {server.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-md">{server.fingerprint}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ServerRegistrationModal
        isOpen={serverRegistrationModal}
        onClose={() => setServerRegistrationModal(false)}
        onSubmit={handleServerRegistration}
      />

      <ServerSelectionModal
        isOpen={serverSelectionModal.isOpen}
        onClose={closeServerSelectionModal}
        onSubmit={handleActivationRequest}
        customerId={customerId || ""}
      />

      <LicenseDownloadModal
        isOpen={licenseDownloadModal}
        onClose={() => setLicenseDownloadModal(false)}
        customerId={customerId || ""}
      />

      <LicenseDeactivationModal
        isOpen={licenseDeactivationModal}
        onClose={() => setLicenseDeactivationModal(false)}
        customerId={customerId || ""}
      />
    </div>
  )
}
