"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useServerStore } from "@/lib/stores/serverStore"
import { Server } from "@/lib/types"

interface ServerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (serverId: string) => void
  customerId: string
}

export default function ServerSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  customerId
}: ServerSelectionModalProps) {
  const { servers, isLoading: isLoadingServers } = useServerStore()
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)

  const customerServers = servers.filter(server => 
    String(server.customerId) === String(customerId)
  )

  const handleSubmit = () => {
    if (selectedServerId) {
      onSubmit(selectedServerId)
      setSelectedServerId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Server</DialogTitle>
          <DialogDescription>Choose a server to activate this license on.</DialogDescription>
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
              <p className="text-sm mb-3">Select a server to activate the license:</p>
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
            onClick={handleSubmit}
            disabled={!selectedServerId || isLoadingServers}
            className="bg-brand-purple hover:bg-brand-purple/90"
          >
            Activate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
