"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import type { Server } from "@/lib/types"

interface ServerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (serverId: string) => void
  customerId: string
}

export default function ServerSelectionModal({ isOpen, onClose, onSubmit, customerId }: ServerSelectionModalProps) {
  const { getServersByCustomerId } = useStore()
  const servers = getServersByCustomerId(customerId)
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!selectedServerId) return

    setIsSubmitting(true)
    try {
      onSubmit(selectedServerId)
      setSelectedServerId(null)
      onClose()
    } catch (error) {
      console.error("Error selecting server:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Server for Activation</DialogTitle>
          <DialogDescription>Choose a registered server to activate this license.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 overflow-auto">
          {servers.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No servers registered yet.</p>
              <p className="text-sm mt-2">Please register a server first.</p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-3">Select a server to activate this license:</p>
              <RadioGroup value={selectedServerId || ""} onValueChange={setSelectedServerId}>
                <div className="space-y-3">
                  {servers.map((server: Server) => (
                    <div
                      key={server.id}
                      className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50"
                    >
                      <RadioGroupItem value={server.id} id={server.id} />
                      <Label htmlFor={server.id} className="flex-1 cursor-pointer">
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

        {/* Explicit footer with high z-index and clear styling */}
        <div className="border-t mt-6 pt-4 flex justify-end gap-2 bg-background sticky bottom-0 z-10">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedServerId || servers.length === 0}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
