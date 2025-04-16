import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getDbInstance } from '../../lib/db';
const db = getDbInstance();
import { Sequelize } from 'sequelize';
// Import the route handlers
import * as usersRoute from '../../app/api/users/route';
import * as userIdRoute from '../../app/api/users/[id]/route';
import * as customersRoute from '../../app/api/customers/route'; // To create customer dependency
import { UserOutput, UserInput } from '@/lib/models/user';
import { CustomerOutput, CustomerInput } from '@/lib/models/customer';

// Helper function
function createMockNextRequest(options: any): NextRequest {
    const { req } = createMocks(options);
    req.nextUrl = { // @ts-ignore
        searchParams: new URLSearchParams(options.query || {}),
    }; // @ts-ignore
    req.json = async () => options.body || {};
    return req as unknown as NextRequest;
}

// Helper to create a customer via API
async function createCustomerViaApi(data: Partial<CustomerInput>): Promise<CustomerOutput> {
    const req = createMockNextRequest({ method: 'POST', body: data });
    const response = await customersRoute.POST(req);
    if (response.status !== 201) {
        throw new Error(`Failed to create customer for test setup: ${response.status}`);
    }
    return await response.json();
}

// Helper to create a user via API
async function createUserViaApi(data: Partial<UserInput>): Promise<UserOutput> {
     const passwordString = data.passwordEncrypted instanceof Buffer
        ? data.passwordEncrypted.toString('utf8')
        : data.passwordEncrypted || 'defaultPassword';
    const finalPasswordString = typeof passwordString === 'string' ? passwordString : 'defaultPassword';
    const passwordInput = Buffer.from(finalPasswordString).toString('base64');

    const apiData = {
        ...data,
        login: data.login || faker.internet.userName() + `-${Date.now()}`,
        email: data.email || faker.internet.email(), // Use standard faker email
        passwordEncrypted: passwordInput
    };
    const req = createMockNextRequest({ method: 'POST', body: apiData });
    const response = await usersRoute.POST(req);
     if (response.status !== 201) {
        const errorText = await response.text();
        throw new Error(`Failed to create user for test setup: ${response.status} - ${errorText}`);
    }
    const jsonResponse = await response.json();
    const createdUser = await db.User.findByPk(jsonResponse.id, { include: [{ model: db.Customer, as: 'customer' }]});
     if (!createdUser) {
        throw new Error('Failed to retrieve created user from DB');
    }
    return createdUser.get({ plain: true }) as UserOutput;
}


