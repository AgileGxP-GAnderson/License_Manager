import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { CustomerInput } from '@/lib/models/customer'; // Import input type

interface RouteParams {
  params: {
    id: string;
  };
}

// Handler for GET /api/customers/:id (Get customer by ID)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return new NextResponse('Invalid customer ID format', { status: 400 });
    }

    const customer = await db.Customer.findByPk(customerId);

    if (!customer) {
      return new NextResponse('Customer not found', { status: 404 });
    }

    return NextResponse.json(customer);

  } catch (error) {
    console.error('[API_CUSTOMER_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for PUT /api/customers/:id (Update customer)
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
        // Prevent updating primary key or timestamps directly via body
        // Sequelize update method handles this well, but explicit check is safer
        const { id: bodyId, createdAt, updatedAt, ...updateData } = body;

        await customer.update(updateData);
        return NextResponse.json(customer); // Return updated customer

    } catch (error) {
        console.error('[API_CUSTOMER_PUT]', error);
        // Add specific error handling (e.g., validation errors) if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Handler for DELETE /api/customers/:id (Delete customer)
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
         // Add specific error handling (e.g., foreign key constraints) if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
