import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { employees } from '../../../database/schema'
import { requireSessionEmployee } from '../../../utils/authz'

const MANAGER_ROLES = ['gerente', 'subgerente', 'gerente_regional']

const BodySchema = z.object({
  photoUrl: z.string().nullable()
})

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireSessionEmployee(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Id em falta.' })

  const targetEmployee = await db.query.employees.findFirst({ where: eq(employees.id, id) })
  if (!targetEmployee) throw createError({ statusCode: 404, statusMessage: 'Colaborador não encontrado.' })

  const isSelf = targetEmployee.id === actingEmployee.id
  const isColleague = targetEmployee.storeId && targetEmployee.storeId === actingEmployee.storeId
  const isManager = MANAGER_ROLES.includes(actingEmployee.role)
  if (!isSelf && !isColleague && !isManager) {
    throw createError({ statusCode: 403, statusMessage: 'Sem permissão para alterar esta foto.' })
  }

  const { photoUrl } = await readValidatedBody(event, BodySchema.parse)
  await db.update(employees).set({ photoUrl }).where(eq(employees.id, id))

  return { success: true }
})
