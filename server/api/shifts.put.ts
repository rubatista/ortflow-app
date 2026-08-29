import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { notifications, shiftAudit, shifts } from '../database/schema'
import { requireManagerEmployee } from '../utils/authz'

const BodySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().nullable(),
  endTime: z.string().nullable()
})

function shiftLabel(entry: { startTime: string | null, endTime: string | null } | undefined) {
  if (!entry?.startTime || !entry?.endTime) return 'Folga'
  return `${entry.startTime} – ${entry.endTime}`
}

function formatDayMonth(dateISO: string) {
  const [year, month, day] = dateISO.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' }).format(new Date(year!, month! - 1, day))
}

export default defineEventHandler(async (event) => {
  const actingEmployee = await requireManagerEmployee(event)
  const { employeeId, date, startTime, endTime } = await readValidatedBody(event, BodySchema.parse)

  const existing = await db.query.shifts.findFirst({
    where: and(eq(shifts.employeeId, employeeId), eq(shifts.date, date))
  })
  const previousLabel = shiftLabel(existing)
  const newLabel = shiftLabel({ startTime, endTime })

  if (existing) {
    await db.update(shifts).set({ startTime, endTime }).where(eq(shifts.id, existing.id))
  } else {
    await db.insert(shifts).values({ id: `${employeeId}-${date}`, employeeId, date, startTime, endTime })
  }

  if (previousLabel !== newLabel) {
    await db.insert(shiftAudit).values({
      id: `audit-${crypto.randomUUID()}`,
      employeeId,
      date,
      changedByEmployeeId: actingEmployee.id,
      changedAt: new Date().toISOString(),
      previousLabel,
      newLabel
    })

    if (actingEmployee.id !== employeeId) {
      await db.insert(notifications).values({
        id: `notif-${crypto.randomUUID()}`,
        employeeId,
        message: `${actingEmployee.name} alterou o teu horário de ${formatDayMonth(date)}: ${previousLabel} → ${newLabel}`,
        createdAt: new Date().toISOString(),
        read: false
      })
    }
  }

  return { success: true }
})
