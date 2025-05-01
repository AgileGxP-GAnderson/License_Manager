import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getDbInstance } from '../../lib/db';
const db = getDbInstance();
import { Sequelize } from 'sequelize';
// Import the route handlers
import * as licenseLedgersRoute from '../../app/api/licenseLedgers/route';
import * as licenseLedgerIdRoute from '../../app/api/licenseLedgers/[id]/route';
// Import helpers/types from other tests or create shared utils
import { LicenseOutput, LicenseInput } from '@/lib/models/license';
import { ServerOutput, ServerInput } from '@/lib/models/server';
import { LicenseActionLookupOutput } from '@/lib/models/licenseActionLookup';
import { LicenseTypeLookupOutput } from '@/lib/models/licenseTypeLookup';
import { LicenseLedgerOutput, LicenseLedgerInput } from '@/lib/models/licenseLedger';
// Import needed API route handlers for setup helpers
import * as licensesRoute from '../../app/api/licenses/route';
import * as serversRoute from '../../app/api/servers/route';


// --- Reusable Helper Functions ---
function createMockNextRequest(options: any): NextRequest {
    const { req } = createMocks(options);
    req.nextUrl = { // @ts-ignore
        searchParams: new URLSearchParams(options.query || {}),
    }; // @ts-ignore
    req.json = async () => options.body || {};
    return req as unknown as NextRequest;
}

