import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { ServerInput } from '@/lib/models/server'; // Import input type

// Handler for GET /api/servers (Get all servers)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // Adapted from getAllServers
    const servers = await db.Server.findAll();

    // Omit fingerprint from the response
    const safeServers = servers.map(server => {
        const { fingerprint, ...rest } = server.get({ plain: true });
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
        const { name, fingerprint, isActive } = body;

        // Basic validation (adapted from createServer)
        if (!name || !fingerprint || isActive === undefined) {
            return new NextResponse('Missing required server fields (name, fingerprint, isActive)', { status: 400 });
        }

        // Note: Handle fingerprint Buffer input (assuming Base64)
        let actualFingerprintBuffer: Buffer;
        try {
            if (typeof fingerprint !== 'string') {
                throw new Error('fingerprint must be a Base64 string');
            }
            actualFingerprintBuffer = Buffer.from(fingerprint, 'base64');
        } catch (e) {
            return new NextResponse('Invalid Base64 encoding for fingerprint', { status: 400 });
        }

        const createData = { ...body, fingerprint: actualFingerprintBuffer };

        const newServer = await db.Server.create(createData);

        // Omit fingerprint from the response
        const { fingerprint: _, ...safeNewServer } = newServer.get({ plain: true });
        return NextResponse.json(safeNewServer, { status: 201 });

    } catch (error: any) {
        console.error('[API_SERVERS_POST]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Could be name or fingerprint
            return new NextResponse('Server with this name or fingerprint already exists.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
