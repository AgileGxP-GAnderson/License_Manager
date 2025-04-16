import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getDbInstance } from '../../lib/db';
const db = getDbInstance();
import { Sequelize } from 'sequelize';
// Import the route handlers
import * as serversRoute from '../../app/api/servers/route';
import * as serverIdRoute from '../../app/api/servers/[id]/route';
import { ServerOutput, ServerInput } from '@/lib/models/server';

// --- Reusable Helper Functions ---
function createMockNextRequest(options: any): NextRequest {
    const { req } = createMocks(options);
    req.nextUrl = { // @ts-ignore
        searchParams: new URLSearchParams(options.query || {}),
    }; // @ts-ignore
    req.json = async () => options.body || {};
    return req as unknown as NextRequest;
}

// Helper to create a server via API for test setup
async function createServerViaApi(data: Partial<ServerInput>): Promise<ServerOutput> {
     // Ensure fingerprint is base64 encoded for the API call
     const fingerprintString = data.fingerprint instanceof Buffer
        ? data.fingerprint.toString('utf8')
        : data.fingerprint || faker.string.uuid();
     const finalFingerprintString = typeof fingerprintString === 'string' ? fingerprintString : faker.string.uuid();
     const apiData = { ...data, fingerprint: Buffer.from(finalFingerprintString).toString('base64') };

    const req = createMockNextRequest({ method: 'POST', body: apiData });
    const response = await serversRoute.POST(req);
    if (response.status !== 201) {
        const errorText = await response.text();
        throw new Error(`Setup failed: createServerViaApi status ${response.status} - ${errorText}`);
    }
    // Fetch directly as API returns safe version (no fingerprint)
    const json = await response.json();
    const created = await db.Server.findByPk(json.id);
    if (!created) throw new Error('Setup failed: could not find created server');
    return created.get({ plain: true }) as ServerOutput;
}
// --- End Helpers ---


describe('Server API Routes', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = db.sequelize;
    // Global setup handles DB sync
  });

   afterAll(async () => {
    await sequelize.close();
  });

  // --- Test POST /api/servers ---
  describe('POST /api/servers', () => {
    it('should create a new server successfully', async () => {
      const newServerData = {
        name: `Server_${faker.string.alphanumeric(5)}-${Date.now()}`, // Ensure unique name
        description: faker.lorem.sentence(),
        fingerprint: Buffer.from(faker.string.uuid()).toString('base64'), // Send as base64
        isActive: true,
      };

      const req = createMockNextRequest({ method: 'POST', body: newServerData });
      const response = await serversRoute.POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id');
      expect(json.name).toBe(newServerData.name);
      expect(json.description).toBe(newServerData.description);
      expect(json.isActive).toBe(newServerData.isActive);
      expect(json).not.toHaveProperty('fingerprint'); // Verify fingerprint omitted

      // Verify in DB
      const serverInDb = await db.Server.findByPk(json.id);
      expect(serverInDb).not.toBeNull();
      expect(serverInDb?.name).toBe(newServerData.name);
      // Cannot easily compare fingerprint buffer directly without decoding base64 from input
    });

     it('should return 400 if required fields are missing', async () => {
        const incompleteData = { name: 'TestServer' }; // Missing fingerprint, isActive
        const req = createMockNextRequest({ method: 'POST', body: incompleteData });
        const response = await serversRoute.POST(req);
        expect(response.status).toBe(400);
    });

     it('should return 409 if name or fingerprint already exists', async () => {
        const existingServer = await createServerViaApi({
            name: `UniqueServer-${Date.now()}`,
            fingerprint: Buffer.from(faker.string.uuid()),
            isActive: true
        });

        // Test duplicate name
        const duplicateNameData = {
            name: existingServer.name, // Duplicate name
            fingerprint: Buffer.from(faker.string.uuid()).toString('base64'),
            isActive: true
        };
        let req = createMockNextRequest({ method: 'POST', body: duplicateNameData });
        let response = await serversRoute.POST(req);
        expect(response.status).toBe(409);

        // Test duplicate fingerprint
        const duplicateFingerprintData = {
            name: `AnotherServer-${Date.now()}`,
            fingerprint: existingServer.fingerprint.toString('base64'), // Duplicate fingerprint
            isActive: true
        };
        req = createMockNextRequest({ method: 'POST', body: duplicateFingerprintData });
        response = await serversRoute.POST(req);
        expect(response.status).toBe(409);
    });
  });

  // --- Test GET /api/servers ---
  describe('GET /api/servers', () => {
     it('should return a list containing created servers', async () => {
        const server1 = await createServerViaApi({ name: `ListServer1-${Date.now()}`, fingerprint: Buffer.from(faker.string.uuid()), isActive: true });
        const server2 = await createServerViaApi({ name: `ListServer2-${Date.now()}`, fingerprint: Buffer.from(faker.string.uuid()), isActive: false });

        const req = createMockNextRequest({ method: 'GET' });
        const response = await serversRoute.GET(req);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        const responseServers = json as ServerOutput[];
        expect(responseServers.some((s) => s.id === server1.id)).toBe(true);
        expect(responseServers.some((s) => s.id === server2.id)).toBe(true);
        expect(responseServers[0]).not.toHaveProperty('fingerprint');
     });
  });

  // --- Test GET /api/servers/:id ---
  describe('GET /api/servers/:id', () => {
    it('should return a specific server if found', async () => {
        const server = await createServerViaApi({ name: `FetchServer-${Date.now()}`, fingerprint: Buffer.from(faker.string.uuid()), isActive: true });
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: server.id.toString() } };

        const response = await serverIdRoute.GET(req, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.id).toBe(server.id);
        expect(json.name).toBe(server.name);
        expect(json).not.toHaveProperty('fingerprint');
    });

     it('should return 404 if server not found', async () => {
        const req = createMockNextRequest({ method: 'GET' });
        const context = { params: { id: '999999' } };
        const response = await serverIdRoute.GET(req, context);
        expect(response.status).toBe(404);
    });
  });

   // --- Test PUT /api/servers/:id ---
   describe('PUT /api/servers/:id', () => {
        it('should update an existing server', async () => {
            const server = await createServerViaApi({ name: `UpdateServerOld-${Date.now()}`, fingerprint: Buffer.from(faker.string.uuid()), isActive: true });
            const updateData = { description: 'Updated Description', isActive: false };

            const req = createMockNextRequest({ method: 'PUT', body: updateData });
            const context = { params: { id: server.id.toString() } };
            const response = await serverIdRoute.PUT(req, context);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.id).toBe(server.id);
            expect(json.description).toBe(updateData.description);
            expect(json.isActive).toBe(updateData.isActive);
            expect(json).not.toHaveProperty('fingerprint');

            // Verify update in DB
            const updatedServerDb = await db.Server.findByPk(server.id);
            expect(updatedServerDb?.description).toBe(updateData.description);
            expect(updatedServerDb?.isActive).toBe(updateData.isActive);
        });
   });

    // --- Test DELETE /api/servers/:id ---
    describe('DELETE /api/servers/:id', () => {
        it('should delete an existing server', async () => {
            const server = await createServerViaApi({ name: `DeleteServer-${Date.now()}`, fingerprint: Buffer.from(faker.string.uuid()), isActive: true });
            const serverId = server.id;

            const req = createMockNextRequest({ method: 'DELETE' });
            const context = { params: { id: serverId.toString() } };
            const response = await serverIdRoute.DELETE(req, context);

            expect(response.status).toBe(204);

             // Verify in DB
            const deletedServer = await db.Server.findByPk(serverId);
            expect(deletedServer).toBeNull();
        });
   });

});
