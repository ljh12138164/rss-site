import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl)
  throw new Error('Set DATABASE_URL in server/api/.env before starting Drizzle Studio')

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: { url: databaseUrl }
})
