"use client"

import type React from "react"
import { useState } from "react"
import { format, isValid } from "date-fns"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { PurchaseOrder } from '@/lib/types'; // Adjust import path

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[]; // Receive data as prop
  isLoading: boolean;             // Receive loading state as prop
  error: string | null;           // Receive error state as prop
  isAdminView?: boolean;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  purchaseOrders,
  isLoading,
  error,
  isAdminView = false,
}) => {
  const { getServerById, activateLicense } = useStore()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

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

  // Safe date formatting function
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
    <div className="space-y-4">
      {purchaseOrders.map((po) => (
        <div key={po.id} className="border rounded-md">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
            onClick={() => toggleItem(po.id)}
          >
            <div className="flex items-center gap-2">
              {openItems[po.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <div>
                <h3 className="font-medium">PO #{po.poNumber}</h3>
                <p className="text-sm text-muted-foreground">Purchase Date: {formatDate(po.purchaseDate)}</p>
              </div>
            </div>
            <Badge>
              {po.licenses?.length} License{po.licenses?.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {openItems[po.id] && (
            <div className="p-4 pt-0 border-t">
              <h4 className="font-medium mb-2">Licenses</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Activation Date</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead>Server</TableHead>
                    {isAdminView && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.licenses?.map((license, index) => (
                    <TableRow key={index}>
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
                        >
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{license.duration}</TableCell>
                      <TableCell>
                        {license.activationDate ? formatDate(license.activationDate) : "Not activated"}
                      </TableCell>
                      <TableCell>
                        {license.duration === "Perpetual" ? "Perpetual" : formatDate(license.expirationDate)}
                      </TableCell>
                      <TableCell>
                        {license.serverId && getServerById(license.serverId)
                          ? getServerById(license.serverId)?.name
                          : "None"}
                      </TableCell>
                      {isAdminView && (
                        <TableCell>
                          {license.status === "Activation Requested" && (
                            <Button size="sm" onClick={(e) => handleActivate(e, po.id, index)}>
                              Activate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default PurchaseOrderList;
