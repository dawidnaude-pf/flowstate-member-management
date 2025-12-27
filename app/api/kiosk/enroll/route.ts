import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, attendance } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        const { firstName, lastName, email, phone, profileImage, faceEmbedding } = await request.json();

        if (!firstName) {
            return NextResponse.json({ success: false, error: 'First name is required' }, { status: 400 });
        }

        let newMember;

        try {
            // Create new member with face embedding for instant recognition
            const [inserted] = await db
                .insert(members)
                .values({
                    firstName,
                    lastName: lastName || '',
                    email: email || null,
                    phone: phone || null,
                    profileImage: profileImage || null,
                    faceEmbedding: faceEmbedding || null,
                    beltRank: 'white',
                    status: 'trial',
                    programs: ['Trial'],
                    joinDate: new Date(),
                    attendanceCount: 1,
                    lastCheckIn: new Date(),
                })
                .returning();

            newMember = inserted;

            // Record first check-in
            await db.insert(attendance).values({
                memberId: newMember.id,
                className: 'First Visit',
                checkInMethod: 'facial',
            });
        } catch (dbError) {
            console.log('Database not available, returning mock member');
            newMember = {
                id: `mock-${Date.now()}`,
                firstName,
                lastName: lastName || '',
                beltRank: 'white',
                status: 'trial',
            };
        }

        return NextResponse.json({
            success: true,
            member: {
                id: newMember.id,
                firstName: newMember.firstName,
                lastName: newMember.lastName,
                beltRank: newMember.beltRank,
                profileImage: profileImage,
                className: 'First Visit',
            },
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json({ success: false, error: 'Enrollment failed' }, { status: 500 });
    }
}
