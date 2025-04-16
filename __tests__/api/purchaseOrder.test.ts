import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getDbInstance } from '../../lib/db';
const db = getDbInstance();
import { Sequelize } from 'sequelize';
// Import the route handlers
import * as purchaseOrdersRoute from '../../app/api/purchaseOrders/route';
import * as purchaseOrderIdRoute from '../../app/api/purchaseOrders/[id]/route';
// Import helpers/types
import { CustomerOutput, CustomerInput } from '@/lib/models/customer';
import { PurchaseOrderOutput, PurchaseOrderInput } from '@/lib/models/purchaseOrder';
import * as customersRoute from '../../app/api/customers/route'; // To create customer dependency

// --- Reusable Helper Functions ---
function createMockNextRequest(options: any): NextRequest {
    const { req } = createMocks(options);
    req.nextUrl = { // @ts-ignore
        searchParams: new URLSearchParams(options.query || {}),
    }; // @ts-ignore
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

// Helper to create a PO via API for test setup
async function createPoViaApi(data: Partial<PurchaseOrderInput>): Promise<PurchaseOrderOutput> {
    // Ensure date fields are correctly formatted if passed as strings
     const apiData = {
        ...data,
        purchaseDate: data.purchaseDate instanceof Date
            ? data.purchaseDate.toISOString().split('T')[0]
            : data.purchaseDate || new Date().toISOString().split('T')[0]
    };
    const req = createMockNextRequest({ method: 'POST', body: apiData });
    const response = await purchaseOrdersRoute.POST(req);
     if (response.status !== 201) {
        const errorText = await response.text();
        throw new Error(`Failed to create PO for test setup: ${response.status} - ${errorText}`);
    }
    return await response.json();
}
// --- End Helpers ---


describe('PurchaseOrder API Routes', () => {
  let sequelize: Sequelize;
  let testCustomer: CustomerOutput;

  beforeAll(async () => {
    sequelize = db.sequelize;
    // Global setup handles DB sync

    // Create a customer needed for tests
    testCustomer = await createCustomerViaApi({
        businessName: `POTestCust-${Date.now()}`,
        contactName: faker.person.fullName(),
    });
  });

   afterAll(async () => {
    // Clean up shared resources if necessary
    await sequelize.close();
  });

  // --- Test POST /api/purchaseOrders ---
  describe('POST /api/purchaseOrders', () => {
    it('should create a new purchase order successfully', async () => {
      const newPOData = {
        poName: `PO-${faker.string.alphanumeric(8)}`,
        purchaseDate: faker.date.past().toISOString().split('T')[0], // YYYY-MM-DD
        customerId: testCustomer.id,
        isClosed: false,
      };

      const req = createMockNextRequest({ method: 'POST', body: newPOData });
      const response = await purchaseOrdersRoute.POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id');
      expect(json.poName).toBe(newPOData.poName);
      expect(json.customerId).toBe(newPOData.customerId);
      expect(json.isClosed).toBe(newPOData.isClosed);
      expect(json.customer).toBeDefined(); // Check included association
      expect(json.customer.id).toBe(testCustomer.id);

      // Verify in DB
      const poInDb = await db.PurchaseOrder.findByPk(json.id);
      expect(poInDb).not.toBeNull();
      expect(poInDb?.poName).toBe(newPOData.poName);
    });

     it('should return 400 if required fields are missing', async () => {
        const incompleteData = { customerId: testCustomer.id, poName: 'Test PO' };
        const req = createMockNextRequest({ method: 'POST', body: incompleteData });
        const response = await purchaseOrdersRoute.POST(req);
        expect(response.status).toBe(400);
    });

     it('should return 400 if customerId does not exist', async () => {
        const poData = {
            poName: `PO-${faker.string.alphanumeric(8)}`,
            purchaseDate: '2024-01-01',
            customerId: 999999, // Non-existent customer
            isClosed: false,
        };
        const req = createMockNextRequest({ method: 'POST', body: poData });
        const response = await purchaseOrdersRoute.POST(req);
        expect(response.status).toBe(400);
    });
  });

  // --- Test GET /api/purchaseOrders ---
  describe('GET /api/purchaseOrders', () => {
     it('should return a list containing created purchase orders', async () => {
        const po1 = await createPoViaApi({ poName: `ListPO1-${Date.now()}`, customerId: testCustomer.id, isClosed: false });
        const po2 = await createPoViaApi({ poName: `ListPO2-${Date.now()}`, customerId: testCustomer.id, isClosed: true });

        const req = createMockNextRequest({ method: 'GET' });
        const response = await purchaseOrdersRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        const responsePOs = json as PurchaseOrderOutput[];
        expect(responsePOs.some((p) => p.id === po1.id)).toBe(true);
        expect(responsePOs.some((p) => p.id === po2.id)).toBe(true);
     });
  });

  // --- Test GET /api/purchaseOrders/:id ---
  describe('GET /api/purchaseOrders/:id', () => {
    it('should return a specific purchase order if found', async () => {
        const po = await createPoViaApi({ poName: `FetchPO-${Date.now()}`, customerId: testCustomer.id, isClosed: false });
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: po.id.toString() } };

        const response = await purchaseOrderIdRoute.GET(req, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.id).toBe(po.id);
        expect(json.poName).toBe(po.poName);
        expect(json.customer).toBeDefined();
        expect(json.customer.id).toBe(testCustomer.id);
    });

     it('should return 404 if purchase order not found', async () => {
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: '999999' } };
        const response = await purchaseOrderIdRoute.GET(req, context);
        expect(response.status).toBe(404);
    });
  });

   // --- Test PUT /api/purchaseOrders/:id ---
   describe('PUT /api/purchaseOrders/:id', () => {
        it('should update an existing purchase order', async () => {
            const po = await createPoViaApi({ poName: `UpdatePOOld-${Date.now()}`, customerId: testCustomer.id, isClosed: false });
            const updateData = { isClosed: true, poName: `UpdatePONew-${Date.now()}` };

            const req = createMockNextRequest({ method: 'PUT', body: updateData });
            const context = { params: { id: po.id.toString() } };
            const response = await purchaseOrderIdRoute.PUT(req, context);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.id).toBe(po.id);
            expect(json.poName).toBe(updateData.poName);
            expect(json.isClosed).toBe(updateData.isClosed);

            // Verify update in DB
            const updatedPODb = await db.PurchaseOrder.findByPk(po.id);
            expect(updatedPODb?.poName).toBe(updateData.poName);
            expect(updatedPODb?.isClosed).toBe(updateData.isClosed);
        });
   });

    // --- Test DELETE /api/purchaseOrders/:id ---
    describe('DELETE /api/purchaseOrders/:id', () => {
        it('should delete an existing purchase order', async () => {
            const po = await createPoViaApi({ poName: `DeletePO-${Date.now()}`, customerId: testCustomer.id, isClosed: false });
            const poId = po.id;

            const req = createMockNextRequest({ method: 'DELETE' });
            const context = { params: { id: poId.toString() } };
            const response = await purchaseOrderIdRoute.DELETE(req, context);

            expect(response.status).toBe(204);

             // Verify in DB
            const deletedPO = await db.PurchaseOrder.findByPk(poId);
            expect(deletedPO).toBeNull();
        });
   });

});
