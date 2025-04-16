import { Card, CardContent } from "@/components/ui/card"
import type { Customer } from "@/lib/types"

interface CustomerDetailsProps {
  customer: Customer
}

export default function CustomerDetails({ customer }: CustomerDetailsProps) {
  return (
    <Card className="border-brand-purple/20">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
            <p className="font-medium text-brand-purple">{customer.name}</p>
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

          {/* Address Fields */}
          <div className="md:col-span-2 p-3 bg-brand-purple/5 rounded-md">
            <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
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
  )
}
