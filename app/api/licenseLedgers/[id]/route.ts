import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { LicenseLedgerInput } from '@/lib/models/licenseLedger'; // Import input type
import License from '@/lib/models/license'; // Import for association include & validation
import Server from '@/lib/models/server'; // Import for association include & validation
import LicenseActionLookup from '@/lib/models/licenseActionLookup'; // Import for association include & validation

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const ledgerId = parseInt(id, 10);

    if (isNaN(ledgerId)) {
      return new NextResponse('Invalid license ledger ID format', { status: 400 });
    }

    const ledgerEntry = await db.LicenseLedger.findByPk(ledgerId, {
         include: [
            { model: License, as: 'license' },
            { model: Server, as: 'server' },
            { model: LicenseActionLookup, as: 'licenseAction' }
        ]
    });

    if (!ledgerEntry) {
      return new NextResponse('License Ledger entry not found', { status: 404 });
    }

    return NextResponse.json(ledgerEntry);

  } catch (error) {
    console.error('[API_LICENSE_LEDGER_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const ledgerId = parseInt(id, 10);

        if (isNaN(ledgerId)) {
             return new NextResponse('Invalid license ledger ID format', { status: 400 });
        }

        const ledgerEntry = await db.LicenseLedger.findByPk(ledgerId);

        if (!ledgerEntry) {
            return new NextResponse('License Ledger entry not found', { status: 404 });
        }

        const body: Partial<LicenseLedgerInput> = await request.json();
        const { id: bodyId, createdAt, updatedAt, licenseId: bodyLicenseId, serverId: bodyServerId, licenseActionId: bodyActionId, ...updateDataInput } = body;
        const updateData: Partial<LicenseLedgerInput> = { ...updateDataInput }; // Clone

        if (body.licenseId !== undefined && body.licenseId !== ledgerEntry.licenseId) {
             const licenseExists = await db.License.findByPk(body.licenseId);
             if (!licenseExists) return new NextResponse(`License with ID ${body.licenseId} not found.`, { status: 400 });
             updateData.licenseId = body.licenseId;
        }
         if (body.serverId !== undefined && body.serverId !== ledgerEntry.serverId) {
             const serverExists = await db.Server.findByPk(body.serverId);
             if (!serverExists) return new NextResponse(`Server with ID ${body.serverId} not found.`, { status: 400 });
             updateData.serverId = body.serverId;
        }
         if (body.licenseActionId !== undefined && body.licenseActionId !== ledgerEntry.licenseActionId) {
             const actionExists = await db.LicenseActionLookup.findByPk(body.licenseActionId);
             if (!actionExists) return new NextResponse(`LicenseActionLookup with ID ${body.licenseActionId} not found.`, { status: 400 });
             updateData.licenseActionId = body.licenseActionId;
        }

        await ledgerEntry.update(updateData);
        const result = await db.LicenseLedger.findByPk(ledgerId, {
             include: [
                { model: License, as: 'license' },
                { model: Server, as: 'server' },
                { model: LicenseActionLookup, as: 'licenseAction' }
            ]
        });
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[API_LICENSE_LEDGER_PUT]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const ledgerId = parseInt(id, 10);

        if (isNaN(ledgerId)) {
             return new NextResponse('Invalid license ledger ID format', { status: 400 });
        }

        const ledgerEntry = await db.LicenseLedger.findByPk(ledgerId);

        if (!ledgerEntry) {
            return new NextResponse('License Ledger entry not found', { status: 404 });
        }

        await ledgerEntry.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error) {
        console.error('[API_LICENSE_LEDGER_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
