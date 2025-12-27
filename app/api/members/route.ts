import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { eq, desc, sql, or, ilike } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET - Fetch members with optional search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = db.select().from(members);

        // Apply filters
        const conditions = [];
        if (search) {
            conditions.push(
                or(
                    ilike(members.firstName, `%${search}%`),
                    ilike(members.lastName, `%${search}%`),
                    ilike(members.email, `%${search}%`)
                )
            );
        }
        if (status && status !== 'all') {
            conditions.push(eq(members.status, status as any));
        }

        const result = await db
            .select()
            .from(members)
            .where(conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined)
            .orderBy(desc(members.createdAt))
            .limit(limit);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Fetch members error:', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

// POST - Create new member
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.firstName) {
            return NextResponse.json({ error: 'First name is required' }, { status: 400 });
        }

        const [newMember] = await db
            .insert(members)
            .values({
                firstName: data.firstName,
                lastName: data.lastName || '',
                email: data.email || null,
                phone: data.phone || null,
                beltRank: data.beltRank || 'white',
                status: data.status || 'trial',
                programs: data.programs || ['Trial'],
                joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
                notes: data.notes || null,
                clubworxId: data.clubworxId || null,
                subscriptionPlan: data.subscriptionPlan || null,
                profileImage: data.profileImage || null,
            })
            .returning();

        return NextResponse.json(newMember);
    } catch (error) {
        console.error('Create member error:', error);
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
    }
}

// PUT - Update member
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
        }

        const [updatedMember] = await db
            .update(members)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(members.id, id))
            .returning();

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error('Update member error:', error);
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
}

// DELETE - Remove member
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
        }

        await db.delete(members).where(eq(members.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete member error:', error);
        return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
    }
}
