import { eq } from 'drizzle-orm'
import { vacationAudit, vacations } from '../../database/schema'
import { requireSessionEmployee } from '../../utils/authz'

const MANAGER_ROLES = ['gerente', 'subgerente', 'gerente_regional']

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireSessionEmployee(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Id em falta.' })

  const request = await db.query.vacations.findFirst({ where: eq(vacations.id, id) })
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado.' })

  const isManager = MANAGER_ROLES.includes(actingEmployee.role)
  const isOwnEditable = request.employeeId === actingEmployee.id && request.status !== 'aprovado'
  if (!isManager && !isOwnEditable) {
    throw createError({ statusCode: 403, statusMessage: 'Sem permissão para eliminar este pedido.' })
  }

  await db.insert(vacationAudit).values({
    id: `vac-audit-${crypto.randomUUID()}`,
    employeeId: request.employeeId,
    type: request.type,
    startDate: request.startDate,
    endDate: request.endDate,
    action: 'eliminado',
    changedByEmployeeId: actingEmployee.id,
    changedAt: new Date().toISOString()
  })
  await db.delete(vacations).where(eq(vacations.id, id))

  return { success: true }
})
