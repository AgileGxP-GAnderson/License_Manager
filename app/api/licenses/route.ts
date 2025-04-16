import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { LicenseInput } from '@/lib/models/license'; // Import input type
import LicenseTypeLookup from '@/lib/models/licenseTypeLookup'; // Import for validation

// Handler for GET /api/licenses (Get all licenses)
export async function GET(request: NextRequest) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    // Adapted from getAllLicenses
    const licenses = await db.License.findAll({
        include: [{ model: LicenseTypeLookup, as: 'type' }] // Include associated type
    });
    return NextResponse.json(licenses);
  } catch (error) {
    console.error('[API_LICENSES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for POST /api/licenses (Create a new license)
export async function POST(request: NextRequest) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const body: LicenseInput = await request.json();
        const { externalName, typeId } = body;

        // Basic validation (adapted from createLicense)
        // uniqueId will get default UUIDv4 from model if not provided
        if (!externalName || typeId === undefined) {
            return new NextResponse('Missing required license fields (externalName, typeId)', { status: 400 });
        }

        // Validate typeId existence
        const typeExists = await db.LicenseTypeLookup.findByPk(typeId);
        if (!typeExists) {
             return new NextResponse(`LicenseTypeLookup with ID ${typeId} not found.`, { status: 400 });
        }

        // Note: Handling associated purchase orders would require additional logic here

        const newLicense = await db.License.create(body);
        // Fetch again to include type data in response
        const result = await db.License.findByPk(newLicense.id, {
             include: [{ model: LicenseTypeLookup, as: 'type' }]
        });
        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('[API_LICENSES_POST]', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Likely the uniqueId if provided explicitly, or externalName if made unique
            return new NextResponse('License with this uniqueId or externalName already exists.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
