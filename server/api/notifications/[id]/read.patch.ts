import { eq } from 'drizzle-orm'
import { notifications } from '../../../database/schema'
import { requireSessionEmployee } from '../../../utils/authz'

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireSessionEmployee(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Id em falta.' })

  const notification = await db.query.notifications.findFirst({ where: eq(notifications.id, id) })
  if (!notification || notification.employeeId !== actingEmployee.id) {
    throw createError({ statusCode: 404, statusMessage: 'Notificação não encontrada.' })
  }

  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id))
  return { success: true }
})
