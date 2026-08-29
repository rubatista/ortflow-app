import { z } from 'zod'
import { vacations } from '../../database/schema'
import { requireSessionEmployee } from '../../utils/authz'

const BodySchema = z.object({
  id: z.string().min(1),
  type: z.enum(['ferias', 'baixa_medica', 'casamento', 'licenca_parental', 'gravidez_risco', 'outro']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireSessionEmployee(event)
  const body = await readValidatedBody(event, BodySchema.parse)

  await db.insert(vacations).values({
    ...body,
    employeeId: actingEmployee.id,
    status: 'pendente'
  })

  return { id: body.id }
})
