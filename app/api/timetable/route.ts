import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Public GET - Returns timetable for website embedding
export async function GET(request: NextRequest) {
    try {
        const allClasses = await db
            .select({
                id: classes.id,
                name: classes.name,
                description: classes.description,
                dayOfWeek: classes.dayOfWeek,
                startTime: classes.startTime,
                durationMinutes: classes.durationMinutes,
                coach: classes.coach,
                level: classes.level,
                programType: classes.programType,
            })
            .from(classes)
            .where(eq(classes.isActive, true))
            .orderBy(classes.dayOfWeek, classes.startTime);

        // Group by day for easier consumption
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timetable: Record<string, any[]> = {};

        for (let i = 0; i < 7; i++) {
            timetable[days[i]] = allClasses
                .filter((c) => c.dayOfWeek === i)
                .map((c) => ({
                    time: c.startTime,
                    name: c.name,
                    coach: c.coach,
                    level: c.level,
                    duration: c.durationMinutes,
                    type: c.programType,
                }));
        }

        // Add CORS headers for website embedding
        return NextResponse.json(
            {
                gym: 'Flow State BJJ',
                location: 'Chelsea Heights, VIC',
                lastUpdated: new Date().toISOString(),
                timetable,
            },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Cache-Control': 'public, max-age=300', // 5 min cache
                },
            }
        );
    } catch (error) {
        console.error('Timetable fetch error:', error);

        // Return mock timetable if database not available
        return NextResponse.json({
            gym: 'Flow State BJJ',
            location: 'Chelsea Heights, VIC',
            lastUpdated: new Date().toISOString(),
            timetable: {
                Monday: [
                    { time: '12:00', name: 'Adults No Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', duration: 60 },
                    { time: '17:15', name: 'Youth/Teens Gi Class', coach: 'Will Archer', level: 'Youth/Teens', duration: 45 },
                    { time: '18:30', name: 'Adults Gi Fundamentals', coach: 'Kenny Horn', level: 'Fundamentals', duration: 60 },
                ],
                Tuesday: [
                    { time: '17:15', name: 'Youth/Teens Open Mat', coach: 'Arjan Jonkees', level: 'Youth/Teens', duration: 45 },
                    { time: '18:30', name: 'Adults Gi Intermediate', coach: 'Trent Bianca', level: 'Intermediate', duration: 90 },
                ],
                Wednesday: [
                    { time: '12:00', name: 'Adults Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', duration: 60 },
                    { time: '17:15', name: 'Youth/Teens No Gi', coach: 'Will Archer', level: 'Youth/Teens', duration: 45 },
                    { time: '18:30', name: 'Adults No Gi Fundamentals', coach: 'Arjan Jonkees', level: 'Fundamentals', duration: 60 },
                ],
                Thursday: [
                    { time: '17:15', name: 'Youth/Teens Open Mat', coach: 'Will Archer', level: 'Youth/Teens', duration: 45 },
                    { time: '18:30', name: 'Adults No Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', duration: 60 },
                ],
                Friday: [
                    { time: '18:00', name: 'Open Mat', coach: 'Variable', level: 'Open Mat', duration: 120 },
                ],
                Saturday: [
                    { time: '10:15', name: "Women's Only No Gi", coach: 'Coach Sarah', level: "Women's Only", duration: 60 },
                    { time: '11:15', name: 'Adults No Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', duration: 60 },
                ],
                Sunday: [],
            },
        });
    }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
