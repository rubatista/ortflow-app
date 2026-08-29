import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { employees } from '../database/schema'

const MANAGER_ROLES = ['gerente', 'subgerente', 'gerente_regional']

export async function requireSessionEmployee(event: H3Event) {
  const { user } = await requireUserSession(event)
  const employee = await db.query.employees.findFirst({ where: eq(employees.id, user.id) })
  if (!employee) throw createError({ statusCode: 401, statusMessage: 'Sessão inválida.' })
  return employee
}

export async function requireManagerEmployee(event: H3Event) {
  const employee = await requireSessionEmployee(event)
  if (!MANAGER_ROLES.includes(employee.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Ação reservada à gestão.' })
  }
  return employee
}
