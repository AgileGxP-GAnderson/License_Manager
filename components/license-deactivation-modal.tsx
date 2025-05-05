"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLicenseStore } from "@/lib/stores/licenseStore"
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore"
import { Upload } from "lucide-react"

interface LicenseDeactivationModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
}

export default function LicenseDeactivationModal({
  isOpen,
  onClose,
  customerId
}: LicenseDeactivationModalProps) {
  const { getPurchaseOrdersByCustomerId } = usePurchaseOrderStore()
  const { deactivateLicense } = useLicenseStore()
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name)
    } else {
      setFileName(null)
    }
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) return

    setIsUploading(true)
    try {
      const file = fileInputRef.current.files[0]
      const purchaseOrders = getPurchaseOrdersByCustomerId(customerId)

      // Find first activated license to deactivate
      for (const po of purchaseOrders) {
        for (const license of po.licenses) {
          if (license.status === "Activated") {
            deactivateLicense(license.id, po.id)
            break
          }
        }
      }

      // Close modal after successful upload
      setTimeout(() => {
        setFileName(null)
        onClose()
      }, 500)
    } catch (error) {
      console.error("Error processing deactivation file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Deactivate Licenses</DialogTitle>
          <DialogDescription>
            Upload your deactivation file to process license deactivations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-brand-purple/50 transition-colors">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
            />
            <Upload
              className="h-8 w-8 mb-2 text-brand-purple"
              onClick={() => fileInputRef.current?.click()}
            />
            <p className="text-sm text-center text-muted-foreground mb-1">
              {fileName ? fileName : "Click to upload deactivation file"}
            </p>
            <p className="text-xs text-center text-muted-foreground">
              Supports JSON files
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!fileName || isUploading}
            className="bg-brand-purple hover:bg-brand-purple/90"
          >
            {isUploading ? "Processing..." : "Upload & Deactivate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
