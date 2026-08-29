import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from '../utils/db'

migrate(db, { migrationsFolder: './server/database/migrations' })
console.log('Migrações aplicadas com sucesso.')
