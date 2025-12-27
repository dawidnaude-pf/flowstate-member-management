import { db } from '@/lib/db';
import { members, attendance } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import MemberDetailClient from './MemberDetailClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
    const { id } = await params;

    try {
        // Fetch member
        const memberResult = await db
            .select()
            .from(members)
            .where(eq(members.id, id))
            .limit(1);

        if (memberResult.length === 0) {
            notFound();
        }

        const member = memberResult[0];

        // Fetch recent attendance
        const recentAttendance = await db
            .select()
            .from(attendance)
            .where(eq(attendance.memberId, id))
            .orderBy(desc(attendance.checkInTime))
            .limit(20);

        return <MemberDetailClient member={member} attendance={recentAttendance} />;
    } catch (error) {
        console.error('Error fetching member:', error);
        notFound();
    }
}
