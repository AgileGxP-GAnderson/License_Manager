import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { PurchaseOrderInput } from '@/lib/models/purchaseOrder'; // Import input type
import Customer from '@/lib/models/customer'; // Import Customer for association include & validation

interface RouteParams {
  params: {
    id: string;
  };
}

// Handler for GET /api/purchaseOrders/:id (Get purchase order by ID)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const poId = parseInt(id, 10);

    if (isNaN(poId)) {
      return new NextResponse('Invalid purchase order ID format', { status: 400 });
    }

    const purchaseOrder = await db.PurchaseOrder.findByPk(poId, {
        include: [{ model: Customer, as: 'customer' }] // Include associated customer
    });

    if (!purchaseOrder) {
      return new NextResponse('Purchase Order not found', { status: 404 });
    }

    return NextResponse.json(purchaseOrder);

  } catch (error) {
    console.error('[API_PURCHASE_ORDER_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for PUT /api/purchaseOrders/:id (Update purchase order)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const poId = parseInt(id, 10);

        if (isNaN(poId)) {
             return new NextResponse('Invalid purchase order ID format', { status: 400 });
        }

        const purchaseOrder = await db.PurchaseOrder.findByPk(poId);

        if (!purchaseOrder) {
            return new NextResponse('Purchase Order not found', { status: 404 });
        }

        const body: Partial<PurchaseOrderInput> = await request.json();
        // Prevent updating primary key or timestamps directly
        const { id: bodyId, createdAt, updatedAt, customerId: bodyCustomerId, ...updateDataInput } = body;
        const updateData: Partial<PurchaseOrderInput> = { ...updateDataInput }; // Clone

        // Validate customerId if it's being updated
        if (body.customerId !== undefined && body.customerId !== purchaseOrder.customerId) {
             const customerExists = await db.Customer.findByPk(body.customerId);
             if (!customerExists) {
                 return new NextResponse(`Customer with ID ${body.customerId} not found.`, { status: 400 });
             }
             updateData.customerId = body.customerId; // Add it back if valid
        }

        // Note: Handling updates to associated licenses would require additional logic here

        await purchaseOrder.update(updateData);
        // Fetch again to include customer data in response
        const result = await db.PurchaseOrder.findByPk(poId, {
             include: [{ model: Customer, as: 'customer' }]
        });
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[API_PURCHASE_ORDER_PUT]', error);
        // Add specific error handling if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Handler for DELETE /api/purchaseOrders/:id (Delete purchase order)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const poId = parseInt(id, 10);

        if (isNaN(poId)) {
             return new NextResponse('Invalid purchase order ID format', { status: 400 });
        }

        const purchaseOrder = await db.PurchaseOrder.findByPk(poId);

        if (!purchaseOrder) {
            return new NextResponse('Purchase Order not found', { status: 404 });
        }

        // Note: Consider implications of deleting a PO (e.g., associated licenses via join table).
        // Foreign key constraints might prevent deletion or cause cascading deletes.
        // You might need to manually delete related POLicenseJoin records first if constraints are restrictive.
        await purchaseOrder.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error: any) {
        console.error('[API_PURCHASE_ORDER_DELETE]', error);
         // Add specific error handling for foreign key constraints if needed
         if (error.name === 'SequelizeForeignKeyConstraintError') {
             return new NextResponse('Cannot delete Purchase Order because it has associated data (e.g., licenses).', { status: 409 });
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
