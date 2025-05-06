import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const {id} = await params
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return new NextResponse('Invalid customer ID format', { status: 400 });
    }

    const customer = await db.Customer.findByPk(customerId, {
      include: [
        {
          model: db.PurchaseOrder,
          as: 'purchaseOrders', // Ensure this alias matches your model definition
        },
      ]
    });

    if (!customer) {
      return new NextResponse('Customer not found', { status: 404 });
    }

    return NextResponse.json(customer);

  } catch (error) {
    console.error('[API_CUSTOMER_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const customerId = parseInt(id, 10); // Also validate ID for PUT

        if (isNaN(customerId)) {
             return new NextResponse('Invalid customer ID format', { status: 400 });
        }

        const customer = await db.Customer.findByPk(customerId);

        if (!customer) {
            return new NextResponse('Customer not found', { status: 404 });
        }

        const body = await request.json();
        const { id: bodyId, createdAt, updatedAt, purchaseOrders, users, servers, ...updateData } = body; // Exclude association keys

        await customer.update(updateData);

        return NextResponse.json(customer);

    } catch (error) {
        console.error('[API_CUSTOMER_PUT]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const customerId = parseInt(id, 10); // Validate ID for DELETE

        if (isNaN(customerId)) {
             return new NextResponse('Invalid customer ID format', { status: 400 });
        }

        const customer = await db.Customer.findByPk(customerId);

        if (!customer) {
            return new NextResponse('Customer not found', { status: 404 });
        }

        await customer.destroy();

        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error) {
        console.error('[API_CUSTOMER_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
