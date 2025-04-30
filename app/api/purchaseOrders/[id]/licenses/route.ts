import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbInstance } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { License as LicenseType } from '@/lib/types';

// Zod schema for the request body
const licenseBodySchema = z.object({
    typeId: z.number().int(),
    duration: z.number().int(),
});

// Define the expected params structure (optional but good practice)
interface RouteContext {
    params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    const { id } = params; 
    const db = getDbInstance();
    const transaction = await db.sequelize.transaction(); // Use the exported sequelize instance

    try {
        // --- Parse the poId string from the URL parameter ---
        const purchaseOrderId = parseInt(id, 10); // Use a different name for the number

        if (isNaN(purchaseOrderId)) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Invalid Purchase Order ID format' }, { status: 400 });
        }

        // Validate request body
        const body = await request.json();
        const validation = licenseBodySchema.safeParse(body);

        if (!validation.success) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Invalid input data', errors: validation.error.errors }, { status: 400 });
        }

        // --- Use purchaseOrderId (the number) for database operations ---
        const { typeId, duration } = validation.data;

        // Verify Purchase Order exists within the transaction
        console.log('Finding Purchase Order with ID:', purchaseOrderId);
        const purchaseOrder = await db.PurchaseOrder.findByPk(purchaseOrderId, { transaction });

        // ... rest of your logic using purchaseOrderId ...

        if (!purchaseOrder) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
        }

        // ... (generate uniqueId, externalName, create License, create POLicenseJoin) ...
        const generatedUniqueId = uuidv4();
        const generatedExternalName = `${purchaseOrder.poName}-LIC-${generatedUniqueId.substring(0, 8)}`;

        const newLicense = await db.License.create({
            poId: purchaseOrderId, // Use the number ID
            typeId: typeId,
            status: 'Available',
            uniqueId: generatedUniqueId,
            externalName: generatedExternalName,
        }, { transaction });

        await db.POLicenseJoin.create({
            poId: purchaseOrderId, // Use the number ID
            licenseId: newLicense.id,
            duration: duration,
        }, { transaction });


        await transaction.commit();
        return NextResponse.json(newLicense, { status: 201 });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error creating license:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Failed to create license', error: errorMessage }, { status: 500 });
    }
}