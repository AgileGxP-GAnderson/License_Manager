import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
// Import CustomerInput if needed for PUT/POST, not strictly for GET
// import { CustomerInput } from '@/lib/models/customer';

// Define the expected shape of the params object
interface RouteParams {
  params: {
    id: string;
  };
}

// Handler for GET /api/customers/:id (Get customer by ID with associations)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return new NextResponse('Invalid customer ID format', { status: 400 });
    }

    // --- Modify findByPk to include PurchaseOrders ---
    const customer = await db.Customer.findByPk(customerId, {
      include: [
        {
          model: db.PurchaseOrder,
          as: 'purchaseOrders', // Ensure this alias matches your model definition
          // Optionally include nested associations like Licenses within PurchaseOrders
          // include: [{ model: db.License, as: 'licenses' }]
        },
        // Add other associations if needed (e.g., Users, Servers)
        // { model: db.User, as: 'users', attributes: { exclude: ['password'] } },
        // { model: db.Server, as: 'servers' },
      ]
    });
    // --- End modification ---

    if (!customer) {
      return new NextResponse('Customer not found', { status: 404 });
    }

    // The customer object now includes the 'purchaseOrders' array if found
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

        // Find the customer first to ensure it exists
        const customer = await db.Customer.findByPk(customerId);

        if (!customer) {
            return new NextResponse('Customer not found', { status: 404 });
        }

        const body = await request.json();
        // Prevent updating primary key or timestamps directly via body
        const { id: bodyId, createdAt, updatedAt, purchaseOrders, users, servers, ...updateData } = body; // Exclude association keys

        // Update the customer instance
        await customer.update(updateData);

        // Return the updated customer data (without re-fetching associations unless needed)
        // If you need the updated associations, you might need to reload the instance: await customer.reload({ include: [...] });
        return NextResponse.json(customer);

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

        // Attempt to delete the customer
        // Sequelize handles associated data based on 'onDelete' constraints in your model definitions
        await customer.destroy();

        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error) {
        console.error('[API_CUSTOMER_DELETE]', error);
         // Add specific error handling (e.g., foreign key constraints) if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
