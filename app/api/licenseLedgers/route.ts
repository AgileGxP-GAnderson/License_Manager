import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { LicenseLedgerInput } from '@/lib/models/licenseLedger'; // Import input type
import License from '@/lib/models/license'; // Import for association include & validation
import Server from '@/lib/models/server'; // Import for association include & validation
import LicenseActionLookup from '@/lib/models/licenseActionLookup'; // Import for association include & validation

// Handler for GET /api/licenseLedgers (Get all ledger entries)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // Adapted from getAllLicenseLedgers
    const ledgerEntries = await db.LicenseLedger.findAll({
        include: [
            { model: License, as: 'license' },
            { model: Server, as: 'server' },
            { model: LicenseActionLookup, as: 'licenseAction' }
        ]
    });
    return NextResponse.json(ledgerEntries);
  } catch (error) {
    console.error('[API_LICENSE_LEDGERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/licenseLedgers (Create a new ledger entry)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body: LicenseLedgerInput = await request.json();
        const { licenseId, serverID, activityDate, licenseActionId, expirationDate } = body;

        // Basic validation (adapted from createLicenseLedger)
        if (licenseId === undefined || serverID === undefined || !activityDate || licenseActionId === undefined || !expirationDate) {
            return new NextResponse('Missing required fields (licenseId, serverID, activityDate, licenseActionId, expirationDate)', { status: 400 });
        }

        // Validate foreign key existence
        const licenseExists = await db.License.findByPk(licenseId);
        if (!licenseExists) return new NextResponse(`License with ID ${licenseId} not found.`, { status: 400 });

        const serverExists = await db.Server.findByPk(serverID);
        if (!serverExists) return new NextResponse(`Server with ID ${serverID} not found.`, { status: 400 });

        const actionExists = await db.LicenseActionLookup.findByPk(licenseActionId);
        if (!actionExists) return new NextResponse(`LicenseActionLookup with ID ${licenseActionId} not found.`, { status: 400 });

        const newLedgerEntry = await db.LicenseLedger.create(body);
        // Fetch again to include associated data in response
        const result = await db.LicenseLedger.findByPk(newLedgerEntry.id, {
             include: [
                { model: License, as: 'license' },
                { model: Server, as: 'server' },
                { model: LicenseActionLookup, as: 'licenseAction' }
            ]
        });
        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('[API_LICENSE_LEDGERS_POST]', error);
        // Add specific error handling if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
