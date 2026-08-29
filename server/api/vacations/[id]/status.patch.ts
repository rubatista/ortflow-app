import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { vacationAudit, vacations } from '../../../database/schema'
import { requireManagerEmployee } from '../../../utils/authz'

const BodySchema = z.object({
  status: z.enum(['aprovado', 'rejeitado'])
})

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireManagerEmployee(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Id em falta.' })

  const request = await db.query.vacations.findFirst({ where: eq(vacations.id, id) })
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado.' })
  if (request.employeeId === actingEmployee.id) {
    throw createError({ statusCode: 403, statusMessage: 'Não podes aprovar/rejeitar o teu próprio pedido.' })
  }

  const { status } = await readValidatedBody(event, BodySchema.parse)
  await db.update(vacations).set({ status }).where(eq(vacations.id, id))
  await db.insert(vacationAudit).values({
    id: `vac-audit-${crypto.randomUUID()}`,
    employeeId: request.employeeId,
    type: request.type,
    startDate: request.startDate,
    endDate: request.endDate,
    action: status,
    changedByEmployeeId: actingEmployee.id,
    changedAt: new Date().toISOString()
  })

  return { success: true }
})
