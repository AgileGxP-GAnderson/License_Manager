import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { PurchaseOrderInput } from '@/lib/models/purchaseOrder'; // Import input type
import Customer from '@/lib/models/customer'; // Import Customer for association include & validation

interface RouteParams {
  params: {
    id: string;
  };
}

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
        const { id: bodyId, createdAt, updatedAt, customerId: bodyCustomerId, ...updateDataInput } = body;
        const updateData: Partial<PurchaseOrderInput> = { ...updateDataInput }; // Clone

        if (body.customerId !== undefined && body.customerId !== purchaseOrder.customerId) {
             const customerExists = await db.Customer.findByPk(body.customerId);
             if (!customerExists) {
                 return new NextResponse(`Customer with ID ${body.customerId} not found.`, { status: 400 });
             }
             updateData.customerId = body.customerId; // Add it back if valid
        }


        await purchaseOrder.update(updateData);
        const result = await db.PurchaseOrder.findByPk(poId, {
             include: [{ model: Customer, as: 'customer' }]
        });
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[API_PURCHASE_ORDER_PUT]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

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

        await purchaseOrder.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error: any) {
        console.error('[API_PURCHASE_ORDER_DELETE]', error);
         if (error.name === 'SequelizeForeignKeyConstraintError') {
             return new NextResponse('Cannot delete Purchase Order because it has associated data (e.g., licenses).', { status: 409 });
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
