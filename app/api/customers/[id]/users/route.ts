import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db';

interface RouteParams {
  params: {
    id: string; // This 'id' refers to the Customer's ID
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance();
  try {
    const customerIdStr = params.id;
    const customerId = parseInt(customerIdStr, 10);

    if (isNaN(customerId)) {
      return new NextResponse('Invalid customer ID format', { status: 400 });
    }

    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return new NextResponse(`Customer with ID ${customerIdStr} not found`, { status: 404 });
    }

    const users = await db.User.findAll({
      where: { customerId: customerId }, // Filter by the customerId foreign key
      attributes: { exclude: ['password'] } // Exclude password directly in the query
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('[API_CUSTOMER_USERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
