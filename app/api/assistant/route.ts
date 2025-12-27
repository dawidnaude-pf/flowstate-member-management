import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { members, classes, payments } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const genai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, history } = await request.json();

        // Gather context data
        let context = {
            memberCount: 0,
            activeMembers: 0,
            overdueCount: 0,
            todayClasses: [] as any[],
            recentPayments: [] as any[],
        };

        try {
            const memberStats = await db
                .select({
                    total: sql<number>`count(*)::int`,
                    active: sql<number>`count(*) filter (where ${members.status} = 'active')::int`,
                    overdue: sql<number>`count(*) filter (where ${members.status} = 'overdue')::int`,
                })
                .from(members);

            const dayOfWeek = new Date().getDay();
            const todayClasses = await db
                .select()
                .from(classes)
                .where(eq(classes.dayOfWeek, dayOfWeek));

            const recentPayments = await db
                .select()
                .from(payments)
                .orderBy(desc(payments.createdAt))
                .limit(5);

            context = {
                memberCount: memberStats[0]?.total || 0,
                activeMembers: memberStats[0]?.active || 0,
                overdueCount: memberStats[0]?.overdue || 0,
                todayClasses,
                recentPayments,
            };
        } catch (err) {
            console.log('Could not fetch context data');
        }

        // Use Gemini for response if available
        if (genai) {
            const systemPrompt = `You are the AI assistant for Flow State BJJ, a Brazilian Jiu-Jitsu gym in Chelsea Heights, Australia.

Current Gym Data:
- Total members: ${context.memberCount}
- Active members: ${context.activeMembers}
- Overdue payments: ${context.overdueCount}
- Today's classes: ${context.todayClasses.map((c) => `${c.startTime} - ${c.name}`).join(', ') || 'None'}

You can help with:
1. Schedule management (moving/adding/removing classes)
2. Member lookups and information
3. Payment status and follow-ups
4. General gym administration questions

Always be helpful, concise, and friendly. Use Australian English.

If the user wants to make a change (like rescheduling a class), describe what you'll do and ask for confirmation.
Format your response as JSON:
{
  "response": "your message to the user",
  "action": null or { "type": "confirmation", "data": { details of action } }
}`;

            try {
                const result = await genai.models.generateContent({
                    model: 'gemini-2.0-flash-exp',
                    contents: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        ...history.slice(-6).map((m: any) => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }],
                        })),
                        { role: 'user', parts: [{ text: message }] },
                    ],
                });

                const responseText = result.text || '';

                // Try to parse as JSON
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return NextResponse.json(parsed);
                    }
                } catch {
                    // Not JSON, return as plain text
                }

                return NextResponse.json({ response: responseText });
            } catch (aiError) {
                console.error('Gemini error:', aiError);
            }
        }

        // Fallback response without AI
        const lowerMessage = message.toLowerCase();
        let response = "I'm here to help! However, the AI service is currently unavailable. Please try again later or contact support.";

        if (lowerMessage.includes('schedule') || lowerMessage.includes('class')) {
            response = `Today's schedule has ${context.todayClasses.length} classes. To manage the schedule, please use the Schedule page in the sidebar.`;
        } else if (lowerMessage.includes('member') || lowerMessage.includes('find')) {
            response = `We have ${context.memberCount} total members (${context.activeMembers} active). Use the Members page to search and manage member details.`;
        } else if (lowerMessage.includes('payment') || lowerMessage.includes('overdue')) {
            response = `There are currently ${context.overdueCount} members with overdue payments. Check the Billing page for details and to send reminders.`;
        }

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Assistant error:', error);
        return NextResponse.json(
            { response: 'Sorry, something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
