import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbInstance } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { License as LicenseType } from '@/lib/types'; // Assuming this type is just for frontend, not DB model

const licenseBodySchema = z.object({
    typeId: z.number().int(),
    duration: z.number().int(),
    externalName: z.string().optional(), // Make externalName optional
});

interface RouteContext {
    params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    const { id: purchaseOrderIdStr } = params; // Rename param for clarity
    const db = getDbInstance();
    const transaction = await db.sequelize.transaction();

    try {
        const purchaseOrderId = parseInt(purchaseOrderIdStr, 10);

        if (isNaN(purchaseOrderId)) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Invalid Purchase Order ID format' }, { status: 400 });
        }

        const body = await request.json();
        const validation = licenseBodySchema.safeParse(body);

        if (!validation.success) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Invalid input data', errors: validation.error.errors }, { status: 400 });
        }

        const { typeId, duration, externalName } = validation.data;

        const purchaseOrder = await db.PurchaseOrder.findByPk(purchaseOrderId, { transaction });
        if (!purchaseOrder) {
            await transaction.rollback();
            return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
        }

        const newLicense = await db.License.create({
            uniqueId: uuidv4(), // Generate a unique ID for the license
            externalName: externalName || `License for PO ${purchaseOrder.poName}`, // Use provided externalName or default
            typeId: typeId,
            status: 'Available', // Initial status
        }, { transaction });

        await db.POLicenseJoin.create({
            poId: purchaseOrderId,
            licenseId: newLicense.id,
            duration: duration,
        }, { transaction });

        await transaction.commit();

        return NextResponse.json(newLicense, { status: 201 });

    } catch (error) {
        await transaction.rollback();
        console.error("Error creating license and ledger entry:", error);
        let errorMessage = 'Failed to create license.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}