import { z } from 'zod'
import { employees } from '../../database/schema'
import { requireManagerEmployee } from '../../utils/authz'

const DEFAULT_PASSWORD = 'ortflow123'

const BodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['vendedor', 'assistente', 'provador', 'subgerente', 'gerente']),
  color: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
  weeklyHours: z.number().int().positive(),
  vacationDaysPerYear: z.number().int().nonnegative()
})

export default defineEventHandler(async (event) => {
  await requireManagerEmployee(event)

  const body = await readValidatedBody(event, BodySchema.parse)
  const passwordHash = await hashPassword(DEFAULT_PASSWORD)

  await db.insert(employees).values({
    ...body,
    email: body.email.trim().toLowerCase(),
    passwordHash
  })

  return { id: body.id }
})
