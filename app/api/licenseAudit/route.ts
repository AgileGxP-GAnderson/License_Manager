import { NextRequest, NextResponse } from 'next/server';
import { getDbInstance } from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const licenseIdStr = searchParams.get('licenseId');
    const db = getDbInstance();

    if (!licenseIdStr) {
        return NextResponse.json({ message: 'licenseId query parameter is required' }, { status: 400 });
    }

    try {
        const licenseId = parseInt(licenseIdStr, 10);
        if (isNaN(licenseId)) {
            return NextResponse.json({ message: 'Invalid License ID format' }, { status: 400 });
        }

        const auditRecords = await db.LicenseAudit.findAll({
            where: { licenseIdRef: licenseId },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: db.LicenseStatusLookup,
                    as: 'licenseStatus', // Ensure this alias matches your LicenseAudit model association
                    attributes: ['name']
                },
                {
                    model: db.LicenseTypeLookup,
                    as: 'licenseType', // Ensure this alias matches your LicenseAudit model association
                    attributes: ['name']
                },
                {
                    model: db.Server,
                    as: 'server', // Ensure this alias matches your LicenseAudit model association
                    attributes: ['name']
                }
            ]
        });

        if (!auditRecords || auditRecords.length === 0) {
            return NextResponse.json([], { status: 200 }); // Return empty array if no records found
        }

        const formattedRecords = auditRecords.map((record: any) => ({
            id: record.auditId, // Changed from record.id to record.auditId
            licenseIdRef: record.licenseIdRef,
            uniqueId: record.uniqueId,
            externalName: record.externalName,
            licenseStatusId: record.licenseStatusId,
            typeId: record.typeId,
            comment: record.comment,
            serverId: record.serverId,
            updatedBy: record.updatedBy,
            createdAt: record.createdAt,
            statusName: record.licenseStatus?.name ?? 'N/A',
            typeName: record.licenseType?.name ?? 'N/A',
            serverName: record.server?.name ?? 'N/A',
        }));

        return NextResponse.json(formattedRecords, { status: 200 });

    } catch (error) {
        console.error("Error fetching license audit records:", error);
        let errorMessage = 'Failed to fetch license audit records.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
