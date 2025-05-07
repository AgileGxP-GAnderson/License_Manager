import { NextRequest, NextResponse } from 'next/server';
import { Customer, getDbInstance } from '@/lib/db'; // Assuming you have this
import bcrypt from 'bcryptjs'; // <-- Import bcrypt
import type { User } from '@/lib/types'; // Assuming User type is defined

interface UserInput {
    customerId: string; // Should be string if coming from store state
    firstName: string;
    lastName: string;
    login: string;
    email: string;
    passwordEncrypted: string; // Changed from password to passwordEncrypted
    isActive: boolean;
}

export async function GET(request: NextRequest) {
  const db = getDbInstance();
  const { searchParams } = request.nextUrl; // Use request.nextUrl for searchParams
  const customerId = searchParams.get('customerId');

  try {
    const findOptions: any = { // Consider defining a more specific Sequelize FindOptions type
      include: [{ model: db.Customer, as: 'customer' }] // Restored include and ensured db.Customer is used
    };

    if (customerId) {
      const customerIdNum = parseInt(customerId, 10);
      if (isNaN(customerIdNum)) {
        console.error('[API_USERS_GET] Invalid customerId format:', customerId);
        return new NextResponse('Invalid customerId format', { status: 400 });
      }
      findOptions.where = { customerId: customerIdNum };
    } else {
      // Handle fetching all users if customerId is not provided, or return an error/empty array
      // For now, it fetches all users if no customerId is present.
    }

    const users = await db.User.findAll(findOptions);

    const safeUsers = users.map((userInstance: any) => {
      const { passwordEncrypted, ...rest } = userInstance.toJSON();
      return rest;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('[API_USERS_GET] Error fetching users. CustomerId:', customerId, 'Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    console.log('API Hit POST /api/users');
    const db = getDbInstance();
    try {
        const body: UserInput = await request.json();
        console.log('Received body:', body);

        const { customerId, firstName, lastName, login, email, passwordEncrypted, isActive } = body; // Changed from password

        console.log('API pre-validation');
        const customerIdNum = parseInt(customerId, 10);
        if (isNaN(customerIdNum) || !firstName || !lastName || !login || !email || !passwordEncrypted || isActive === undefined) {
            console.error('Validation failed: Missing fields', { customerId, customerIdNum, firstName, lastName, login, email, password_present: !!passwordEncrypted, isActive }); // Logging based on passwordEncrypted
            return new NextResponse('Missing required user fields (customerId, firstName, lastName, login, email, passwordEncrypted, isActive)', { status: 400 });
        }
        console.log('API post-validation');

        const customerExists = await db.Customer.findByPk(customerIdNum);
        if (!customerExists) {
             console.error(`Validation failed: Customer not found with ID ${customerIdNum}`);
             return new NextResponse(`Customer with ID ${customerIdNum} not found.`, { status: 400 });
        }
        console.log('Customer exists check passed');


        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(passwordEncrypted, 10); // Hashing passwordEncrypted
        console.log('Password hashed');

        const createData = {
            customerId: customerIdNum,
            firstName,
            lastName,
            login,
            email,
            passwordEncrypted: hashedPassword, // Storing hashed password in passwordEncrypted field
            isActive,
        };
        console.log('Prepared createData (password omitted):', { ...createData, passwordEncrypted: '*** HASHED ***'}); // Logging passwordEncrypted

        const newUser = await db.User.create(createData);
        console.log('User created in DB:', newUser.toJSON());

        const { passwordEncrypted: _, ...userWithoutPassword } = newUser.toJSON(); // Destructuring passwordEncrypted
        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error: any) {
        console.error('[API_USERS_POST] Error:', error);
         if (error.name === 'SequelizeUniqueConstraintError') {
             return new NextResponse('Username or Email already exists.', { status: 409 }); // Conflict
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
