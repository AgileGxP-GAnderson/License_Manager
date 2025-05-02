import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import ServerAttributes, { ServerInput } from '@/lib/models/server'; // Import ServerAttributes as default and ServerInput as named
import { WhereOptions } from 'sequelize'; // Import WhereOptions

// Handler for GET /api/servers (Get servers, optionally filtered by customerId)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const { searchParams } = new URL(request.url);
    const customerIdParam = searchParams.get('customerId');

    const whereClause: WhereOptions<ServerAttributes> = {}; // Initialize empty where clause

    if (customerIdParam) {
      const customerId = parseInt(customerIdParam, 10);
      if (isNaN(customerId)) {
        return new NextResponse('Invalid customer ID format', { status: 400 });
      }
      whereClause.customerId = customerId; // Add customerId to the where clause
    }

    // Fetch servers using the where clause (now correctly typed)
    const servers = await db.Server.findAll({ where: whereClause });

    // Omit fingerprint from the response
    const safeServers = servers.map(server => {
        // Ensure fingerprint exists before destructuring, though it should based on model
        const serverData = server.get({ plain: true });
        const { fingerprint, ...rest } = serverData;
        return rest;
    });

    return NextResponse.json(safeServers);
  } catch (error) {
    console.error('[API_SERVERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/servers (Create a new server)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body: ServerInput = await request.json();
        // Destructure customerId from body
        const { name, fingerprint, isActive, customerId, description } = body;

        // Basic validation (adapted from createServer)
        // Add customerId validation
        if (!name || !fingerprint || isActive === undefined || customerId === undefined) {
            return new NextResponse('Missing required server fields (customerId, name, fingerprint, isActive)', { status: 400 });
        }

        // Validate customerId type/value if necessary (e.g., ensure it's a positive integer)
        if (typeof customerId !== 'number' || customerId <= 0) {
             return new NextResponse('Invalid customerId', { status: 400 });
        }

        // Note: Handle fingerprint Buffer input (assuming Base64)
        let actualFingerprintBuffer: Buffer;
        try {
            // Fingerprint might be passed as string (base64) or already Buffer
            if (typeof fingerprint === 'string') {
                actualFingerprintBuffer = Buffer.from(fingerprint, 'base64');
            } else if (Buffer.isBuffer(fingerprint)) {
                actualFingerprintBuffer = fingerprint;
            } else {
                 throw new Error('fingerprint must be a Base64 string or a Buffer');
            }
        } catch (e: any) {
            return new NextResponse(`Invalid format for fingerprint: ${e.message}`, { status: 400 });
        }

        // Create the server
        const newServer = await db.Server.create({
            customerId,
            name,
            fingerprint: actualFingerprintBuffer,
            isActive,
            description: description ?? null, // Handle optional description
        });

        // Omit fingerprint from the response
        const { fingerprint: _, ...safeNewServer } = newServer.get({ plain: true });
        return NextResponse.json(safeNewServer, { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error('[API_SERVERS_POST]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Could be name or fingerprint per customer
            return new NextResponse('Server name or fingerprint already in use for this customer.', { status: 409 });
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return new NextResponse('Invalid customerId provided.', { status: 400 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
