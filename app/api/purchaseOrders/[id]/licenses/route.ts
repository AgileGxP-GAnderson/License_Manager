import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbInstance } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { License as LicenseType } from '@/lib/types'; // Assuming this type is just for frontend, not DB model

// Zod schema for the request body
const licenseBodySchema = z.object({
    typeId: z.number().int(),
    duration: z.number().int(),
});

// Define the expected params structure
interface RouteContext {
    params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    const { id: purchaseOrderIdStr } = params; // Rename param for clarity
    const db = getDbInstance();
    const transaction = await db.sequelize.transaction();

    try {
        // --- Parse the purchaseOrderId string from the URL parameter ---
        const purchaseOrderId = parseInt(purchaseOrderIdStr, 10);

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

        const { typeId, duration } = validation.data;

        // Verify Purchase Order exists within the transaction
        const purchaseOrder = await db.PurchaseOrder.findByPk(purchaseOrderId, { transaction });
        if (!purchaseOrder) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
        }

        // Create the new License
        const newLicense = await db.License.create({
            uniqueId: uuidv4(), // Generate a unique ID for the license
            externalName: `License for PO ${purchaseOrder.poName}`, // Example name, adjust as needed
            typeId: typeId,
            status: 'Available', // Initial status
            // activationDate, expirationDate, serverId will be null initially
        }, { transaction });

        // Associate License with Purchase Order using the join table
        await db.POLicenseJoin.create({
            poId: purchaseOrderId,
            licenseId: newLicense.id,
            duration: duration,
        }, { transaction });

        // Commit the transaction
        await transaction.commit();

        // Refetch the created license with its association data if needed, or just return the basic object
        // For simplicity, returning the created object directly. Adjust if more details are needed.
        return NextResponse.json(newLicense, { status: 201 });

    } catch (error) {
        // Rollback transaction in case of any error
        await transaction.rollback();
        console.error("Error creating license and ledger entry:", error);
        let errorMessage = 'Failed to create license.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}