import { eq } from 'drizzle-orm'
import { employees, shifts, vacations } from '../../database/schema'
import { requireManagerEmployee } from '../../utils/authz'

export default defineEventHandler(async (event) => {
  await requireManagerEmployee(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Id em falta.' })

  await db.delete(shifts).where(eq(shifts.employeeId, id))
  await db.delete(vacations).where(eq(vacations.employeeId, id))
  await db.delete(employees).where(eq(employees.id, id))

  return { success: true }
})
