import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db';
import { PurchaseOrderInput } from '@/lib/models/purchaseOrder';
import { WhereOptions, Sequelize } from 'sequelize';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerIdStr = searchParams.get('customerId');
  let customerId: number | null = null;
  const whereClause: WhereOptions<any> = {}; // Changed PurchaseOrder to any for broader compatibility with dbInstance.PurchaseOrder
  console.log('[API_PURCHASE_ORDERS_GET] customerId:', customerIdStr);

  if (customerIdStr) {
    customerId = parseInt(customerIdStr, 10);
    if (!isNaN(customerId)) {
      whereClause.customerId = customerId;
    } else {
      return NextResponse.json({ message: 'Invalid customer ID format' }, { status: 400 });
    }
  }

  try {
    const dbInstance = getDbInstance();
    // const sequelize = dbInstance.sequelize; // sequelize variable not used directly, can be removed if not needed elsewhere

    const purchaseOrdersData = await dbInstance.PurchaseOrder.findAll({
      where: whereClause,
      attributes: [
        'id',
        'poName',
        'purchaseDate',
        'customerId',
        'isClosed'
      ],
      include: [
        {
          model: dbInstance.Customer, // Use dbInstance.Customer
          as: 'customer',
          attributes: ['id', 'businessName']
        },
        {
          model: dbInstance.License, // Use dbInstance.License
          as: 'licenses',
          attributes: [
            'id',
            'uniqueId',
            'externalName',
            'typeId',
            'licenseStatusId',
          ],
          through: {
            model: dbInstance.POLicenseJoin, // Use dbInstance.POLicenseJoin
            as: 'poLicenseJoin',
            attributes: ['duration']
          },
          required: false,
          include: [
            {
              model: dbInstance.LicenseTypeLookup, // Use dbInstance.LicenseTypeLookup
              as: 'type',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              model: dbInstance.LicenseStatusLookup, // Use dbInstance.LicenseStatusLookup
              as: 'licenseStatus',
              attributes: ['name'],
              required: false,
            },
            {
              model: dbInstance.Server, // Use dbInstance.Server
              as: 'server',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ],
      order: [['purchaseDate', 'DESC'], ['poName', 'ASC']], // Example ordering
    });

    const processedPOs = purchaseOrdersData.map(poInstance => {
        const poJson = poInstance.toJSON(); // Convert to plain object

        poJson.licenses = poJson.licenses?.map((license: any) => {
            const duration = license.poLicenseJoin?.duration;
            const latestLedgerEntry = license.ledgerEntries?.[0];

            return {
                ...license,
                totalDuration: duration, // Add duration directly
                latestServerName: latestLedgerEntry?.server?.name ?? null,
                status: license.licenseStatus?.name ?? 'Unknown', // +++ Use 'name' from joined table again
                activationDate: latestLedgerEntry?.activityDate ?? null, // Use latest activity date
                expirationDate: latestLedgerEntry?.expirationDate ?? null, // Use ledger expiration date

                poLicenseJoin: undefined,
                ledgerEntries: undefined, // Remove original nested ledger entry if flattened fields are used
            };
        }) ?? [];

        return poJson;
    });


    return NextResponse.json(processedPOs); // Return the processed data

  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch purchase orders', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const rawBody = await request.json();

    const processedBody: PurchaseOrderInput = {
      ...rawBody, // Spread rawBody to include any other fields passed by client
      poName: rawBody.poName,
      purchaseDate: new Date(rawBody.purchaseDate), // Convert string to Date object
      customerId: Number(rawBody.customerId),       // Convert string/any to number
      isClosed: (rawBody.isClosed === undefined || rawBody.isClosed === null) ? false : Boolean(rawBody.isClosed),
    };

    if (!processedBody.poName || !processedBody.purchaseDate || isNaN(processedBody.customerId)) {
      if (isNaN(processedBody.purchaseDate.getTime())) {
        return new NextResponse('Invalid or missing purchaseDate', { status: 400 });
      }
      return new NextResponse('Missing required fields (e.g., poName, purchaseDate, customerId)', { status: 400 });
    }

    const customerExists = await db.Customer.findByPk(processedBody.customerId);
    if (!customerExists) {
      return new NextResponse(`Customer with ID ${processedBody.customerId} not found.`, { status: 400 });
    }

    const newPurchaseOrder = await db.PurchaseOrder.create(processedBody);
    const result = await db.PurchaseOrder.findByPk(newPurchaseOrder.id, {
      include: [{ model: db.Customer, as: 'customer' }]
    });
    return NextResponse.json(result, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('[API_PURCHASE_ORDERS_POST]', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return new NextResponse('A purchase order with this number might already exist.', { status: 409 }); // 409 Conflict
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
