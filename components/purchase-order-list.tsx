"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format, isValid } from "date-fns"
import { ChevronDown, ChevronRight, History } from "lucide-react" // Added History icon
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"; // Added Input import
import { useServerStore } from "@/lib/stores/serverStore"
import { usePurchaseOrderStore } from "@/lib/stores/purchaseOrderStore"
import { useLicenseStore } from "@/lib/stores/licenseStore"
import { PurchaseOrder, License, LicenseInput, LicenseAudit } from '@/lib/types'; // Added LicenseAudit

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  error: string | null;
  isAdminView?: boolean;
}

const licenseTypes = [
    { id: 1, name: "Annual" },
    { id: 2, name: "Perpetual" },
];

const annualDurations = [
    { value: 1, name: "1 Year" },
    { value: 2, name: "2 Years" },
    { value: 3, name: "3 Years" },
    { value: 4, name: "4 Years" },
    { value: 5, name: "5 Years" },
];
const perpetualDurationValue = 100;

interface AddLicenseFormProps {
    poId: string;
    onSave: (licenseData: Pick<LicenseInput, 'poId' | 'typeId' | 'duration' | 'externalName'>) => Promise<void>;
    onCancel: () => void;
}

const AddLicenseForm: React.FC<AddLicenseFormProps> = ({ poId, onSave, onCancel }) => {
    const [licenseTypeId, setLicenseTypeId] = useState<string>("");
    const [duration, setDuration] = useState<number | null>(null);
    const [externalName, setExternalName] = useState<string>(""); // New state for description
    const [isDurationDisabled, setIsDurationDisabled] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        const typeIdNum = parseInt(licenseTypeId, 10);
        if (typeIdNum === 2) {
            setDuration(perpetualDurationValue);
            setIsDurationDisabled(true);
        } else if (typeIdNum === 1) {
            setIsDurationDisabled(false);
        } else {
            setDuration(null);
            setIsDurationDisabled(true);
        }
    }, [licenseTypeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const typeIdNum = parseInt(licenseTypeId, 10);
        if (!typeIdNum || duration === null) {
            alert("Please select a license type and duration.");
            return;
        }
        const newLicenseData = {
            poId: poId,
            typeId: typeIdNum,
            duration: duration,
            externalName: externalName, // Add externalName to the data
        };

        setIsSaving(true);
        try {
            await onSave(newLicenseData);
        } catch (error) {
            console.error("Error during save operation:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="license-type" className="text-right">
                    License Type *
                </Label>
                <Select value={licenseTypeId} onValueChange={setLicenseTypeId} required disabled={isSaving}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent id="license-type">
                        {licenseTypes.map(type => (
                            <SelectItem key={type.id} value={String(type.id)}>
                                {type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="externalName" className="text-right">
                    Description
                </Label>
                <Input
                    id="externalName"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    className="col-span-3"
                    placeholder="Optional license description"
                    disabled={isSaving}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="duration" className="text-right">
                     Duration *
                 </Label>
                 <Select
                     value={duration !== null ? String(duration) : ""}
                     onValueChange={(value) => setDuration(value ? parseInt(value, 10) : null)}
                     required
                     disabled={isDurationDisabled || isSaving}
                 >
                     <SelectTrigger className="col-span-3">
                         <SelectValue placeholder={isDurationDisabled ? (parseInt(licenseTypeId, 10) === 2 ? "Perpetual" : "Select type first...") : "Select duration..."} />
                     </SelectTrigger>
                     <SelectContent id="duration">
                         {parseInt(licenseTypeId, 10) === 1 && annualDurations.map(dur => (
                             <SelectItem key={dur.value} value={String(dur.value)}>
                                 {dur.name}
                             </SelectItem>
                         ))}
                         {parseInt(licenseTypeId, 10) === 2 && (
                             <SelectItem value={String(perpetualDurationValue)}>
                                 Perpetual
                             </SelectItem>
                         )}
                     </SelectContent>
                 </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save License"}
                </Button>
            </DialogFooter>
        </form>
    );
};

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  purchaseOrders,
  isLoading,
  error,
  isAdminView = false,
}) => {
  const { getServerById } = useServerStore()
  const { activateLicense, addLicenseToPurchaseOrder, fetchPurchaseOrdersByCustomerId } = usePurchaseOrderStore();
  // Updated to use licenseStore for audit data and actions
  const { 
    updateLicense, 
    deactivateLicense, 
    hasUnsavedChanges, 
    fetchLicenseAudits, 
    currentLicenseAudits, 
    isLoadingAudits, 
    auditError,
    clearLicenseAudits // Added clearLicenseAudits
  } = useLicenseStore(); 
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [isAddLicenseModalOpen, setIsAddLicenseModalOpen] = useState(false);
  const [currentPoIdForModal, setCurrentPoIdForModal] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  // Removed local state for audit records and loading, now using store state
  const [selectedLicenseForAudit, setSelectedLicenseForAudit] = useState<License | null>(null);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleActivate = (e: React.MouseEvent, poId: string, licenseIndex: number) => {
    e.stopPropagation()
    activateLicense(poId, licenseIndex)
  }

  const handleOpenAddLicenseModal = (poId: string) => {
    setCurrentPoIdForModal(poId);
    setIsAddLicenseModalOpen(true);
  };

  const handleCloseAddLicenseModal = () => {
    setIsAddLicenseModalOpen(false);
    setCurrentPoIdForModal(null);
  };

  const handleSaveLicense = async (licenseData: Pick<LicenseInput, 'poId' | 'typeId' | 'duration' | 'externalName'>): Promise<void> => {
    console.log("Saving license:", licenseData);
    try {
      const addedLicense = await addLicenseToPurchaseOrder(licenseData);
      if (addedLicense) {
          handleCloseAddLicenseModal();
          const currentPO = purchaseOrders.find(po => String(po.id) === String(licenseData.poId));
          if (currentPO?.customerId) {
              console.log(`Refetching POs for customer ${currentPO.customerId} after adding license.`);
              await fetchPurchaseOrdersByCustomerId(currentPO.customerId);
          } else {
              console.warn("Could not find customerId to refetch purchase orders after adding license.");
          }
      } else {
          console.error("Failed to save license (check store error state).");
          alert("Failed to save license. Please check the details and try again.");
      }
    } catch (saveError: any) {
      console.error("Unexpected error during save license:", saveError);
      alert(`Error saving license: ${saveError.message || 'Unknown error'}`);
      throw saveError;
    }
  };

  const handleOpenAuditModal = async (license: License) => {
    setSelectedLicenseForAudit(license);
    setIsAuditModalOpen(true);
    await fetchLicenseAudits(license.id); // Call store action
  };

  const handleCloseAuditModal = () => {
    setIsAuditModalOpen(false);
    setSelectedLicenseForAudit(null);
    clearLicenseAudits(); // Clear audit data from store on modal close
  };

  const formatDate = (dateValue: Date | string | undefined | null): string => {
    if (!dateValue) return "Not set"

    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
      return isValid(date) ? format(date, "PPP") : "Invalid date"
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const getLicenseTypeText = (typeId: number | string | undefined): string => {
    const id = Number(typeId);
    switch (id) {
      case 1: return "Annual";
      case 2: return "Perpetual";
      default: return `Unknown Type (${typeId})`;
    }
  };

  const getDurationText = (durationValue: number | string | undefined | null): string => {
    console.log('Hit getDurationText with value:', durationValue);
      const val = Number(durationValue);
      if (val === perpetualDurationValue) return "Perpetual";
      const annual = annualDurations.find(d => d.value === val);
      if (annual) return annual.name;
      return `Unknown (${durationValue})`;
  };

  if (isLoading) {
    return <p className="text-gray-500">Loading purchase orders...</p>;
  }

  if (error) {
    return <p className="text-red-600">Error loading purchase orders: {error}</p>;
  }

  if (purchaseOrders.length === 0) {
    return <p className="text-gray-500">No purchase orders found for this customer.</p>;
  }

  return (
    <Dialog open={isAddLicenseModalOpen} onOpenChange={setIsAddLicenseModalOpen}>
      <div className="space-y-4">
        {purchaseOrders.map((po) => (
          <div key={po.id} className="border rounded-md shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleItem(po.id)}
            >
               <div className="flex items-center gap-2">
                {openItems[po.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <h3 className="font-medium">PO: {po.poName}<div id={po.poName}></div></h3>
                  <p className="text-sm text-muted-foreground">Purchase Date: {formatDate(po.purchaseDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>
                  {po.licenses?.length} License{po.licenses?.length !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddLicenseModal(po.id);
                  }}
                >
                  Add New License
                </Button>
              </div>
            </div>

            {openItems[po.id] && (
              <div className="p-4 pt-2 border-t border-gray-200 bg-white">
                {po.licenses && po.licenses.length > 0 ? (
                    <Table>
                       <TableHeader>
                        <TableRow>
                          <TableHead>License Type</TableHead>
                          <TableHead>Description</TableHead> {/* New Column for Description */}
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Last Activity Date</TableHead>
                          <TableHead>Expiration Date</TableHead>
                          <TableHead>Server Name</TableHead>
                          <TableHead className="text-center">History</TableHead> {/* New Column for History Icon */}
                          {isAdminView ? <TableHead className="text-right">Actions</TableHead> : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {po.licenses.map((license, index) => (
                          <TableRow key={license.id || index}>
                            <TableCell>{license.type?.name ?? getLicenseTypeText(license.typeId)}</TableCell>
                            <TableCell>{license.externalName}</TableCell> {/* Display externalName */}
                            <TableCell>
                              <Badge
                                variant={
                                  license.status === "Activated" ? "default" :
                                  license.status === "Available" ? "secondary" :
                                  license.status === "Deactivated" ? "outline" :
                                  "secondary"
                                }
                              >
                                {license.status || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getDurationText(license.totalDuration)}</TableCell>
                            <TableCell>{formatDate(license.activationDate)}</TableCell>
                            <TableCell>
                              {license.type?.name === "Perpetual" ? "Perpetual" : formatDate(license.expirationDate)}
                            </TableCell>
                            <TableCell>{license.latestServerName ?? "None"}</TableCell>
                            <TableCell className="text-center"> {/* Cell for History Icon */}
                              <Button variant="ghost" size="icon" onClick={() => handleOpenAuditModal(license)} title="View License History">
                                <History className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            {isAdminView ? (
                              <TableCell className="text-right">
                                {license.status === "Activation Requested" && (
                                  <Button variant="outline" size="sm" onClick={(e) => handleActivate(e, po.id, index)} className="h-7 px-2">
                                    Activate
                                  </Button>
                                )}
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-gray-500 px-4 py-2">No licenses associated with this purchase order.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New License</DialogTitle>
          <DialogDescription>
            Select the license type and duration. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {currentPoIdForModal && (
            <AddLicenseForm
                poId={currentPoIdForModal}
                onSave={handleSaveLicense}
                onCancel={handleCloseAddLicenseModal}
            />
        )}
      </DialogContent>

      {/* License Audit Modal */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>License Audit Trail: {selectedLicenseForAudit?.uniqueId}</DialogTitle>
            <DialogDescription>
              Showing history for license {selectedLicenseForAudit?.externalName || selectedLicenseForAudit?.uniqueId}.
              {auditError && <p className="text-red-500 mt-2">Error: {auditError}</p>} {/* Display audit error from store */}
            </DialogDescription>
          </DialogHeader>
          {isLoadingAudits ? ( // Use isLoadingAudits from store
            <p>Loading audit records...</p>
          ) : currentLicenseAudits.length > 0 ? ( // Use currentLicenseAudits from store
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Updated By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLicenseAudits.map((audit) => ( // Use currentLicenseAudits from store
                    <TableRow key={audit.id}>
                      <TableCell>{formatDate(audit.createdAt)}</TableCell>
                      <TableCell>{audit.statusName}</TableCell>
                      <TableCell>{audit.typeName}</TableCell>
                      <TableCell>{audit.serverName}</TableCell>
                      <TableCell>{audit.comment || '-'}</TableCell>
                      <TableCell>{audit.updatedBy || 'System'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p>No audit records found for this license.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseAuditModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default PurchaseOrderList;
