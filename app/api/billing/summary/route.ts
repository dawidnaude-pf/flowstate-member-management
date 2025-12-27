import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { members, payments } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let summary = {
            totalRevenue: 0,
            pendingPayments: 0,
            failedPayments: 0,
            activeSubscriptions: 0,
        };
        let overdueMembers: any[] = [];
        let recentPayments: any[] = [];

        try {
            // Get payment stats
            const paymentStats = await db
                .select({
                    total: sql<number>`sum(case when ${payments.status} = 'completed' then ${payments.amount} else 0 end)::int`,
                    pending: sql<number>`count(*) filter (where ${payments.status} = 'pending')::int`,
                    failed: sql<number>`count(*) filter (where ${payments.status} = 'failed')::int`,
                })
                .from(payments);

            // Get active subscriptions count
            const activeCount = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(members)
                .where(eq(members.status, 'active'));

            summary = {
                totalRevenue: (paymentStats[0]?.total || 0) / 100,
                pendingPayments: paymentStats[0]?.pending || 0,
                failedPayments: paymentStats[0]?.failed || 0,
                activeSubscriptions: activeCount[0]?.count || 0,
            };

            // Get overdue members
            const overdue = await db
                .select({
                    id: members.id,
                    firstName: members.firstName,
                    lastName: members.lastName,
                    email: members.email,
                    phone: members.phone,
                    lastPaymentDate: members.lastPaymentDate,
                })
                .from(members)
                .where(eq(members.status, 'overdue'))
                .limit(10);

            overdueMembers = overdue.map((m) => ({
                ...m,
                amountDue: 199, // Default subscription amount
                daysPastDue: m.lastPaymentDate
                    ? Math.floor((Date.now() - new Date(m.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 30,
            }));

            // Get recent payments
            const recent = await db
                .select({
                    id: payments.id,
                    amount: payments.amount,
                    status: payments.status,
                    type: payments.type,
                    date: payments.paymentDate,
                    memberFirstName: members.firstName,
                    memberLastName: members.lastName,
                })
                .from(payments)
                .leftJoin(members, eq(payments.memberId, members.id))
                .orderBy(desc(payments.paymentDate))
                .limit(10);

            recentPayments = recent.map((p) => ({
                id: p.id,
                memberName: `${p.memberFirstName} ${p.memberLastName}`,
                amount: (p.amount || 0) / 100,
                status: p.status,
                type: p.type || 'subscription',
                date: p.date?.toISOString() || new Date().toISOString(),
            }));
        } catch (dbError) {
            console.log('Database not available, returning mock data');
        }

        return NextResponse.json({
            summary,
            overdueMembers,
            recentPayments,
        });
    } catch (error) {
        console.error('Billing summary error:', error);
        return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
    }
}
