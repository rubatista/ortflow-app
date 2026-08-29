import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { weeklyTargets } from '../../database/schema'
import { requireManagerEmployee } from '../../utils/authz'

const BodySchema = z.object({
  storeId: z.string().min(1),
  weekStart: z.string().min(1),
  target: z.number()
})

export default defineEventHandler(async (event) => {
  await requireManagerEmployee(event)
  const { storeId, weekStart, target } = await readValidatedBody(event, BodySchema.parse)

  const existing = await db.query.weeklyTargets.findFirst({
    where: and(eq(weeklyTargets.storeId, storeId), eq(weeklyTargets.weekStart, weekStart))
  })

  if (existing) {
    await db.update(weeklyTargets).set({ target }).where(eq(weeklyTargets.id, existing.id))
  } else {
    await db.insert(weeklyTargets).values({ id: `wtarget-${crypto.randomUUID()}`, storeId, weekStart, target })
  }

  return { success: true }
})
