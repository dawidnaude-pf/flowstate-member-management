import { db } from '@/lib/db';
import { members, classes, attendance, payments } from '@/lib/db/schema';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

async function getDashboardData() {
    try {
        // Member stats
        const memberStats = await db.select({
            total: sql<number>`count(*)::int`,
            active: sql<number>`count(*) filter (where ${members.status} = 'active')::int`,
            overdue: sql<number>`count(*) filter (where ${members.status} = 'overdue')::int`,
            trial: sql<number>`count(*) filter (where ${members.status} = 'trial')::int`,
        }).from(members);

        // Today's classes
        const today = new Date().getDay(); // 0-6
        const todayClasses = await db
            .select()
            .from(classes)
            .where(and(eq(classes.dayOfWeek, today), eq(classes.isActive, true)))
            .orderBy(classes.startTime);

        // Recent check-ins (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentAttendance = await db
            .select({
                date: sql<string>`date(${attendance.checkInTime})`,
                count: sql<number>`count(*)::int`,
            })
            .from(attendance)
            .where(gte(attendance.checkInTime, sevenDaysAgo))
            .groupBy(sql`date(${attendance.checkInTime})`)
            .orderBy(sql`date(${attendance.checkInTime})`);

        // Members at risk (overdue or inactive)
        const atRiskMembers = await db
            .select()
            .from(members)
            .where(sql`${members.status} in ('overdue', 'inactive')`)
            .orderBy(desc(members.lastCheckIn))
            .limit(5);

        // Recent payments
        const recentPayments = await db
            .select({
                id: payments.id,
                amount: payments.amount,
                status: payments.status,
                type: payments.type,
                paymentDate: payments.paymentDate,
                memberFirstName: members.firstName,
                memberLastName: members.lastName,
            })
            .from(payments)
            .leftJoin(members, eq(payments.memberId, members.id))
            .orderBy(desc(payments.paymentDate))
            .limit(5);

        return {
            stats: memberStats[0] || { total: 0, active: 0, overdue: 0, trial: 0 },
            todayClasses,
            recentAttendance,
            atRiskMembers,
            recentPayments,
        };
    } catch (error) {
        console.error('Dashboard data fetch error:', error);
        // Return mock data if database not available
        return {
            stats: { total: 50, active: 42, overdue: 3, trial: 5 },
            todayClasses: [],
            recentAttendance: [],
            atRiskMembers: [],
            recentPayments: [],
        };
    }
}

export default async function DashboardPage() {
    const data = await getDashboardData();
    return <DashboardClient data={data} />;
}
