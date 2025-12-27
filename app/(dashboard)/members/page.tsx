import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import MembersClient from './MembersClient';

async function getMembers() {
    try {
        const allMembers = await db
            .select()
            .from(members)
            .orderBy(desc(members.createdAt));
        return allMembers;
    } catch (error) {
        console.error('Failed to fetch members:', error);
        return [];
    }
}

export default async function MembersPage() {
    const membersList = await getMembers();
    return <MembersClient initialMembers={membersList} />;
}
