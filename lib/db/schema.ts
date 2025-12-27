import { pgTable, text, timestamp, integer, boolean, json, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const beltRankEnum = pgEnum('belt_rank', ['white', 'blue', 'purple', 'brown', 'black']);
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'pending', 'overdue', 'inactive', 'trial', 'cancelled']);
export const programTypeEnum = pgEnum('program_type', ['adults_gi', 'adults_nogi', 'youth_gi', 'youth_nogi', 'open_mat', 'women_only', 'kids']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

// Users table (for auth)
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    name: text('name'),
    role: text('role').default('admin'), // admin, coach, staff
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Members table (gym members, not app users)
export const members = pgTable('members', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    dateOfBirth: timestamp('date_of_birth'),
    emergencyContact: text('emergency_contact'),
    emergencyPhone: text('emergency_phone'),
    beltRank: beltRankEnum('belt_rank').default('white'),
    stripes: integer('stripes').default(0),
    status: membershipStatusEnum('status').default('trial'),
    programs: json('programs').$type<string[]>().default([]),
    joinDate: timestamp('join_date').defaultNow(),
    lastCheckIn: timestamp('last_check_in'),
    attendanceCount: integer('attendance_count').default(0),
    profileImage: text('profile_image'), // Base64 or URL
    faceEmbedding: json('face_embedding').$type<number[]>(), // For facial recognition
    notes: text('notes'),
    // Billing
    ezipayCustomerId: text('ezipay_customer_id'),
    subscriptionId: text('subscription_id'),
    subscriptionPlan: text('subscription_plan'),
    billingStatus: text('billing_status'),
    lastPaymentDate: timestamp('last_payment_date'),
    nextPaymentDate: timestamp('next_payment_date'),
    // Clubworx migration
    clubworxId: text('clubworx_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Classes table
export const classes = pgTable('classes', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
    startTime: text('start_time').notNull(), // HH:MM format
    durationMinutes: integer('duration_minutes').default(60),
    coach: text('coach'),
    level: text('level'), // Fundamentals, All Levels, Intermediate, Advanced
    programType: programTypeEnum('program_type'),
    maxCapacity: integer('max_capacity'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Attendance records
export const attendance = pgTable('attendance', {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    classId: uuid('class_id').references(() => classes.id),
    className: text('class_name'), // Denormalized for easy display
    checkInTime: timestamp('check_in_time').defaultNow(),
    checkInMethod: text('check_in_method').default('manual'), // manual, facial, qr
    createdAt: timestamp('created_at').defaultNow(),
});

// Payments table
export const payments = pgTable('payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // In cents
    currency: text('currency').default('AUD'),
    status: paymentStatusEnum('status').default('pending'),
    type: text('type'), // subscription, one-time, refund
    description: text('description'),
    ezipayTransactionId: text('ezipay_transaction_id'),
    paymentDate: timestamp('payment_date').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Automation logs
export const automationLogs = pgTable('automation_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').notNull(), // payment_reminder, inactive_outreach, birthday, etc.
    memberId: uuid('member_id').references(() => members.id, { onDelete: 'set null' }),
    status: text('status').default('pending'), // pending, sent, failed
    message: text('message'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Notes / Communication log
export const memberNotes = pgTable('member_notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id),
    content: text('content').notNull(),
    type: text('type').default('note'), // note, call, email, sms
    createdAt: timestamp('created_at').defaultNow(),
});

// Settings table
export const settings = pgTable('settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull().unique(),
    value: json('value'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const membersRelations = relations(members, ({ many }) => ({
    attendance: many(attendance),
    payments: many(payments),
    notes: many(memberNotes),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
    member: one(members, {
        fields: [attendance.memberId],
        references: [members.id],
    }),
    class: one(classes, {
        fields: [attendance.classId],
        references: [classes.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    member: one(members, {
        fields: [payments.memberId],
        references: [members.id],
    }),
}));

export const memberNotesRelations = relations(memberNotes, ({ one }) => ({
    member: one(members, {
        fields: [memberNotes.memberId],
        references: [members.id],
    }),
    author: one(users, {
        fields: [memberNotes.authorId],
        references: [users.id],
    }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
