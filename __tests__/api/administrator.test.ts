import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getDbInstance } from '../../lib/db'; // Adjust path
const db = getDbInstance();
import { Sequelize } from 'sequelize';
// Import the route handlers
import * as administratorsRoute from '../../app/api/administrators/route';
import * as administratorIdRoute from '../../app/api/administrators/[id]/route';
import { AdministratorOutput, AdministratorInput } from '@/lib/models/administrator'; // Use alias

// Helper function (can be shared in a test utils file later)
function createMockNextRequest(options: any): NextRequest {
    const { req } = createMocks(options);
    req.nextUrl = {
        // @ts-ignore
        searchParams: new URLSearchParams(options.query || {}),
    };
    // @ts-ignore
    req.json = async () => options.body || {};
    return req as unknown as NextRequest;
}

// Helper to create an admin via API for test setup
async function createAdminViaApi(data: Partial<AdministratorInput>): Promise<AdministratorOutput> {
    // Ensure password is base64 encoded for the API call
    const passwordString = data.passwordEncrypted instanceof Buffer
        ? data.passwordEncrypted.toString('utf8')
        : data.passwordEncrypted || 'defaultPassword';
    const finalPasswordString = typeof passwordString === 'string' ? passwordString : 'defaultPassword';
    const passwordInput = Buffer.from(finalPasswordString).toString('base64');

    const apiData = {
        ...data,
        // Ensure unique login/email for setup helper if needed, or rely on global reset
        login: data.login || faker.internet.userName() + `-${Date.now()}`,
        email: data.email || faker.internet.email(), // Use standard faker email
        passwordEncrypted: passwordInput
    };
    const req = createMockNextRequest({ method: 'POST', body: apiData });
    const response = await administratorsRoute.POST(req);
    if (response.status !== 201) {
        const errorText = await response.text();
        throw new Error(`Failed to create admin for test setup: ${response.status} - ${errorText}`);
    }
    const jsonResponse = await response.json();
    const createdAdmin = await db.Administrator.findByPk(jsonResponse.id);
    if (!createdAdmin) {
        throw new Error('Failed to retrieve created admin from DB');
    }
    return createdAdmin.get({ plain: true }) as AdministratorOutput;
}


