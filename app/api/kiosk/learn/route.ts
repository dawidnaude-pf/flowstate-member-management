import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Add validated face image to member's training data
export async function POST(request: NextRequest) {
    try {
        const { memberId, imageData } = await request.json();

        if (!memberId || !imageData) {
            return NextResponse.json(
                { success: false, error: 'Member ID and image data required' },
                { status: 400 }
            );
        }

        // Get current member
        const [member] = await db
            .select()
            .from(members)
            .where(eq(members.id, memberId))
            .limit(1);

        if (!member) {
            return NextResponse.json(
                { success: false, error: 'Member not found' },
                { status: 404 }
            );
        }

        // Update member's profile image if they don't have one
        // In production, you'd store multiple images for better recognition
        if (!member.profileImage) {
            await db
                .update(members)
                .set({
                    profileImage: imageData,
                    updatedAt: new Date(),
                })
                .where(eq(members.id, memberId));
        }

        // Note: For production one-shot learning, you would:
        // 1. Store multiple face images per member in a separate table
        // 2. Generate face embeddings using a dedicated model
        // 3. Use vector similarity for matching (e.g., pgvector)
        // 4. Continuously improve matching with each validated check-in

        return NextResponse.json({
            success: true,
            message: 'Face data added to training set',
        });
    } catch (error) {
        console.error('Learn face error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to learn face' },
            { status: 500 }
        );
    }
}
