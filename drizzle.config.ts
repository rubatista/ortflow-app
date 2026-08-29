import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? `file:${process.env.DATABASE_PATH ?? '.data/ortflow.sqlite3'}`,
    authToken: process.env.TURSO_AUTH_TOKEN
  }
})
