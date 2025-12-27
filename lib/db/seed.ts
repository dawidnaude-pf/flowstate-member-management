import { db } from './index';
import { users, members, classes } from './schema';
import bcrypt from 'bcryptjs';

const FIRST_NAMES = [
    'James', 'Michael', 'David', 'John', 'Robert', 'Daniel', 'Matthew', 'Andrew', 'Christopher', 'Joshua',
    'Sarah', 'Emily', 'Jessica', 'Emma', 'Hannah', 'Ashley', 'Amanda', 'Olivia', 'Samantha', 'Rachel',
    'Ryan', 'Brandon', 'Tyler', 'Jacob', 'Nathan', 'Kyle', 'Aaron', 'Justin', 'Eric', 'Kevin',
    'Megan', 'Lauren', 'Nicole', 'Stephanie', 'Brittany', 'Kayla', 'Amber', 'Rebecca', 'Victoria', 'Madison',
    'Thomas', 'William', 'Ethan', 'Benjamin', 'Alexander', 'Noah', 'Lucas', 'Mason', 'Logan', 'Oliver'
];

const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
    'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green',
    'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans',
    'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris', 'Nguyen', 'Murphy'
];

const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'] as const;
const STATUSES = ['active', 'active', 'active', 'active', 'overdue', 'trial', 'inactive'] as const; // Weighted toward active
const PROGRAMS = ['Adults Gi', 'Adults No Gi', 'Youth Gi', 'Youth No Gi', 'All Access', 'Women Only'];

function randomElement<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
    return `04${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')} ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function generateEmail(firstName: string, lastName: string): string {
    const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.au', 'icloud.com'];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${randomElement(domains)}`;
}

export async function seedDatabase() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'flowstate2024', 10);

    await db.insert(users).values({
        email: process.env.ADMIN_EMAIL || 'admin@flowstatebjj.com.au',
        passwordHash: hashedPassword,
        name: 'Kenny Horn',
        role: 'admin',
    }).onConflictDoNothing();

    console.log('✅ Admin user created');

    // Generate 50 members
    const memberData = Array.from({ length: 50 }, (_, i) => {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = randomElement(LAST_NAMES);
        const joinDate = randomDate(new Date('2020-01-01'), new Date('2024-12-01'));
        const belt = randomElement(BELT_RANKS);
        const status = randomElement(STATUSES);

        // More experienced members have higher belts
        const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        const attendanceCount = Math.floor(daysSinceJoin * (0.1 + Math.random() * 0.4)); // 10-50% attendance rate

        const lastCheckIn = status === 'inactive'
            ? randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
            : randomDate(new Date('2024-11-01'), new Date());

        return {
            firstName,
            lastName,
            email: generateEmail(firstName, lastName),
            phone: generatePhone(),
            beltRank: belt,
            stripes: Math.floor(Math.random() * 5),
            status: status as typeof STATUSES[number],
            programs: [randomElement(PROGRAMS)],
            joinDate,
            lastCheckIn,
            attendanceCount,
            notes: status === 'overdue' ? 'Payment failed - needs follow up' : null,
            billingStatus: status === 'overdue' ? 'payment_failed' : status === 'active' ? 'current' : null,
            subscriptionPlan: status === 'trial' ? null : randomElement(['Unlimited', 'Casual', '2x Week']),
        };
    });

    for (const member of memberData) {
        await db.insert(members).values(member).onConflictDoNothing();
    }

    console.log('✅ 50 members created');

    // Create class schedule based on Flow State BJJ timetable
    const classSchedule = [
        // Monday
        { dayOfWeek: 1, startTime: '12:00', name: 'Adults No Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', programType: 'adults_nogi' as const, durationMinutes: 60 },
        { dayOfWeek: 1, startTime: '17:15', name: 'Youth/Teens Gi Class', coach: 'Will Archer', level: 'Youth/Teens', programType: 'youth_gi' as const, durationMinutes: 45 },
        { dayOfWeek: 1, startTime: '18:30', name: 'Adults Gi Fundamentals', coach: 'Kenny Horn', level: 'Fundamentals', programType: 'adults_gi' as const, durationMinutes: 60 },

        // Tuesday
        { dayOfWeek: 2, startTime: '17:15', name: 'Youth/Teens Open Mat', coach: 'Arjan Jonkees', level: 'Youth/Teens', programType: 'youth_nogi' as const, durationMinutes: 45 },
        { dayOfWeek: 2, startTime: '18:30', name: 'Adults Gi Intermediate', coach: 'Trent Bianca', level: 'Intermediate', programType: 'adults_gi' as const, durationMinutes: 90 },

        // Wednesday
        { dayOfWeek: 3, startTime: '12:00', name: 'Adults Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', programType: 'adults_gi' as const, durationMinutes: 60 },
        { dayOfWeek: 3, startTime: '17:15', name: 'Youth/Teens No Gi', coach: 'Will Archer', level: 'Youth/Teens', programType: 'youth_nogi' as const, durationMinutes: 45 },
        { dayOfWeek: 3, startTime: '18:30', name: 'Adults No Gi Fundamentals', coach: 'Arjan Jonkees', level: 'Fundamentals', programType: 'adults_nogi' as const, durationMinutes: 60 },
        { dayOfWeek: 3, startTime: '19:00', name: 'Open Mat / Rounds', coach: 'All Coaches', level: 'Open Mat', programType: 'open_mat' as const, durationMinutes: 60 },

        // Thursday
        { dayOfWeek: 4, startTime: '17:15', name: 'Youth/Teens Open Mat', coach: 'Will Archer', level: 'Youth/Teens', programType: 'youth_nogi' as const, durationMinutes: 45 },
        { dayOfWeek: 4, startTime: '18:30', name: 'Adults No Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', programType: 'adults_nogi' as const, durationMinutes: 60 },

        // Friday
        { dayOfWeek: 5, startTime: '18:00', name: 'Open Mat (See Chat)', coach: 'Variable', level: 'Open Mat', programType: 'open_mat' as const, durationMinutes: 120 },

        // Saturday
        { dayOfWeek: 6, startTime: '10:15', name: "Women's Only No Gi", coach: 'Coach Sarah', level: "Women's Only", programType: 'women_only' as const, durationMinutes: 60 },
        { dayOfWeek: 6, startTime: '11:15', name: 'Adults No Gi All Levels', coach: 'Kenny Horn', level: 'All Levels', programType: 'adults_nogi' as const, durationMinutes: 60 },
    ];

    for (const cls of classSchedule) {
        await db.insert(classes).values(cls).onConflictDoNothing();
    }

    console.log('✅ Class schedule created');
    console.log('🎉 Database seed complete!');
}

// Run if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Seed failed:', err);
            process.exit(1);
        });
}
