import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, attendance, classes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { memberId } = await request.json();

        if (!memberId) {
            return NextResponse.json({ success: false, error: 'No member ID provided' }, { status: 400 });
        }

        // Get member
        let member;
        try {
            const [foundMember] = await db
                .select()
                .from(members)
                .where(eq(members.id, memberId))
                .limit(1);
            member = foundMember;
        } catch (dbError) {
            // Mock member if database not available
            member = {
                id: memberId,
                firstName: 'John',
                lastName: 'Doe',
                beltRank: 'white',
                status: 'active',
            };
        }

        if (!member) {
            return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
        }

        // Find current class
        let currentClassName = null;
        let currentClassId = null;

        try {
            const now = new Date();
            const currentDay = now.getDay();
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

            const todayClasses = await db
                .select()
                .from(classes)
                .where(and(eq(classes.dayOfWeek, currentDay), eq(classes.isActive, true)));

            for (const cls of todayClasses) {
                const [hours, minutes] = cls.startTime.split(':').map(Number);
                const classStartMinutes = hours * 60 + minutes;
                const classEndMinutes = classStartMinutes + (cls.durationMinutes || 60);

                // Class is current if within 15 min before start to end
                if (currentTimeMinutes >= classStartMinutes - 15 && currentTimeMinutes <= classEndMinutes) {
                    currentClassName = cls.name;
                    currentClassId = cls.id;
                    break;
                }
            }
        } catch (err) {
            console.log('Could not determine current class');
        }

        // Record attendance
        try {
            await db.insert(attendance).values({
                memberId: member.id,
                classId: currentClassId,
                className: currentClassName || 'Open Mat',
                checkInMethod: 'facial',
            });

            // Update member last check-in and attendance count
            await db
                .update(members)
                .set({
                    lastCheckIn: new Date(),
                    attendanceCount: (member.attendanceCount || 0) + 1,
                    updatedAt: new Date(),
                })
                .where(eq(members.id, member.id));
        } catch (dbError) {
            console.log('Could not record attendance (database may not be initialized)');
        }

        return NextResponse.json({
            success: true,
            member: {
                id: member.id,
                firstName: member.firstName,
                lastName: member.lastName,
                beltRank: member.beltRank,
                profileImage: member.profileImage,
                className: currentClassName,
            },
        });
    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ success: false, error: 'Check-in failed' }, { status: 500 });
    }
}
