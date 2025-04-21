import { NextRequest, NextResponse } from 'next/server';
import { Customer, getDbInstance } from '@/lib/db'; // Assuming you have this
import bcrypt from 'bcryptjs'; // <-- Import bcrypt
import type { User } from '@/lib/types'; // Assuming User type is defined

// Define expected input type (matching frontend payload + customerId)
interface UserInput {
    customerId: string; // Should be string if coming from store state
    firstName: string;
    lastName: string;
    login: string;
    email: string;
    password: string; // Expect plain password
    isActive: boolean;
}

// --- GET Handler remains the same ---
export async function GET(request: NextRequest) {
  const db = getDbInstance();
  try {
    // Example: Fetch all users (adjust as needed, e.g., filter by customerId from query params)
    const users = await db.User.findAll({
        include: [{ model: Customer, as: 'customer' }] // Include customer data
    });

    // IMPORTANT: Never return passwords, even hashed ones, in GET requests
    const safeUsers = users.map((user: any) => { // Use 'any' or define a proper DB model type
        const { password, ...rest } = user.toJSON(); // Assuming your DB field is password
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
    console.log('API Hit POST /api/users');
    const db = getDbInstance();
    try {
        const body: UserInput = await request.json();
        console.log('Received body:', body);

        // --- UPDATE Destructuring: Expect 'password' ---
        const { customerId, firstName, lastName, login, email, password, isActive } = body;

        // --- UPDATE Validation: Check for 'password' ---
        console.log('API pre-validation');
        // Ensure customerId is treated as a number if your DB expects it
        const customerIdNum = parseInt(customerId, 10);
        if (isNaN(customerIdNum) || !firstName || !lastName || !login || !email || !password || isActive === undefined) {
            console.error('Validation failed: Missing fields', { customerId, customerIdNum, firstName, lastName, login, email, password_present: !!password, isActive });
            // Be more specific in error message if possible
            return new NextResponse('Missing required user fields (customerId, firstName, lastName, login, email, password, isActive)', { status: 400 });
        }
        console.log('API post-validation');

        // Validate customerId existence
        const customerExists = await db.Customer.findByPk(customerIdNum);
        if (!customerExists) {
             console.error(`Validation failed: Customer not found with ID ${customerIdNum}`);
             return new NextResponse(`Customer with ID ${customerIdNum} not found.`, { status: 400 });
        }
        console.log('Customer exists check passed');

        // --- REMOVE Base64 decoding ---
        // let actualPasswordBuffer: Buffer;
        // try {
        //     if (typeof password !== 'string') {
        //         throw new Error('password must be a Base64 string');
        //     }
        //     actualPasswordBuffer = Buffer.from(password, 'base64');
        // } catch (e) {
        //     return new NextResponse('Invalid Base64 encoding for password', { status: 400 });
        // }

        // --- ADD Password Hashing ---
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the plain password (salt rounds = 10)
        console.log('Password hashed');

        // --- UPDATE Create Data: Use 'hashedPassword' and correct DB field name ---
        // Ensure the field name matches your Sequelize model definition (e.g., 'password' or 'passwordHash')
        const createData = {
            customerId: customerIdNum, // Use the parsed number
            firstName,
            lastName,
            login,
            email,
            password: hashedPassword, // <-- Store the HASHED password in the correct DB field
            isActive,
        };
        console.log('Prepared createData (password omitted):', { ...createData, password: '*** HASHED ***'});

        // --- Create user in DB ---
        const newUser = await db.User.create(createData);
        console.log('User created in DB:', newUser.toJSON()); // Log created user

        // --- Return the created user (excluding password) ---
        // Rename 'password' from the DB object to avoid redeclaration
        const { password: _, ...userWithoutPassword } = newUser.toJSON(); // Use '_' or another name like 'dbPassword'
        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error: any) {
        console.error('[API_USERS_POST] Error:', error);
         if (error.name === 'SequelizeUniqueConstraintError') {
             // Check which constraint failed if possible (e.g., login or email)
             return new NextResponse('Username or Email already exists.', { status: 409 }); // Conflict
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
