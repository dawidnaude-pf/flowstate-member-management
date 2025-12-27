import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET: Fetch all members with face embeddings for client-side matching
export async function GET() {
    try {
        const allMembers = await db
            .select({
                id: members.id,
                firstName: members.firstName,
                lastName: members.lastName,
                faceEmbedding: members.faceEmbedding,
            })
            .from(members);

        return NextResponse.json({ members: allMembers });
    } catch (error) {
        console.error('Error fetching member embeddings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch embeddings' },
            { status: 500 }
        );
    }
}

// POST: Store or update face embedding for a member
// Supports "learning" by averaging new embedding with existing ones
export async function POST(request: NextRequest) {
    try {
        const { memberId, embedding } = await request.json();

        if (!memberId || !embedding || !Array.isArray(embedding)) {
            return NextResponse.json(
                { error: 'Missing memberId or embedding' },
                { status: 400 }
            );
        }

        // Get current member
        const memberResult = await db
            .select({
                id: members.id,
                faceEmbedding: members.faceEmbedding,
            })
            .from(members)
            .where(eq(members.id, memberId))
            .limit(1);

        if (memberResult.length === 0) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            );
        }

        const member = memberResult[0];

        // If member already has an embedding, average it with the new one
        // This "learns" and improves recognition over time
        let newEmbedding: number[];

        if (member.faceEmbedding && Array.isArray(member.faceEmbedding)) {
            // Average the old and new embeddings (weighted towards existing)
            // Use 0.7/0.3 weight to stabilize the embedding over time
            const oldWeight = 0.7;
            const newWeight = 0.3;
            newEmbedding = member.faceEmbedding.map((oldVal, i) =>
                oldVal * oldWeight + embedding[i] * newWeight
            );
        } else {
            // First embedding for this member
            newEmbedding = embedding;
        }

        // Update member with new/averaged embedding
        await db
            .update(members)
            .set({ faceEmbedding: newEmbedding })
            .where(eq(members.id, memberId));

        return NextResponse.json({
            success: true,
            message: member.faceEmbedding ? 'Embedding updated (learned)' : 'Embedding stored'
        });
    } catch (error) {
        console.error('Error storing embedding:', error);
        return NextResponse.json(
            { error: 'Failed to store embedding' },
            { status: 500 }
        );
    }
}