describe('User API Routes', () => {
  let sequelize: Sequelize;
  let testCustomer: CustomerOutput;

  beforeAll(async () => {
    sequelize = db.sequelize;
    // Global setup handles DB sync
    testCustomer = await createCustomerViaApi({
        businessName: `UserTestCust-${Date.now()}`,
        contactName: faker.person.fullName(),
    });
  });

   afterAll(async () => {
    await sequelize.close();
  });

  // --- Test POST /api/users ---
  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const newUserData = {
        customerId: testCustomer.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        login: faker.internet.userName() + `-${Date.now()}`, // Ensure unique
        email: faker.internet.email(), // Use standard faker email
        passwordEncrypted: Buffer.from(faker.internet.password()).toString('base64'),
        isActive: true,
      };

      const req = createMockNextRequest({ method: 'POST', body: newUserData });
      const response = await usersRoute.POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id');
      expect(json.firstName).toBe(newUserData.firstName);
      expect(json.login).toBe(newUserData.login);
      expect(json.customerId).toBe(testCustomer.id);
      expect(json).not.toHaveProperty('passwordEncrypted');

      // Verify in DB
      const userInDb = await db.User.findByPk(json.id);
      expect(userInDb).not.toBeNull();
      expect(userInDb?.login).toBe(newUserData.login);
    });

     it('should return 400 if required fields are missing', async () => {
        const incompleteData = { firstName: 'Test', lastName: 'User', customerId: testCustomer.id };
        const req = createMockNextRequest({ method: 'POST', body: incompleteData });
        const response = await usersRoute.POST(req);
        expect(response.status).toBe(400);
    });

     it('should return 400 if customerId does not exist', async () => {
        const userData = {
            customerId: 999999,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            login: faker.internet.userName() + `-${Date.now()}`,
            email: faker.internet.email(),
            passwordEncrypted: Buffer.from(faker.internet.password()).toString('base64'),
            isActive: true,
        };
        const req = createMockNextRequest({ method: 'POST', body: userData });
        const response = await usersRoute.POST(req);
        expect(response.status).toBe(400);
    });

     // Add test for 409 conflict (similar to administrator test)
     it('should return 409 if login already exists', async () => {
        const uniqueLogin = `userlogin-${Date.now()}`;
        const user1 = await createUserViaApi({
            customerId: testCustomer.id, firstName: 'Existing', lastName: 'User', login: uniqueLogin,
            email: faker.internet.email(), passwordEncrypted: Buffer.from('password'), isActive: true
        });
        const duplicateData = {
            customerId: testCustomer.id, firstName: 'New', lastName: 'Person', login: user1.login, // Duplicate login
            email: faker.internet.email(), passwordEncrypted: Buffer.from('password').toString('base64'), isActive: true
        };
        const req = createMockNextRequest({ method: 'POST', body: duplicateData });
        const response = await usersRoute.POST(req);
        expect(response.status).toBe(409);
    });
  });

  // --- Test GET /api/users ---
  describe('GET /api/users', () => {
     it('should return a list containing created users', async () => {
        const user1 = await createUserViaApi({ customerId: testCustomer.id, firstName: 'ListUser1', lastName: 'Test', login: `listU1-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw1'), isActive: true });
        const user2 = await createUserViaApi({ customerId: testCustomer.id, firstName: 'ListUser2', lastName: 'Test', login: `listU2-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw2'), isActive: false });

        const req = createMockNextRequest({ method: 'GET' });
        const response = await usersRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        const responseUsers = json as UserOutput[];
        expect(responseUsers.some((u) => u.id === user1.id)).toBe(true);
        expect(responseUsers.some((u) => u.id === user2.id)).toBe(true);
        if (responseUsers.length > 0) {
            expect(responseUsers[0]).not.toHaveProperty('passwordEncrypted');
        }
     });
  });

  // --- Test GET /api/users/:id ---
  describe('GET /api/users/:id', () => {
    it('should return a specific user if found', async () => {
        const user = await createUserViaApi({ customerId: testCustomer.id, firstName: 'FetchUser', lastName: 'Test', login: `fetchU-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw'), isActive: true });
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: user.id.toString() } };

        const response = await userIdRoute.GET(req, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.id).toBe(user.id);
        expect(json.login).toBe(user.login);
        expect(json.customerId).toBe(testCustomer.id);
        expect(json).not.toHaveProperty('passwordEncrypted');
    });

     it('should return 404 if user not found', async () => {
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: '999999' } };
        const response = await userIdRoute.GET(req, context);
        expect(response.status).toBe(404);
    });
  });

   // --- Test PUT /api/users/:id ---
   describe('PUT /api/users/:id', () => {
        it('should update an existing user', async () => {
            const user = await createUserViaApi({ customerId: testCustomer.id, firstName: 'UpdateUser', lastName: 'Old', login: `updateU-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw'), isActive: true });
            const updateData = { lastName: 'New', isActive: false };

            const req = createMockNextRequest({ method: 'PUT', body: updateData });
            const context = { params: { id: user.id.toString() } };
            const response = await userIdRoute.PUT(req, context);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.id).toBe(user.id);
            expect(json.lastName).toBe(updateData.lastName);
            expect(json.isActive).toBe(updateData.isActive);
            expect(json).not.toHaveProperty('passwordEncrypted');

            // Verify update in DB
            const updatedUserDb = await db.User.findByPk(user.id);
            expect(updatedUserDb?.lastName).toBe(updateData.lastName);
            expect(updatedUserDb?.isActive).toBe(updateData.isActive);
        });
   });

    // --- Test DELETE /api/users/:id ---
    describe('DELETE /api/users/:id', () => {
        it('should delete an existing user', async () => {
            const user = await createUserViaApi({ customerId: testCustomer.id, firstName: 'DeleteUser', lastName: 'Test', login: `deleteU-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw'), isActive: true });
            const userId = user.id;

            const req = createMockNextRequest({ method: 'DELETE' });
            const context = { params: { id: userId.toString() } };
            const response = await userIdRoute.DELETE(req, context);

            expect(response.status).toBe(204);

             // Verify in DB
            const deletedUser = await db.User.findByPk(userId);
            expect(deletedUser).toBeNull();
        });
   });

});
