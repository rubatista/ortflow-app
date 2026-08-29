import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { employeeSales } from '../database/schema'
import { requireManagerEmployee } from '../utils/authz'

const BodySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  salesValue: z.number(),
  units: z.number().int(),
  clientsServed: z.number().int(),
  target: z.number()
})

export default defineEventHandler(async (event) => {
  await requireManagerEmployee(event)
  const { employeeId, date, ...data } = await readValidatedBody(event, BodySchema.parse)

  const existing = await db.query.employeeSales.findFirst({
    where: and(eq(employeeSales.employeeId, employeeId), eq(employeeSales.date, date))
  })

  if (existing) {
    await db.update(employeeSales).set(data).where(eq(employeeSales.id, existing.id))
  } else {
    await db.insert(employeeSales).values({ id: `esales-${crypto.randomUUID()}`, employeeId, date, ...data })
  }

  return { success: true }
})
