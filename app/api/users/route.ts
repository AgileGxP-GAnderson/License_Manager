import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { UserInput } from '@/lib/models/user'; // Import input type
import Customer from '@/lib/models/customer'; // Import Customer for validation

// Handler for GET /api/users (Get all users)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // Adapted from getAllUsers
    const users = await db.User.findAll({
        include: [{ model: Customer, as: 'customer' }] // Include customer data
    });

    // Omit passwordEncrypted from the response
    const safeUsers = users.map(user => {
        const { passwordEncrypted, ...rest } = user.get({ plain: true });
        // Optionally refine what 'customer' data is returned if needed
        return rest;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('[API_USERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/users (Create a new user)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body: UserInput = await request.json();
        const { customerId, firstName, lastName, login, email, passwordEncrypted, isActive } = body;

        // Basic validation (adapted from createUser)
        if (customerId === undefined || !firstName || !lastName || !login || !email || !passwordEncrypted || isActive === undefined) {
            return new NextResponse('Missing required user fields', { status: 400 });
        }

        // Validate customerId existence
        const customerExists = await db.Customer.findByPk(customerId);
        if (!customerExists) {
             return new NextResponse(`Customer with ID ${customerId} not found.`, { status: 400 });
        }

        // Note: Handle passwordEncrypted Buffer input.
        // Assuming body.passwordEncrypted is sent Base64 encoded
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

        const newUser = await db.User.create(createData);

        // Fetch again to include customer data and omit password
        const result = await db.User.findByPk(newUser.id, {
             include: [{ model: Customer, as: 'customer' }]
        });

        if (!result) {
             // Should not happen, but handle defensively
             return new NextResponse('Failed to retrieve created user', { status: 500 });
        }

        const { passwordEncrypted: _, ...safeNewUser } = result.get({ plain: true });
        return NextResponse.json(safeNewUser, { status: 201 });

    } catch (error: any) { // Catch specific error types if possible
        console.error('[API_USERS_POST]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return new NextResponse('User with this login or email already exists.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
