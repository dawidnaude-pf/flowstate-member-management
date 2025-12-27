import { db } from '@/lib/db';
import { classes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ScheduleClient from './ScheduleClient';

async function getClasses() {
    try {
        const allClasses = await db
            .select()
            .from(classes)
            .where(eq(classes.isActive, true))
            .orderBy(classes.dayOfWeek, classes.startTime);
        return allClasses;
    } catch (error) {
        console.error('Failed to fetch classes:', error);
        return [];
    }
}

export default async function SchedulePage() {
    const classesList = await getClasses();
    return <ScheduleClient initialClasses={classesList} />;
}
