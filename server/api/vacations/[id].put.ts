import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { vacationAudit, vacations } from '../../database/schema'
import { requireSessionEmployee } from '../../utils/authz'

const BodySchema = z.object({
  type: z.enum(['ferias', 'baixa_medica', 'casamento', 'licenca_parental', 'gravidez_risco', 'outro']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireSessionEmployee(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Id em falta.' })

  const request = await db.query.vacations.findFirst({ where: eq(vacations.id, id) })
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado.' })
  if (request.employeeId !== actingEmployee.id) {
    throw createError({ statusCode: 403, statusMessage: 'Só podes editar os teus próprios pedidos.' })
  }

  const updates = await readValidatedBody(event, BodySchema.parse)
  const wasApproved = request.status === 'aprovado'

  await db.update(vacations).set({
    ...updates,
    status: wasApproved ? 'pendente' : request.status
  }).where(eq(vacations.id, id))

  await db.insert(vacationAudit).values({
    id: `vac-audit-${crypto.randomUUID()}`,
    employeeId: request.employeeId,
    type: updates.type,
    startDate: updates.startDate,
    endDate: updates.endDate,
    action: 'editado',
    changedByEmployeeId: actingEmployee.id,
    changedAt: new Date().toISOString()
  })

  return { success: true }
})
