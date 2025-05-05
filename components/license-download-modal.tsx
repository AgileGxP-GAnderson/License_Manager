"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useServerStore } from "@/lib/stores/serverStore"
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore"
import type { License } from "@/lib/types"

interface LicenseDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
}

export default function LicenseDownloadModal({
  isOpen,
  onClose,
  customerId
}: LicenseDownloadModalProps) {
  const { servers, isLoading: isLoadingServers } = useServerStore()
  const { getPurchaseOrdersByCustomerId } = usePurchaseOrderStore()
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const customerServers = servers.filter(server => 
    String(server.customerId) === String(customerId)
  )

  const handleDownload = () => {
    if (!selectedServerId) return

    setIsDownloading(true)
    try {
      const purchaseOrders = getPurchaseOrdersByCustomerId(customerId)

      // Find all activated licenses for the selected server
      const activatedLicenses = purchaseOrders.flatMap(po =>
        po.licenses.filter(license => 
          license.status === "Activated" && 
          String(license.serverId) === selectedServerId
        ).map(license => ({
          poNumber: po.poName,
          licenseType: license.type?.name,
          activationDate: license.activationDate,
          expirationDate: license.expirationDate,
          duration: license.totalDuration,
        }))
      )

      // Create a JSON blob with the license data
      const licenseData = {
        serverId: selectedServerId,
        licenses: activatedLicenses,
        generatedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(licenseData, null, 2)], { 
        type: "application/json" 
      })
      const url = URL.createObjectURL(blob)

      // Create a temporary link and trigger the download
      const a = document.createElement("a")
      a.href = url
      a.download = `license-${selectedServerId.substring(0, 8)}.json`
      document.body.appendChild(a)
      a.click()

      // Clean up
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Close the modal after download
      setTimeout(() => {
        setSelectedServerId(null)
        onClose()
      }, 500)
    } catch (error) {
      console.error("Error downloading license file:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Download License File</DialogTitle>
          <DialogDescription>Select a server to download its license file.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 overflow-auto">
          {isLoadingServers ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">Loading servers...</p>
            </div>
          ) : customerServers.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No servers registered yet.</p>
              <p className="text-sm mt-2">Please register a server first.</p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-3">Select a server to download licenses for:</p>
              <RadioGroup
                value={selectedServerId || ""}
                onValueChange={setSelectedServerId}
                className="space-y-2"
              >
                {customerServers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-brand-purple/5"
                  >
                    <RadioGroupItem value={server.id.toString()} id={`server-${server.id}`} />
                    <Label htmlFor={`server-${server.id}`} className="flex-1 cursor-pointer">
                      {server.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!selectedServerId || isDownloading || isLoadingServers}
            className="bg-brand-purple hover:bg-brand-purple/90"
          >
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
