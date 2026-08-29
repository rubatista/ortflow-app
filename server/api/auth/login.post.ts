import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { employees } from '../../database/schema'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, BodySchema.parse)

  const employee = await db.query.employees.findFirst({
    where: eq(employees.email, email.trim().toLowerCase())
  })

  if (!employee || !(await verifyPassword(employee.passwordHash, password))) {
    throw createError({ statusCode: 401, statusMessage: 'Email ou password incorretos.' })
  }

  await setUserSession(event, { user: { id: employee.id } })

  return { id: employee.id }
})
