import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; 
import { LicenseLedgerInput } from '@/lib/models/licenseLedger'; 
// import License from '@/lib/models/license'; // Remove direct import
// import Server from '@/lib/models/server'; // Remove direct import
// import LicenseActionLookup from '@/lib/models/licenseActionLookup'; // Remove direct import

export async function GET(request: NextRequest) {
  const db = getDbInstance(); 
  try {
    const ledgerEntries = await db.LicenseLedger.findAll({
        include: [
            { model: db.License, as: 'license' }, // Changed to db.License
            { model: db.Server, as: 'server' }, // Changed to db.Server
            { model: db.LicenseActionLookup, as: 'licenseAction' } // Changed to db.LicenseActionLookup
        ]
    });
    return NextResponse.json(ledgerEntries);
  } catch (error) {
    console.error('[API_LICENSE_LEDGERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const db = getDbInstance(); 
    try {
        const body: LicenseLedgerInput = await request.json();
        const { licenseId, serverId, activityDate, licenseActionId, expirationDate } = body;

        if (licenseId === undefined || serverId === undefined || !activityDate || licenseActionId === undefined || !expirationDate) {
            return new NextResponse('Missing required fields (licenseId, serverId, activityDate, licenseActionId, expirationDate)', { status: 400 });
        }

        const licenseExists = await db.License.findByPk(licenseId); // No change needed
        if (!licenseExists) return new NextResponse(`License with ID ${licenseId} not found.`, { status: 400 });

        const serverExists = await db.Server.findByPk(serverId); // No change needed
        if (!serverExists) return new NextResponse(`Server with ID ${serverId} not found.`, { status: 400 });

        const actionExists = await db.LicenseActionLookup.findByPk(licenseActionId); // No change needed
        if (!actionExists) return new NextResponse(`LicenseActionLookup with ID ${licenseActionId} not found.`, { status: 400 });

        const newLedgerEntry = await db.LicenseLedger.create(body);
        const result = await db.LicenseLedger.findByPk(newLedgerEntry.id, {
             include: [
                { model: db.License, as: 'license' }, // Changed to db.License
                { model: db.Server, as: 'server' }, // Changed to db.Server
                { model: db.LicenseActionLookup, as: 'licenseAction' } // Changed to db.LicenseActionLookup
            ]
        });
        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('[API_LICENSE_LEDGERS_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
