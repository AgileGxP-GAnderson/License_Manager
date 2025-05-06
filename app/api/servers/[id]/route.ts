import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { ServerInput } from '@/lib/models/server'; // Import input type

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const serverId = parseInt(id, 10);

    if (isNaN(serverId)) {
      return new NextResponse('Invalid server ID format', { status: 400 });
    }

    const server = await db.Server.findByPk(serverId);

    if (!server) {
      return new NextResponse('Server not found', { status: 404 });
    }

    const { fingerprint, ...safeServer } = server.get({ plain: true });
    return NextResponse.json(safeServer);

  } catch (error) {
    console.error('[API_SERVER_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const serverId = parseInt(id, 10);

        if (isNaN(serverId)) {
             return new NextResponse('Invalid server ID format', { status: 400 });
        }

        const server = await db.Server.findByPk(serverId);

        if (!server) {
            return new NextResponse('Server not found', { status: 404 });
        }

        const body: Partial<ServerInput> = await request.json();
        const { id: bodyId, createdAt, updatedAt, ...updateDataInput } = body;
        const updateData: Partial<ServerInput> = { ...updateDataInput }; // Clone

        if (updateData.fingerprint !== undefined) {
             try {
                 if (typeof updateData.fingerprint !== 'string') {
                     throw new Error('fingerprint must be a Base64 string');
                 }
                 updateData.fingerprint = Buffer.from(updateData.fingerprint, 'base64');
             } catch (e) {
                 return new NextResponse('Invalid Base64 encoding for fingerprint', { status: 400 });
             }
        } else {
             delete updateData.fingerprint;
        }

        await server.update(updateData);

        const { fingerprint, ...safeUpdatedServer } = server.get({ plain: true });
        return NextResponse.json(safeUpdatedServer);

    } catch (error: any) {
        console.error('[API_SERVER_PUT]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return new NextResponse('Server name or fingerprint already in use by another server.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const serverId = parseInt(id, 10);

        if (isNaN(serverId)) {
             return new NextResponse('Invalid server ID format', { status: 400 });
        }

        const server = await db.Server.findByPk(serverId);

        if (!server) {
            return new NextResponse('Server not found', { status: 404 });
        }

        await server.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error: any) {
        console.error('[API_SERVER_DELETE]', error);
         if (error.name === 'SequelizeForeignKeyConstraintError') {
            return new NextResponse('Cannot delete server because it is associated with license ledger entries.', { status: 409 });
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
