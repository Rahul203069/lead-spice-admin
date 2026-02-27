import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load env variables for Drizzle CLI
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './db/schema.ts', 
  out: './drizzle',
  dialect: 'postgresql', 
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});