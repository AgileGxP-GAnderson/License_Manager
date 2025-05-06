import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { UserInput } from '@/lib/models/user'; // Import input type
import Customer from '@/lib/models/customer'; // Import Customer for validation

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return new NextResponse('Invalid user ID format', { status: 400 });
    }

    const user = await db.User.findByPk(userId, {
        include: [{ model: Customer, as: 'customer' }] // Include customer data
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { password, ...safeUser } = user.get({ plain: true });
    return NextResponse.json(safeUser);

  } catch (error) {
    console.error('[API_USER_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
             return new NextResponse('Invalid user ID format', { status: 400 });
        }

        const user = await db.User.findByPk(userId);

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const body: Partial<UserInput> = await request.json();
        const { id: bodyId, createdAt, updatedAt, customerId: bodyCustomerId, ...updateDataInput } = body;
        const updateData: Partial<UserInput> = { ...updateDataInput }; // Clone

        if (body.customerId !== undefined && body.customerId !== user.customerId) {
             const customerExists = await db.Customer.findByPk(body.customerId);
             if (!customerExists) {
                 return new NextResponse(`Customer with ID ${body.customerId} not found.`, { status: 400 });
             }
             updateData.customerId = body.customerId; // Add it back if valid
        }

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


        await user.update(updateData);

        const updatedUser = await db.User.findByPk(userId, {
            include: [{ model: Customer, as: 'customer' }]
        });
         if (!updatedUser) {
             return new NextResponse('Failed to retrieve updated user', { status: 500 });
        }
        const { password, ...safeUpdatedUser } = updatedUser.get({ plain: true });
        return NextResponse.json(safeUpdatedUser);

    } catch (error: any) {
        console.error('[API_USER_PUT]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return new NextResponse('Login or email already in use by another user.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
             return new NextResponse('Invalid user ID format', { status: 400 });
        }

        const user = await db.User.findByPk(userId);

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        await user.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error) {
        console.error('[API_USER_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
