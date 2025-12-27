import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, attendance } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET: Fetch a single member
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const memberResult = await db
            .select()
            .from(members)
            .where(eq(members.id, id))
            .limit(1);

        if (memberResult.length === 0) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({ member: memberResult[0] });
    } catch (error) {
        console.error('Error fetching member:', error);
        return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
    }
}

// PATCH: Update a member
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const updates = await request.json();

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
        );

        const [updated] = await db
            .update(members)
            .set({ ...cleanUpdates, updatedAt: new Date() })
            .where(eq(members.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({ member: updated });
    } catch (error) {
        console.error('Error updating member:', error);
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
}

// DELETE: Delete a member
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        // Delete related attendance records first (if not using cascade)
        await db.delete(attendance).where(eq(attendance.memberId, id));

        // Delete member
        const [deleted] = await db
            .delete(members)
            .where(eq(members.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting member:', error);
        return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
    }
}
