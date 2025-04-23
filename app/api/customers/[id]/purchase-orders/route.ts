import { NextRequest, NextResponse } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Adjust path as needed
import PurchaseOrder from '@/lib/models/purchaseOrder'; // Import Customer model for validation
import License from '@/lib/models/license'; // Import User model

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

    // Find all purchase orders for the customer
    // Include the associated License model
    const purchaseOrders = await PurchaseOrder.findAll({
      where: { customerId: customerId },
      include: [
        {
          model: License,
          as: 'licenses', // Make sure 'as' matches your model association definition
        },
      ],
      order: [
        ['purchaseDate', 'DESC'], // Optional: Order by purchase date, newest first
        // You might also want to order licenses within each PO if needed
        // [{ model: License, as: 'licenses' }, 'id', 'ASC']
      ],
    });

    if (!purchaseOrders) {
      // Return empty array if none found, not necessarily an error
      return NextResponse.json([]);
    }

    return NextResponse.json(purchaseOrders);

  } catch (error: any) {
    console.error('[API_GET_PURCHASE_ORDERS] Error fetching purchase orders:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}