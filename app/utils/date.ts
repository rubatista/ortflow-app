import { BREAK_HOURS, BREAK_THRESHOLD_HOURS } from '~/types'

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseISODate(value: string): Date {
  const parts = value.split('-').map(Number)
  const year = parts[0] ?? 1970
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export function addMonths(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + amount)
  return result
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat('pt-PT', { weekday: 'short' }).format(date).replace('.', '')
}

export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' }).format(date)
}

export function formatLong(date: Date): string {
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatMonthYear(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

/** Conta dias úteis (seg-sex), inclusive, entre duas datas ISO — usado para o saldo de férias (norma legal: dias úteis). */
export function workingDaysBetweenInclusive(startISO: string, endISO: string): number {
  let count = 0
  let cursor = parseISODate(startISO)
  const end = parseISODate(endISO)
  while (cursor <= end) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count++
    cursor = addDays(cursor, 1)
  }
  return count
}

export function isoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = ((h ?? 0) * 60 + (m ?? 0) + Math.round(hours * 60) + 24 * 60) % (24 * 60)
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Escolhe uma hora de início aleatória (em blocos de 30 min) para um turno de `spanHours`, garantindo que termina até `closeTime`. */
export function randomShiftStart(spanHours: number, openTime: string, closeTime: string): string {
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  const openMinutes = (oh ?? 0) * 60 + (om ?? 0)
  const closeMinutes = (ch ?? 0) * 60 + (cm ?? 0)
  const latestStart = closeMinutes - Math.round(spanHours * 60)
  if (latestStart <= openMinutes) return openTime

  const slots = Math.floor((latestStart - openMinutes) / 30)
  const startMinutes = openMinutes + Math.floor(Math.random() * (slots + 1)) * 30
  const hh = String(Math.floor(startMinutes / 60)).padStart(2, '0')
  const mm = String(startMinutes % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh ?? 0) * 60 + (em ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0))) / 60
}

export function shiftHasBreak(entry: { startTime: string | null, endTime: string | null } | undefined): boolean {
  if (!entry?.startTime || !entry?.endTime) return false
  return hoursBetween(entry.startTime, entry.endTime) > BREAK_THRESHOLD_HOURS
}

export function shiftWorkedHours(entry: { startTime: string | null, endTime: string | null } | undefined): number {
  if (!entry?.startTime || !entry?.endTime) return 0
  const span = hoursBetween(entry.startTime, entry.endTime)
  return Math.max(0, span > BREAK_THRESHOLD_HOURS ? span - BREAK_HOURS : span)
}

export function shiftLabel(entry: { startTime: string | null, endTime: string | null } | undefined): string {
  if (!entry?.startTime || !entry?.endTime) return 'Folga'
  return `${entry.startTime} – ${entry.endTime}`
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.round(hours / 24)
  if (days < 7) return `há ${days}d`
  return formatDayMonth(new Date(iso))
}
