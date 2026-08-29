import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '../utils/db'

await migrate(db, { migrationsFolder: './server/database/migrations' })
console.log('Migrações aplicadas com sucesso.')
