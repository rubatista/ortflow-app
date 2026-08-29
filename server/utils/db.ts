import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../database/schema'

const url = process.env.TURSO_DATABASE_URL ?? `file:${process.env.DATABASE_PATH ?? '.data/ortflow.sqlite3'}`

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN
})

export const db = drizzle(client, { schema })
