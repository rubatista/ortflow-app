import { eq } from 'drizzle-orm'
import { notifications } from '../../database/schema'
import { requireSessionEmployee } from '../../utils/authz'

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireSessionEmployee(event)
  await db.update(notifications).set({ read: true }).where(eq(notifications.employeeId, actingEmployee.id))
  return { success: true }
})