describe('Administrator API Routes', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = db.sequelize;
    // Global setup handles DB sync
  });

   afterAll(async () => {
    await sequelize.close();
  });

  // --- Test POST /api/administrators ---
  describe('POST /api/administrators', () => {
    it('should create a new administrator successfully', async () => {
      const newAdminData = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        login: faker.internet.userName() + `-${Date.now()}`, // Ensure unique login
        email: faker.internet.email(), // Use standard faker email
        passwordEncrypted: Buffer.from(faker.internet.password()).toString('base64'), // Send as base64
        isActive: true,
      };

      const req = createMockNextRequest({ method: 'POST', body: newAdminData });
      const response = await administratorsRoute.POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id');
      expect(json.firstName).toBe(newAdminData.firstName);
      expect(json.login).toBe(newAdminData.login);
      expect(json).not.toHaveProperty('passwordEncrypted');

      // Verify in DB
      const adminInDb = await db.Administrator.findByPk(json.id);
      expect(adminInDb).not.toBeNull();
      expect(adminInDb?.login).toBe(newAdminData.login);
    });

     it('should return 400 if required fields are missing', async () => {
        const incompleteData = { firstName: 'Test', lastName: 'Admin' };
        const req = createMockNextRequest({ method: 'POST', body: incompleteData });
        const response = await administratorsRoute.POST(req);
        expect(response.status).toBe(400);
    });

     it('should return 409 if login already exists', async () => {
        // Create the first admin directly or via helper
        const uniqueLogin = `login-${Date.now()}`;
        const admin1 = await createAdminViaApi({
            firstName: 'Existing', lastName: 'Admin', login: uniqueLogin,
            email: faker.internet.email(), passwordEncrypted: Buffer.from('password'), isActive: true
        });

        // Attempt to create another admin with the same login
        const duplicateData = {
            firstName: 'New', lastName: 'Person', login: admin1.login, // Use the exact same login
            email: faker.internet.email(), passwordEncrypted: Buffer.from('password').toString('base64'), isActive: true
        };
        const req = createMockNextRequest({ method: 'POST', body: duplicateData });
        const response = await administratorsRoute.POST(req); // Call handler directly
        expect(response.status).toBe(409); // Assert the expected error status
    });
  });

  // --- Test GET /api/administrators ---
  describe('GET /api/administrators', () => {
     it('should return a list containing created administrators', async () => {
        const admin1 = await createAdminViaApi({ firstName: 'ListAdmin1', lastName: 'Test', login: `list1-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw1'), isActive: true });
        const admin2 = await createAdminViaApi({ firstName: 'ListAdmin2', lastName: 'Test', login: `list2-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw2'), isActive: false });

        const req = createMockNextRequest({ method: 'GET' });
        const response = await administratorsRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        const responseAdmins = json as AdministratorOutput[];
        expect(responseAdmins.some((a) => a.id === admin1.id)).toBe(true);
        expect(responseAdmins.some((a) => a.id === admin2.id)).toBe(true);
        // Ensure password is not returned in the list
        if (responseAdmins.length > 0) {
            expect(responseAdmins[0]).not.toHaveProperty('passwordEncrypted');
        }
     });
  });

  // --- Test GET /api/administrators/:id ---
  describe('GET /api/administrators/:id', () => {
    it('should return a specific administrator if found', async () => {
        const admin = await createAdminViaApi({ firstName: 'FetchAdmin', lastName: 'Test', login: `fetch-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw'), isActive: true });
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: admin.id.toString() } };

        const response = await administratorIdRoute.GET(req, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.id).toBe(admin.id);
        expect(json.login).toBe(admin.login);
        expect(json).not.toHaveProperty('passwordEncrypted');
    });

     it('should return 404 if administrator not found', async () => {
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: '999999' } };
        const response = await administratorIdRoute.GET(req, context);
        expect(response.status).toBe(404);
    });
  });

   // --- Test PUT /api/administrators/:id ---
   describe('PUT /api/administrators/:id', () => {
        it('should update an existing administrator', async () => {
            const admin = await createAdminViaApi({ firstName: 'UpdateAdmin', lastName: 'Old', login: `update-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw'), isActive: true });
            const updateData = { lastName: 'New', isActive: false };

            const req = createMockNextRequest({ method: 'PUT', body: updateData });
            const context = { params: { id: admin.id.toString() } };
            const response = await administratorIdRoute.PUT(req, context);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.id).toBe(admin.id);
            expect(json.lastName).toBe(updateData.lastName);
            expect(json.isActive).toBe(updateData.isActive);
            expect(json).not.toHaveProperty('passwordEncrypted');

            // Verify update in DB
            const updatedAdminDb = await db.Administrator.findByPk(admin.id);
            expect(updatedAdminDb?.lastName).toBe(updateData.lastName);
            expect(updatedAdminDb?.isActive).toBe(updateData.isActive);
        });
   });

    // --- Test DELETE /api/administrators/:id ---
    describe('DELETE /api/administrators/:id', () => {
        it('should delete an existing administrator', async () => {
            const admin = await createAdminViaApi({ firstName: 'DeleteAdmin', lastName: 'Test', login: `delete-${Date.now()}`, email: faker.internet.email(), passwordEncrypted: Buffer.from('pw'), isActive: true });
            const adminId = admin.id;

            const req = createMockNextRequest({ method: 'DELETE' });
            const context = { params: { id: adminId.toString() } };
            const response = await administratorIdRoute.DELETE(req, context);

            expect(response.status).toBe(204);

             // Verify in DB
            const deletedAdmin = await db.Administrator.findByPk(adminId);
            expect(deletedAdmin).toBeNull();
        });
   });

});
