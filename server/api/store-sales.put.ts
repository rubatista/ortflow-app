import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { storeSales } from '../database/schema'
import { requireManagerEmployee } from '../utils/authz'

const BodySchema = z.object({
  storeId: z.string().min(1),
  date: z.string().min(1),
  target: z.number(),
  achieved: z.number(),
  totalClients: z.number().int(),
  totalReceipts: z.number().int(),
  returns: z.number().int(),
  units: z.number().int()
})

export default defineEventHandler(async (event) => {
  await requireManagerEmployee(event)
  const { storeId, date, ...data } = await readValidatedBody(event, BodySchema.parse)

  const existing = await db.query.storeSales.findFirst({
    where: and(eq(storeSales.storeId, storeId), eq(storeSales.date, date))
  })

  if (existing) {
    await db.update(storeSales).set(data).where(eq(storeSales.id, existing.id))
  } else {
    await db.insert(storeSales).values({ id: `sales-${crypto.randomUUID()}`, storeId, date, ...data })
  }

  return { success: true }
})
