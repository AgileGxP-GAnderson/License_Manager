import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { Op } from 'sequelize'; // Import Op if needed for search/filtering

export async function GET(request: NextRequest) {
  console.log('API Hit getCustomers!');
  debugger;
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessName = searchParams.get('businessName');

    if (businessName) {
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
      const customers = await db.Customer.findAll();
      return NextResponse.json(customers);
    }
  } catch (error) {
    console.error('[API_CUSTOMERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body = await request.json();
        const { businessName, contactName } = body;

        if (!businessName || !contactName) {
            return new NextResponse('Business name and contact name are required', { status: 400 });
        }

        const newCustomer = await db.Customer.create(body);
        return NextResponse.json(newCustomer, { status: 201 });

    } catch (error) {
        console.error('[API_CUSTOMERS_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
