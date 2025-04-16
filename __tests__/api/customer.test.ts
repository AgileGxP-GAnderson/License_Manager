import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeAll, afterAll } from 'vitest'; // Removed beforeEach/afterEach
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getDbInstance } from '../../lib/db';
const db = getDbInstance();
import { Sequelize } from 'sequelize'; // Keep Sequelize for type hints if needed
// Import the route handlers
import * as customersRoute from '../../app/api/customers/route';
import * as customerIdRoute from '../../app/api/customers/[id]/route';
import { CustomerOutput, CustomerInput } from '@/lib/models/customer';

// Helper function remains the same
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

// Helper to create a customer via API for test setup
async function createCustomerViaApi(data: Partial<CustomerInput>): Promise<CustomerOutput> {
    const req = createMockNextRequest({ method: 'POST', body: data });
    const response = await customersRoute.POST(req);
    if (response.status !== 201) {
        throw new Error(`Failed to create customer for test setup: ${response.status}`);
    }
    return await response.json();
}

describe('Customer API Routes', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = db.sequelize;
    // Global setup should handle DB sync/reset
  });

  // beforeEach/afterEach transaction removed

   afterAll(async () => {
    // Ensure DB is clean after tests if global setup doesn't handle teardown well
    // await db.Customer.destroy({ where: {}, truncate: true }); // Example cleanup
    await sequelize.close();
  });

  // --- Test POST /api/customers ---
  describe('POST /api/customers', () => {
    it('should create a new customer successfully', async () => {
      const newCustomerData = {
        businessName: faker.company.name(),
        contactName: faker.person.fullName(),
        contactEmail: faker.internet.email(),
      };
      const req = createMockNextRequest({ method: 'POST', body: newCustomerData });
      const response = await customersRoute.POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id');
      expect(json.businessName).toBe(newCustomerData.businessName);

      // Verify in DB (optional, but good)
      const customerInDb = await db.Customer.findByPk(json.id);
      expect(customerInDb).not.toBeNull();
      expect(customerInDb?.businessName).toBe(newCustomerData.businessName);
      // Cleanup handled by global setup ideally, or afterAll
    });

     it('should return 400 if required fields are missing', async () => {
        const incompleteData = { businessName: 'Missing Contact' };
        const req = createMockNextRequest({ method: 'POST', body: incompleteData });
        const response = await customersRoute.POST(req);
        expect(response.status).toBe(400);
    });
  });

  // --- Test GET /api/customers ---
  describe('GET /api/customers', () => {
     it('should return a list containing created customers', async () => {
        // Create data via API
        const cust1 = await createCustomerViaApi({ businessName: 'List Test 1', contactName: 'Contact 1' });
        const cust2 = await createCustomerViaApi({ businessName: 'List Test 2', contactName: 'Contact 2' });

        const req = createMockNextRequest({ method: 'GET' });
        const response = await customersRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        const responseCustomers = json as CustomerOutput[];
        // Check if the created customers are present
        expect(responseCustomers.some((c) => c.id === cust1.id)).toBe(true);
        expect(responseCustomers.some((c) => c.id === cust2.id)).toBe(true);
     });

     it('should return filtered customers when searching by businessName', async () => {
        const cust1 = await createCustomerViaApi({ businessName: 'Searchable Corp API', contactName: 'Search 1' });
        const cust2 = await createCustomerViaApi({ businessName: 'Another Company API', contactName: 'Search 2' });

        const req = createMockNextRequest({
            method: 'GET',
            query: { businessName: 'Searchable' }
        });
        const response = await customersRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        const responseCustomers = json as CustomerOutput[];
        expect(Array.isArray(responseCustomers)).toBe(true);
        expect(responseCustomers.length).toBeGreaterThanOrEqual(1);
        expect(responseCustomers.some((c) => c.id === cust1.id)).toBe(true);
        expect(responseCustomers.some((c) => c.id === cust2.id)).toBe(false);
    });
  });

  // --- Test GET /api/customers/:id ---
  describe('GET /api/customers/:id', () => {
    it('should return a specific customer if found', async () => {
        // Create data via API
        const customer = await createCustomerViaApi({ businessName: 'Fetch Me API', contactName: 'Fetch Contact' });

        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: customer.id.toString() } };

        const response = await customerIdRoute.GET(req, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.id).toBe(customer.id);
        expect(json.businessName).toBe(customer.businessName);
    });

     it('should return 404 if customer not found', async () => {
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: '999999' } }; // Use an ID guaranteed not to exist

        const response = await customerIdRoute.GET(req, context);
        expect(response.status).toBe(404);
    });
  });

   // --- Test PUT /api/customers/:id ---
   describe('PUT /api/customers/:id', () => {
        it('should update an existing customer', async () => {
            // Create data via API
            const customer = await createCustomerViaApi({ businessName: 'Update Me API', contactName: 'Old Contact' });
            const updateData = { contactName: 'New Contact API', contactEmail: faker.internet.email() };

            const req = createMockNextRequest({ method: 'PUT', body: updateData });
            const context = { params: { id: customer.id.toString() } };

            const response = await customerIdRoute.PUT(req, context);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.id).toBe(customer.id);
            expect(json.contactName).toBe(updateData.contactName);
            expect(json.contactEmail).toBe(updateData.contactEmail);

            // Verify update in DB (optional)
            const updatedCustomerDb = await db.Customer.findByPk(customer.id);
            expect(updatedCustomerDb?.contactName).toBe(updateData.contactName);
        });
   });

    // --- Test DELETE /api/customers/:id ---
    describe('DELETE /api/customers/:id', () => {
        it('should delete an existing customer', async () => {
            // Create data via API
            const customer = await createCustomerViaApi({ businessName: 'Delete Me API', contactName: 'Delete Contact' });
            const customerId = customer.id;

            const req = createMockNextRequest({ method: 'DELETE' });
            const context = { params: { id: customerId.toString() } };

            const response = await customerIdRoute.DELETE(req, context);
            expect(response.status).toBe(204);

             // Verify in DB
            const deletedCustomer = await db.Customer.findByPk(customerId);
            expect(deletedCustomer).toBeNull();
        });
   });

});
