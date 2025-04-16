import { NextResponse, NextRequest } from 'next/server';
import { getDbInstance } from '@/lib/db'; // Use the lazy initialization function
import { LicenseInput } from '@/lib/models/license'; // Import input type
import LicenseTypeLookup from '@/lib/models/licenseTypeLookup'; // Import for validation

interface RouteParams {
  params: {
    id: string;
  };
}

// Handler for GET /api/licenses/:id (Get license by ID)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const db = getDbInstance(); // Get DB instance inside the handler
  try {
    const id = params.id;
    const licenseId = parseInt(id, 10);

    if (isNaN(licenseId)) {
      return new NextResponse('Invalid license ID format', { status: 400 });
    }

    const license = await db.License.findByPk(licenseId, {
        include: [{ model: LicenseTypeLookup, as: 'type' }] // Include associated type
    });

    if (!license) {
      return new NextResponse('License not found', { status: 404 });
    }

    return NextResponse.json(license);

  } catch (error) {
    console.error('[API_LICENSE_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler for PUT /api/licenses/:id (Update license)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const licenseId = parseInt(id, 10);

        if (isNaN(licenseId)) {
             return new NextResponse('Invalid license ID format', { status: 400 });
        }

        const license = await db.License.findByPk(licenseId);

        if (!license) {
            return new NextResponse('License not found', { status: 404 });
        }

        const body: Partial<LicenseInput> = await request.json();
        // Prevent updating primary key, uniqueId, or timestamps directly
        const { id: bodyId, uniqueId: bodyUniqueId, createdAt, updatedAt, typeId: bodyTypeId, ...updateDataInput } = body;
        const updateData: Partial<LicenseInput> = { ...updateDataInput }; // Clone

         // Validate typeId if it's being updated
        if (body.typeId !== undefined && body.typeId !== license.typeId) {
             const typeExists = await db.LicenseTypeLookup.findByPk(body.typeId);
             if (!typeExists) {
                 return new NextResponse(`LicenseTypeLookup with ID ${body.typeId} not found.`, { status: 400 });
             }
             updateData.typeId = body.typeId; // Add it back if valid
        }

        // Note: Handling updates to associated purchase orders would require additional logic here

        await license.update(updateData);
        // Fetch again to include type data in response
        const result = await db.License.findByPk(licenseId, {
             include: [{ model: LicenseTypeLookup, as: 'type' }]
        });
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[API_LICENSE_PUT]', error);
        // Add specific error handling if needed
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Handler for DELETE /api/licenses/:id (Delete license)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const db = getDbInstance(); // Get DB instance inside the handler
    try {
        const id = params.id;
        const licenseId = parseInt(id, 10);

        if (isNaN(licenseId)) {
             return new NextResponse('Invalid license ID format', { status: 400 });
        }

        const license = await db.License.findByPk(licenseId);

        if (!license) {
            return new NextResponse('License not found', { status: 404 });
        }

        // Note: Consider implications of deleting a License (e.g., associated ledger entries, join table entries).
        // Foreign key constraints might prevent deletion or cause cascading deletes.
        await license.destroy();
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error: any) {
        console.error('[API_LICENSE_DELETE]', error);
         // Add specific error handling for foreign key constraints if needed
         if (error.name === 'SequelizeForeignKeyConstraintError') {
             return new NextResponse('Cannot delete License because it has associated data (e.g., ledger entries, PO links).', { status: 409 });
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
