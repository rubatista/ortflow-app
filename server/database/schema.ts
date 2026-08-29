import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull()
})

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  location: text('location').notNull()
})

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  color: text('color').notNull(),
  companyId: text('company_id').notNull().references(() => companies.id),
  weeklyHours: integer('weekly_hours').notNull(),
  vacationDaysPerYear: integer('vacation_days_per_year').notNull(),
  storeId: text('store_id').references(() => stores.id),
  managedStoreIds: text('managed_store_ids', { mode: 'json' }).$type<string[]>(),
  photoUrl: text('photo_url')
})

export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  date: text('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time')
}, table => [
  uniqueIndex('shifts_employee_date_idx').on(table.employeeId, table.date)
])

/** employeeId/changedByEmployeeId não têm FK: são um registo histórico que deve sobreviver à remoção do colaborador. */
export const shiftAudit = sqliteTable('shift_audit', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  date: text('date').notNull(),
  changedByEmployeeId: text('changed_by_employee_id').notNull(),
  changedAt: text('changed_at').notNull(),
  previousLabel: text('previous_label').notNull(),
  newLabel: text('new_label').notNull()
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false)
})

export const vacations = sqliteTable('vacations', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  type: text('type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull(),
  notes: text('notes')
})

/** employeeId/changedByEmployeeId não têm FK: são um registo histórico que deve sobreviver à remoção do colaborador. */
export const vacationAudit = sqliteTable('vacation_audit', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  type: text('type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  action: text('action').notNull(),
  changedByEmployeeId: text('changed_by_employee_id').notNull(),
  changedAt: text('changed_at').notNull()
})

export const storeSales = sqliteTable('store_sales', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  date: text('date').notNull(),
  target: real('target').notNull(),
  achieved: real('achieved').notNull(),
  totalClients: integer('total_clients').notNull(),
  totalReceipts: integer('total_receipts').notNull(),
  returns: integer('returns').notNull(),
  units: integer('units').notNull()
}, table => [
  uniqueIndex('store_sales_store_date_idx').on(table.storeId, table.date)
])

/** employeeId não tem FK: histórico de vendas sobrevive à remoção do colaborador (relevante para relatórios da loja). */
export const employeeSales = sqliteTable('employee_sales', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  date: text('date').notNull(),
  salesValue: real('sales_value').notNull(),
  units: integer('units').notNull(),
  clientsServed: integer('clients_served').notNull(),
  target: real('target').notNull()
}, table => [
  uniqueIndex('employee_sales_employee_date_idx').on(table.employeeId, table.date)
])

export const monthlyTargets = sqliteTable('monthly_targets', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  month: text('month').notNull(),
  target: real('target').notNull()
}, table => [
  uniqueIndex('monthly_targets_store_month_idx').on(table.storeId, table.month)
])

export const weeklyTargets = sqliteTable('weekly_targets', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  weekStart: text('week_start').notNull(),
  target: real('target').notNull()
}, table => [
  uniqueIndex('weekly_targets_store_week_idx').on(table.storeId, table.weekStart)
])
