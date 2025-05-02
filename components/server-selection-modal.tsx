"use client"

import React, { useState, useEffect } from 'react'; // Import useEffect
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Server } from '@/lib/types';
import { useServerStore } from '@/lib/stores/serverStore'; // Import the server store hook

interface ServerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serverId: string) => void | Promise<void>;
  customerId: string; // Assuming customerId is passed as a prop
}

const ServerSelectionModal: React.FC<ServerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerId // Destructure customerId
}) => {
  // Select individual state pieces to prevent unnecessary re-renders
  const servers = useServerStore(state => state.servers);
  const fetchServersByCustomerId = useServerStore(state => state.fetchServersByCustomerId);
  const isLoadingServers = useServerStore(state => state.isLoadingServers);
  const serverError = useServerStore(state => state.serverError);

  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch servers when the modal opens or customerId changes
  useEffect(() => {
    if (isOpen && customerId) {
      fetchServersByCustomerId(customerId);
    }
  }, [isOpen, customerId, fetchServersByCustomerId]); // Add dependencies

  const handleSubmit = async () => { // Make async
    if (!selectedServerId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedServerId); // Await the submission logic
      setSelectedServerId(null);
      onClose();
    } catch (error) {
      console.error("Error selecting server:", error);
      // Optionally display an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  let content: React.ReactNode;

  if (isLoadingServers) {
    content = <div className="py-6 text-center text-muted-foreground">Loading servers...</div>;
  } else if (serverError) {
    content = <div className="py-6 text-center text-red-600">Error loading servers: {serverError}</div>;
  } else if (servers.length === 0) {
    content = (
      <div className="py-6 text-center">
        <p className="text-muted-foreground">No servers registered yet.</p>
        <p className="text-sm mt-2">Please register a server first.</p>
      </div>
    );
  } else {
    // Use the 'servers' array from the store state
    content = (
      <>
        <p className="text-sm mb-3">Select a server to activate this license:</p>
        <RadioGroup value={selectedServerId || ""} onValueChange={setSelectedServerId}>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Add scroll */}
            {servers.map((server) => (
              <div
                key={server.id}
                className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50"
              >
                <RadioGroupItem value={String(server.id)} id={String(server.id)} />
                <Label htmlFor={String(server.id)} className="flex-1 cursor-pointer">
                  <div className="font-medium">{server.name}</div>
                  {/* Display fingerprint if needed, handle potential null/undefined */}
                  {/* <div className="text-xs text-muted-foreground truncate">{server.fingerprint ?? 'N/A'}</div> */}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Server for Activation</DialogTitle>
          <DialogDescription>Choose a registered server to activate this license.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 overflow-auto">
          {content}
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
  );
};

export default ServerSelectionModal;
