import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { PurchaseOrderInput } from '@/lib/models/purchaseOrder'; // Import input type
import Customer from '@/lib/models/customer'; // Import Customer for association include & validation

// Handler for GET /api/purchaseOrders (Get all purchase orders)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // Adapted from getAllPurchaseOrders
    const purchaseOrders = await db.PurchaseOrder.findAll({
        include: [{ model: Customer, as: 'customer' }] // Include associated customer
    });
    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('[API_PURCHASE_ORDERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/purchaseOrders (Create a new purchase order)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
      console.log('[API_PURCHASE_ORDERS_POST] Request body:', request.body); // Log the request body for debugging
        const body: PurchaseOrderInput = await request.json();
        const { poName, purchaseDate, customerId, isClosed } = body;

        // Basic validation (adapted from createPurchaseOrder)
        if (!poName || !purchaseDate || customerId === undefined || isClosed === undefined) {
            return new NextResponse('Missing required fields (poName, purchaseDate, customerId, isClosed)', { status: 400 });
        }

        // Validate customerId existence
        const customerExists = await db.Customer.findByPk(customerId);
        if (!customerExists) {
             return new NextResponse(`Customer with ID ${customerId} not found.`, { status: 400 });
        }

        // Note: Handling associated licenses would require additional logic here

        const newPurchaseOrder = await db.PurchaseOrder.create(body);
        // Fetch again to include customer data in response
        const result = await db.PurchaseOrder.findByPk(newPurchaseOrder.id, {
             include: [{ model: Customer, as: 'customer' }]
        });
        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('[API_PURCHASE_ORDERS_POST]', error);
        // Add specific error handling (e.g., foreign key constraints) if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
