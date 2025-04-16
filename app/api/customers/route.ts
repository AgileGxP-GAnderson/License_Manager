import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { Op } from 'sequelize'; // Import Op if needed for search/filtering

// Handler for GET /api/customers (Get all customers)
// Also handles GET /api/customers?businessName=... (Search)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessName = searchParams.get('businessName');

    if (businessName) {
      // Handle search logic (adapted from searchCustomers)
      console.log('API Hit searchCustomers!');
      const regexPattern = `^${businessName}`;
      const customers = await db.Customer.findAll({
          where: {
              businessName: {
                  [Op.iRegexp]: regexPattern
              }
          }
      });
      return NextResponse.json(customers);

    } else {
      // Handle get all logic (adapted from getAllCustomers)
      const customers = await db.Customer.findAll();
      return NextResponse.json(customers);
    }
  } catch (error) {
    console.error('[API_CUSTOMERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/customers (Create a new customer)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body = await request.json();
        const { businessName, contactName } = body;

        // Basic validation (adapted from createCustomer)
        if (!businessName || !contactName) {
            return new NextResponse('Business name and contact name are required', { status: 400 });
        }

        // Use the whole body, assuming it matches CustomerInput structure
        const newCustomer = await db.Customer.create(body);
        return NextResponse.json(newCustomer, { status: 201 });

    } catch (error) {
        console.error('[API_CUSTOMERS_POST]', error);
         // Add specific error handling e.g., unique constraints if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
