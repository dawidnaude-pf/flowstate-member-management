import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.POSTGRES_URL || 'postgresql://placeholder:placeholder@localhost:5432/flowstate',
    },
});
