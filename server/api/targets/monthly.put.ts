import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { monthlyTargets } from '../../database/schema'
import { requireManagerEmployee } from '../../utils/authz'

const BodySchema = z.object({
  storeId: z.string().min(1),
  month: z.string().min(1),
  target: z.number()
})

export default defineEventHandler(async (event) => {
  await requireManagerEmployee(event)
  const { storeId, month, target } = await readValidatedBody(event, BodySchema.parse)

  const existing = await db.query.monthlyTargets.findFirst({
    where: and(eq(monthlyTargets.storeId, storeId), eq(monthlyTargets.month, month))
  })

  if (existing) {
    await db.update(monthlyTargets).set({ target }).where(eq(monthlyTargets.id, existing.id))
  } else {
    await db.insert(monthlyTargets).values({ id: `mtarget-${crypto.randomUUID()}`, storeId, month, target })
  }

  return { success: true }
})
