import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db';
import Customer from '@/lib/models/customer'; // Import Customer model for validation
import User from '@/lib/models/user'; // Import User model

interface RouteParams {
  params: {
    id: string; // This 'id' refers to the Customer's ID
  };
}

// Handler for GET /api/customers/:id/users
export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance();
  try {
    const customerIdStr = params.id;
    const customerId = parseInt(customerIdStr, 10);

    if (isNaN(customerId)) {
      return new NextResponse('Invalid customer ID format', { status: 400 });
    }

    // Optional but recommended: Check if the customer actually exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return new NextResponse(`Customer with ID ${customerIdStr} not found`, { status: 404 });
    }

    // Find all users where the customerId field matches the ID from the route
    const users = await db.User.findAll({
      where: { customerId: customerId }, // Filter by the customerId foreign key
      attributes: { exclude: ['password'] } // Exclude password directly in the query
    });

    // The result is already an array of users (or an empty array if none found)
    return NextResponse.json(users);

  } catch (error) {
    console.error('[API_CUSTOMER_USERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// You could add a POST handler here to create a user specifically for this customer
// export async function POST(request: NextRequest, { params }: RouteParams) { ... }