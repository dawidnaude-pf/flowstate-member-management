import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET - Fetch all classes
export async function GET() {
    try {
        const allClasses = await db.select().from(classes).orderBy(classes.dayOfWeek, classes.startTime);
        return NextResponse.json(allClasses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}

// POST - Create new class
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const [newClass] = await db.insert(classes).values(data).returning();
        return NextResponse.json(newClass);
    } catch (error) {
        console.error('Create class error:', error);
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }
}

// PUT - Update class
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }

        const [updatedClass] = await db
            .update(classes)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(classes.id, id))
            .returning();

        return NextResponse.json(updatedClass);
    } catch (error) {
        console.error('Update class error:', error);
        return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }
}

// DELETE - Remove class
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }

        await db.delete(classes).where(eq(classes.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete class error:', error);
        return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
    }
}
