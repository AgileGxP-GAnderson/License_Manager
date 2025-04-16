import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { AdministratorInput } from '@/lib/models/administrator'; // Import input type

// Handler for GET /api/administrators (Get all administrators)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // Adapted from getAllAdministrators
    const administrators = await db.Administrator.findAll();

    // Omit passwordEncrypted from the response
    const safeAdmins = administrators.map(admin => {
        const { passwordEncrypted, ...rest } = admin.get({ plain: true });
        return rest;
    });

    return NextResponse.json(safeAdmins);
  } catch (error) {
    console.error('[API_ADMINISTRATORS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/administrators (Create a new administrator)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body: AdministratorInput = await request.json();
        const { firstName, lastName, login, email, passwordEncrypted, isActive } = body;

        // Basic validation (adapted from createAdministrator)
        if (!firstName || !lastName || !login || !email || !passwordEncrypted || isActive === undefined) {
            return new NextResponse('Missing required administrator fields', { status: 400 });
        }

        // Note: Handle passwordEncrypted Buffer input (assuming Base64)
        let actualPasswordBuffer: Buffer;
        try {
            if (typeof passwordEncrypted !== 'string') {
                throw new Error('passwordEncrypted must be a Base64 string');
            }
            actualPasswordBuffer = Buffer.from(passwordEncrypted, 'base64');
        } catch (e) {
            return new NextResponse('Invalid Base64 encoding for passwordEncrypted', { status: 400 });
        }

        const createData = { ...body, passwordEncrypted: actualPasswordBuffer };

        const newAdministrator = await db.Administrator.create(createData);

        // Omit passwordEncrypted from the response
        const { passwordEncrypted: _, ...safeNewAdmin } = newAdministrator.get({ plain: true });
        return NextResponse.json(safeNewAdmin, { status: 201 });

    } catch (error: any) {
        console.error('[API_ADMINISTRATORS_POST]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return new NextResponse('Administrator with this login or email already exists.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
