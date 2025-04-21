import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { AdministratorInput } from '@/lib/models/administrator'; // Import input type

interface RouteParams {
  params: {
    id: string;
  };
}

// Handler for GET /api/administrators/:id (Get administrator by ID)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const adminId = parseInt(id, 10);

    if (isNaN(adminId)) {
      return new NextResponse('Invalid administrator ID format', { status: 400 });
    }

    const administrator = await db.Administrator.findByPk(adminId);

    if (!administrator) {
      return new NextResponse('Administrator not found', { status: 404 });
    }

    // Omit password from the response
    const { password, ...safeAdmin } = administrator.get({ plain: true });
    return NextResponse.json(safeAdmin);

  } catch (error) {
    console.error('[API_ADMINISTRATOR_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for PUT /api/administrators/:id (Update administrator)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const adminId = parseInt(id, 10);

        if (isNaN(adminId)) {
             return new NextResponse('Invalid administrator ID format', { status: 400 });
        }

        const administrator = await db.Administrator.findByPk(adminId);

        if (!administrator) {
            return new NextResponse('Administrator not found', { status: 404 });
        }

        const body: Partial<AdministratorInput> = await request.json();
        // Prevent updating primary key or timestamps directly via body
        const { id: bodyId, createdAt, updatedAt, ...updateDataInput } = body;
        const updateData: Partial<AdministratorInput> = { ...updateDataInput }; // Clone

        // Handle password update (assuming Base64 input)
        if (updateData.password !== undefined) {
             try {
                 if (typeof updateData.password !== 'string') {
                     throw new Error('password must be a Base64 string');
                 }
                 updateData.password = Buffer.from(updateData.password, 'base64');
             } catch (e) {
                 return new NextResponse('Invalid Base64 encoding for password', { status: 400 });
             }
        } else {
             delete updateData.password;
        }

        await administrator.update(updateData);

        // Omit password from response
        const { password, ...safeUpdatedAdmin } = administrator.get({ plain: true });
        return NextResponse.json(safeUpdatedAdmin);

    } catch (error: any) {
        console.error('[API_ADMINISTRATOR_PUT]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return new NextResponse('Login or email already in use by another administrator.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Handler for DELETE /api/administrators/:id (Delete administrator)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const adminId = parseInt(id, 10);

        if (isNaN(adminId)) {
             return new NextResponse('Invalid administrator ID format', { status: 400 });
        }

        const administrator = await db.Administrator.findByPk(adminId);

        if (!administrator) {
            return new NextResponse('Administrator not found', { status: 404 });
        }

        await administrator.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error) {
        console.error('[API_ADMINISTRATOR_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
