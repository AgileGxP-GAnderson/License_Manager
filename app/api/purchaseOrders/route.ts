import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { PurchaseOrderInput } from '@/lib/models/purchaseOrder'; // Import input type
import License from '@/lib/models/license'; // *** Import the License model ***
import Customer from '@/lib/models/customer'; // Import Customer for association include & validation
import PurchaseOrder from '@/lib/models/purchaseOrder';
import { WhereOptions, Sequelize } from 'sequelize'; // *** Import Sequelize ***

import db from '@/lib/models';

// Handler for GET /api/purchaseOrders (Get POs, optionally filtered by customerId, including associated licenses with summed duration from join table)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerIdStr = searchParams.get('customerId');
  let customerId: number | null = null;
  const whereClause: any = {}; // Define base where clause
  console.log('[API_PURCHASE_ORDERS_GET] customerId:', customerIdStr); // Debugging log

  if (customerIdStr) {
    customerId = parseInt(customerIdStr, 10);
    if (!isNaN(customerId)) {
      whereClause.customerId = customerId; // Add customerId to filter criteria
    } else {
      // Handle invalid customerId if necessary
      return NextResponse.json({ message: 'Invalid customer ID format' }, { status: 400 });
    }
  }

  try {
    // Fetch Purchase Orders and include associated Licenses with summed duration
    const db = getDbInstance();
    const sequelize = db.sequelize; // Get the Sequelize instance
    const purchaseOrders = await db.PurchaseOrder.findAll({
      where: whereClause, // Apply the filter
      attributes: [ // *** Explicitly list PurchaseOrder attributes you need ***
        'id',
        'poName',
        'purchaseDate',
        'customerId',
        'isClosed'
        // Add any other PurchaseOrder fields you select
      ],
      include: [{
        model: License,
        as: 'licenses', // *** Use the correct alias ***
        attributes: [
          // --- List the License attributes ---
          'id',
          'uniqueId',
          'externalName',
          'typeId',
          // Add other License fields as needed...

          // --- Calculate the SUM ---
          // Ensure 'po_license_join.duration' is correct
          [sequelize.literal(`SUM("licenses->POLicenseJoin"."duration")`), 'totalDuration']
        ],
        through: {
          // Exclude join table attributes from the result object
          attributes: []
        },
        // *** REMOVE 'group' from here ***
      }],
      // --- MOVE 'group' to the top level ---
      group: [
        // Group by all selected PurchaseOrder attributes
        'PurchaseOrder.id', // Essential for grouping main model instances
        'PurchaseOrder.poName',
        'PurchaseOrder.purchaseDate',
        'PurchaseOrder.customerId',
        'PurchaseOrder.isClosed',
        // Add any other selected PurchaseOrder fields here...

        // Group by all selected non-aggregated License attributes
        // Use the alias 'licenses.' here
        'licenses.id',
        'licenses.uniqueId',
        'licenses.externalName',
        'licenses.typeId'
        // Add other selected non-aggregated License fields here...

        // Grouping by join table keys might be needed depending on DB/exact setup
        // Often grouping by the included model's PK ('licenses.id') is enough
        // 'licenses->po_license_join.purchaseOrderId', // Syntax if needed
        // 'licenses->po_license_join.licenseId',      // Syntax if needed
      ],
      order: [['purchaseDate', 'DESC']], // Corrected: Use actual column name
      // subQuery: false, // Add if you face issues with LIMIT/OFFSET and grouping
    });

    return NextResponse.json(purchaseOrders);

  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    // Type assertion for error object if needed
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch purchase orders', error: errorMessage }, { status: 500 });
  }
}

// Handler for POST /api/purchaseOrders (Create a new purchase order)
export async function POST(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // console.log('[API_PURCHASE_ORDERS_POST] Request body:', request.body); // Log the request body for debugging - Note: request.body is a stream, use request.json()
    const body: PurchaseOrderInput = await request.json();
    // Use the actual fields from your PurchaseOrderInput/Model
    // Assuming fields like 'purchaseOrderNumber', 'purchaseOrderDate' based on previous suggestions
    // Adjust these based on your actual model definition in purchaseOrder.ts
    const { poName, purchaseDate, customerId, /* other fields like notes, isClosed etc. */ } = body;

    // Basic validation - adjust field names as per your model
    if (!poName || !purchaseDate || customerId === undefined /* add other required fields */) {
      return new NextResponse('Missing required fields (e.g., purchaseOrderNumber, purchaseOrderDate, customerId)', { status: 400 });
    }

    // Validate customerId existence
    const customerExists = await db.Customer.findByPk(customerId);
    if (!customerExists) {
      return new NextResponse(`Customer with ID ${customerId} not found.`, { status: 400 });
    }

    // Note: Handling associated licenses would require additional logic here if creating them simultaneously

    const newPurchaseOrder = await db.PurchaseOrder.create(body);
    // Fetch again to include customer data in response
    const result = await db.PurchaseOrder.findByPk(newPurchaseOrder.id, {
      include: [{ model: Customer, as: 'customer' }]
    });
    return NextResponse.json(result, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('[API_PURCHASE_ORDERS_POST]', error);
    // Add specific error handling (e.g., unique constraints) if needed
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Adjust message based on what constraint failed (e.g., purchaseOrderNumber)
      return new NextResponse('A purchase order with this number might already exist.', { status: 409 }); // 409 Conflict
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
