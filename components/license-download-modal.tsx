"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import type { Server } from "@/lib/types"

interface LicenseDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
}

export default function LicenseDownloadModal({ isOpen, onClose, customerId }: LicenseDownloadModalProps) {
  const { getServersByCustomerId, getPurchaseOrdersByCustomerId } = useStore()
  const servers = getServersByCustomerId(customerId)
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    if (!selectedServerId) return

    setIsDownloading(true)
    try {
      // In a real application, this would generate and download a license file
      // For this prototype, we'll simulate the download
      const purchaseOrders = getPurchaseOrdersByCustomerId(customerId)

      // Find all activated licenses for the selected server
      const activatedLicenses = purchaseOrders.flatMap((po) =>
        po.licenses
          .filter((license) => license.status === "Activated" && license.serverId === selectedServerId)
          .map((license) => ({
            poNumber: po.poNumber,
            licenseType: license.licenseType,
            activationDate: license.activationDate,
            expirationDate: license.expirationDate,
            duration: license.duration,
          })),
      )

      // Create a JSON blob with the license data
      const licenseData = {
        serverId: selectedServerId,
        licenses: activatedLicenses,
        generatedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(licenseData, null, 2)], { type: "application/json" })
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
          {servers.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No servers registered yet.</p>
              <p className="text-sm mt-2">Please register a server first.</p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-3">Select a server to download licenses for:</p>
              <RadioGroup value={selectedServerId || ""} onValueChange={setSelectedServerId}>
                <div className="space-y-3">
                  {servers.map((server: Server) => (
                    <div
                      key={server.id}
                      className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50"
                    >
                      <RadioGroupItem value={server.id} id={`download-${server.id}`} />
                      <Label htmlFor={`download-${server.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{server.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{server.fingerprint}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </>
          )}
        </div>

        <div className="border-t mt-6 pt-4 flex justify-end gap-2 bg-background sticky bottom-0 z-10">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading || !selectedServerId || servers.length === 0}>
            Download License File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
