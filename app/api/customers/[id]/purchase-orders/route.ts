import { NextRequest, NextResponse } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Adjust path as needed
// import PurchaseOrder from '@/lib/models/purchaseOrder'; // Remove direct import
// import License from '@/lib/models/license'; // Remove direct import

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDbInstance();
  try {
    const customerIdStr = params.id;
    const customerId = parseInt(customerIdStr, 10);

    if (isNaN(customerId)) {
      return NextResponse.json({ message: 'Invalid customer ID format' }, { status: 400 });
    }

    const purchaseOrders = await db.PurchaseOrder.findAll({ // Changed to db.PurchaseOrder
      where: { customerId: customerId },
      include: [
        {
          model: db.License, // Changed to db.License
          as: 'licenses', // Make sure 'as' matches your model association definition
        },
      ],
      order: [
        ['purchaseDate', 'DESC'], // Optional: Order by purchase date, newest first
      ],
    });

    if (!purchaseOrders) {
      return NextResponse.json([]);
    }

    return NextResponse.json(purchaseOrders);

  } catch (error: any) {
    console.error('[API_GET_PURCHASE_ORDERS] Error fetching purchase orders:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}