"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { Upload } from "lucide-react"

interface LicenseDeactivationModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
}

export default function LicenseDeactivationModal({ isOpen, onClose, customerId }: LicenseDeactivationModalProps) {
  const { getPurchaseOrdersByCustomerId, deactivateLicense } = useStore()
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

      // In a real application, we would parse the file and deactivate the licenses
      // For this prototype, we'll simulate by deactivating a random license

      const purchaseOrders = getPurchaseOrdersByCustomerId(customerId)

      // Find the first activated license to deactivate as a simulation
      for (const po of purchaseOrders) {
        for (let i = 0; i < po.licenses.length; i++) {
          if (po.licenses[i].status === "Activated") {
            deactivateLicense(po.id, i)
            break
          }
        }
      }

      // Close the modal after successful upload
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
          <DialogDescription>Upload file generated in Agile Studio with retired licenses.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 overflow-auto">
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm mb-2">Click to browse or drag and drop</p>
            <input
              type="file"
              className="hidden"
              accept=".json,.txt"
              onChange={handleFileChange}
              ref={fileInputRef}
              id="license-file-upload"
            />
            <Button type="button" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
            {fileName && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: <span className="font-medium">{fileName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="border-t mt-6 pt-4 flex justify-end gap-2 bg-background sticky bottom-0 z-10">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !fileName}>
            {isUploading ? "Processing..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