// Helper to create dependencies directly in DB (since we don't have APIs for lookups)
async function createLicenseTypeDirectly(data: { name: string }): Promise<LicenseTypeLookupOutput> {
    const newType = await db.LicenseTypeLookup.create(data);
    return newType.get({ plain: true }) as LicenseTypeLookupOutput;
}
async function createLicenseActionDirectly(data: { name: string }): Promise<LicenseActionLookupOutput> {
    const newAction = await db.LicenseActionLookup.create(data);
    return newAction.get({ plain: true }) as LicenseActionLookupOutput;
}
// Helper to create dependencies via API
async function createLicenseViaApi(data: Partial<LicenseInput>): Promise<LicenseOutput> {
    const req = createMockNextRequest({ method: 'POST', body: data });
    const response = await licensesRoute.POST(req);
    if (response.status !== 201) throw new Error(`Setup failed: createLicenseViaApi status ${response.status}`);
    return await response.json();
}
async function createServerViaApi(data: Partial<ServerInput>): Promise<ServerOutput> {
     // Fix: Ensure fingerprint is a string before Buffer.from
     const fingerprintString = data.fingerprint instanceof Buffer
        ? data.fingerprint.toString('utf8') // Or appropriate encoding if needed
        : data.fingerprint || faker.string.uuid();
     const finalFingerprintString = typeof fingerprintString === 'string' ? fingerprintString : faker.string.uuid();
     const apiData = { ...data, fingerprint: Buffer.from(finalFingerprintString).toString('base64') };

    const req = createMockNextRequest({ method: 'POST', body: apiData });
    const response = await serversRoute.POST(req);
    if (response.status !== 201) throw new Error(`Setup failed: createServerViaApi status ${response.status}`);
    // Fetch directly as API returns safe version
    const json = await response.json();
    const created = await db.Server.findByPk(json.id);
    if (!created) throw new Error('Setup failed: could not find created server');
    return created.get({ plain: true }) as ServerOutput;
}
// Helper to create Ledger entry via API
async function createLedgerViaApi(data: Partial<LicenseLedgerInput>): Promise<LicenseLedgerOutput> {
    // Ensure date fields are correctly formatted if passed as strings
    const apiData = {
        ...data,
        // Ensure activityDate is a Date object or valid date string for API
        activityDate: data.activityDate ? new Date(data.activityDate) : new Date(),
        // Ensure expirationDate is a YYYY-MM-DD string for API
        expirationDate: data.expirationDate instanceof Date
            ? data.expirationDate.toISOString().split('T')[0]
            : data.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const req = createMockNextRequest({ method: 'POST', body: apiData });
    const response = await licenseLedgersRoute.POST(req);
     if (response.status !== 201) {
        const errorText = await response.text();
        throw new Error(`Failed to create ledger for test setup: ${response.status} - ${errorText}`);
    }
    return await response.json();
}
// --- End Helpers ---


describe('LicenseLedger API Routes', () => {
  let sequelize: Sequelize;
  let testLicense: LicenseOutput;
  let testServer: ServerOutput;
  let testAction: LicenseActionLookupOutput;
  let testLicenseType: LicenseTypeLookupOutput;

  beforeAll(async () => {
    sequelize = db.sequelize;
    // Global setup handles DB sync

    // Create necessary related records ONCE via DB/API
    testLicenseType = await createLicenseTypeDirectly({ name: `LedgerTestType-${Date.now()}` });
    testAction = await createLicenseActionDirectly({ name: `LedgerTestAction-${Date.now()}` });
    testServer = await createServerViaApi({ name: `LedgerTestServer-${Date.now()}`, fingerprint: Buffer.from(faker.string.uuid()), isActive: true });
    testLicense = await createLicenseViaApi({ externalName: `LedgerTestLicense-${Date.now()}`, typeId: testLicenseType.id });
  });

   afterAll(async () => {
    // Clean up shared resources if necessary, or rely on global reset
    await sequelize.close();
  });

  // --- Test POST /api/licenseLedgers ---
  describe('POST /api/licenseLedgers', () => {
    it('should create a new license ledger entry successfully', async () => {
      const newLedgerData = {
        licenseId: testLicense.id,
        serverId: testServer.id,
        activityDate: faker.date.past(), // Date object
        licenseActionId: testAction.id,
        comment: faker.lorem.sentence(),
        expirationDate: faker.date.future().toISOString().split('T')[0], // YYYY-MM-DD string
      };

      const req = createMockNextRequest({ method: 'POST', body: newLedgerData });
      const response = await licenseLedgersRoute.POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id');
      expect(json.licenseId).toBe(newLedgerData.licenseId);
      expect(json.serverId).toBe(newLedgerData.serverId);
      expect(json.licenseActionId).toBe(newLedgerData.licenseActionId);
      expect(json.comment).toBe(newLedgerData.comment);
      // Check included associations
      expect(json.license).toBeDefined();
      expect(json.server).toBeDefined();
      expect(json.licenseAction).toBeDefined();

      // Verify in DB
      const ledgerInDb = await db.LicenseLedger.findByPk(json.id);
      expect(ledgerInDb).not.toBeNull();
      expect(ledgerInDb?.comment).toBe(newLedgerData.comment);
    });

     it('should return 400 if required fields are missing', async () => {
        const incompleteData = { licenseId: testLicense.id, serverId: testServer.id };
        const req = createMockNextRequest({ method: 'POST', body: incompleteData });
        const response = await licenseLedgersRoute.POST(req);
        expect(response.status).toBe(400);
    });

     it('should return 400 if foreign key does not exist', async () => {
        const ledgerData = {
            licenseId: 999999, // Non-existent license
            serverId: testServer.id,
            activityDate: new Date(), // Date object
            licenseActionId: testAction.id,
            expirationDate: '2025-12-31', // String format ok for DATEONLY
        };
        const req = createMockNextRequest({ method: 'POST', body: ledgerData });
        const response = await licenseLedgersRoute.POST(req);
        expect(response.status).toBe(400); // Expecting 400 due to validation
    });
  });

  // --- Test GET /api/licenseLedgers ---
  describe('GET /api/licenseLedgers', () => {
     it('should return a list containing created ledger entries', async () => {
        const ledger1 = await createLedgerViaApi({ licenseId: testLicense.id, serverId: testServer.id, activityDate: new Date(), licenseActionId: testAction.id, expirationDate: new Date('2026-01-01') }); // Use Date object
        const ledger2 = await createLedgerViaApi({ licenseId: testLicense.id, serverId: testServer.id, activityDate: new Date(), licenseActionId: testAction.id, expirationDate: new Date('2027-01-01') }); // Use Date object

        const req = createMockNextRequest({ method: 'GET' });
        const response = await licenseLedgersRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        const responseLedgers = json as LicenseLedgerOutput[];
        expect(responseLedgers.some((l) => l.id === ledger1.id)).toBe(true);
        expect(responseLedgers.some((l) => l.id === ledger2.id)).toBe(true);
     });
  });

  // --- Test GET /api/licenseLedgers/:id ---
  describe('GET /api/licenseLedgers/:id', () => {
    it('should return a specific ledger entry if found', async () => {
        const ledger = await createLedgerViaApi({ licenseId: testLicense.id, serverId: testServer.id, activityDate: new Date(), licenseActionId: testAction.id, expirationDate: new Date('2028-01-01'), comment: 'Fetch Me' }); // Use Date object
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: ledger.id.toString() } };

        const response = await licenseLedgerIdRoute.GET(req, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.id).toBe(ledger.id);
        expect(json.comment).toBe('Fetch Me');
        expect(json.license).toBeDefined();
        expect(json.server).toBeDefined();
        expect(json.licenseAction).toBeDefined();
    });

     it('should return 404 if ledger entry not found', async () => {
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: '999999' } };
        const response = await licenseLedgerIdRoute.GET(req, context);
        expect(response.status).toBe(404);
    });
  });

   // --- Test PUT /api/licenseLedgers/:id ---
   describe('PUT /api/licenseLedgers/:id', () => {
        it('should update an existing ledger entry', async () => {
            const ledger = await createLedgerViaApi({ licenseId: testLicense.id, serverId: testServer.id, activityDate: new Date(), licenseActionId: testAction.id, expirationDate: new Date('2029-01-01'), comment: 'Old Comment' }); // Use Date object
            const updateData = { comment: 'New Comment Updated' };

            const req = createMockNextRequest({ method: 'PUT', body: updateData });
            const context = { params: { id: ledger.id.toString() } };
            const response = await licenseLedgerIdRoute.PUT(req, context);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.id).toBe(ledger.id);
            expect(json.comment).toBe(updateData.comment);

            // Verify update in DB
            const updatedLedgerDb = await db.LicenseLedger.findByPk(ledger.id);
            expect(updatedLedgerDb?.comment).toBe(updateData.comment);
        });
   });

    // --- Test DELETE /api/licenseLedgers/:id ---
    describe('DELETE /api/licenseLedgers/:id', () => {
        it('should delete an existing ledger entry', async () => {
            const ledger = await createLedgerViaApi({ licenseId: testLicense.id, serverId: testServer.id, activityDate: new Date(), licenseActionId: testAction.id, expirationDate: new Date('2030-01-01') }); // Use Date object
            const ledgerId = ledger.id;

            const req = createMockNextRequest({ method: 'DELETE' });
            const context = { params: { id: ledgerId.toString() } };
            const response = await licenseLedgerIdRoute.DELETE(req, context);

            expect(response.status).toBe(204);

             // Verify in DB
            const deletedLedger = await db.LicenseLedger.findByPk(ledgerId);
            expect(deletedLedger).toBeNull();
        });
   });

});
