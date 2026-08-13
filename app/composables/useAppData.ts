import type { AppNotification, Company, Employee, EmployeeSalesEntry, MonthlyTarget, ShiftAuditEntry, ShiftEntry, Store, StoreSalesEntry, VacationAuditAction, VacationAuditEntry, VacationRequest, VacationStatus, WeeklyTarget } from '~/types'
import { BREAK_HOURS, BREAK_THRESHOLD_HOURS, DEFAULT_VACATION_DAYS_PER_YEAR } from '~/types'

function seedCompanies(): Company[] {
  return [
    { id: 'company-gng', name: 'GNG Franchising' }
  ]
}

function seedStores(): Store[] {
  return [
    { id: 'store-vilacondo', companyId: 'company-gng', name: 'Levi\'s Vila do Conde (Outlet)', location: 'Vila do Conde' },
    { id: 'store-norteshopping', companyId: 'company-gng', name: 'Nike NorteShopping', location: 'Matosinhos' },
    { id: 'store-gaiashopping', companyId: 'company-gng', name: 'Salsa Gaia Shopping', location: 'Vila Nova de Gaia' }
  ]
}

function seedEmployees(): Employee[] {
  const vacationDaysPerYear = DEFAULT_VACATION_DAYS_PER_YEAR
  return [
    { id: 'emp-filipa', name: 'Filipa Nair', email: 'filipa.nair@ortflow.pt', role: 'gerente', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 40, vacationDaysPerYear, color: 'blue' },
    { id: 'emp-sergio', name: 'Sérgio Ronaldo', email: 'sergio.ronaldo@ortflow.pt', role: 'subgerente', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 40, vacationDaysPerYear, color: 'cyan' },
    { id: 'emp-diogo', name: 'Diogo Trigo', email: 'diogo.trigo@ortflow.pt', role: 'subgerente', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 30, vacationDaysPerYear, color: 'sky' },
    { id: 'emp-jose', name: 'José Albeto', email: 'jose.albeto@ortflow.pt', role: 'vendedor', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 40, vacationDaysPerYear, color: 'violet' },
    { id: 'emp-sara', name: 'Sara Costa', email: 'sara.costa@ortflow.pt', role: 'vendedor', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 30, vacationDaysPerYear, color: 'purple' },
    { id: 'emp-pedrocas', name: 'Pedrocas Silva', email: 'pedrocas.silva@ortflow.pt', role: 'assistente', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 30, vacationDaysPerYear, color: 'fuchsia' },
    { id: 'emp-leandro', name: 'Leandro Sousa', email: 'leandro.sousa@ortflow.pt', role: 'provador', companyId: 'company-gng', storeId: 'store-vilacondo', weeklyHours: 20, vacationDaysPerYear, color: 'pink' },

    { id: 'emp-ines-rodrigues', name: 'Inês Rodrigues', email: 'ines.rodrigues@ortflow.pt', role: 'gerente', companyId: 'company-gng', storeId: 'store-norteshopping', weeklyHours: 40, vacationDaysPerYear, color: 'amber' },
    { id: 'emp-eduarda', name: 'Eduarda Rodrigues', email: 'eduarda.rodrigues@ortflow.pt', role: 'vendedor', companyId: 'company-gng', storeId: 'store-norteshopping', weeklyHours: 40, vacationDaysPerYear, color: 'lime' },
    { id: 'emp-ruben', name: 'Rúben Baptista', email: 'ruben.baptista@ortflow.pt', role: 'assistente', companyId: 'company-gng', storeId: 'store-norteshopping', weeklyHours: 20, vacationDaysPerYear, color: 'green' },

    { id: 'emp-ines-castro', name: 'Ines Castro', email: 'ines.castro@ortflow.pt', role: 'gerente', companyId: 'company-gng', storeId: 'store-gaiashopping', weeklyHours: 40, vacationDaysPerYear, color: 'teal' },
    { id: 'emp-lara', name: 'Lara Pinto', email: 'lara.pinto@ortflow.pt', role: 'vendedor', companyId: 'company-gng', storeId: 'store-gaiashopping', weeklyHours: 30, vacationDaysPerYear, color: 'orange' },
    { id: 'emp-ines-costa', name: 'Ines Costa', email: 'ines.costa@ortflow.pt', role: 'vendedor', companyId: 'company-gng', storeId: 'store-gaiashopping', weeklyHours: 30, vacationDaysPerYear, color: 'orange' },

    { id: 'emp-carlos', name: 'Carlos Braga', email: 'carlos.braga@ortflow.pt', role: 'gerente_regional', companyId: 'company-gng', managedStoreIds: ['store-vilacondo', 'store-norteshopping', 'store-gaiashopping'], weeklyHours: 40, vacationDaysPerYear, color: 'red' }
  ]
}

function seedShifts(): ShiftEntry[] {
  const employees = seedEmployees().filter(e => e.storeId)
  const monday = startOfWeek(new Date())
  const startPool = ['08:00', '09:00', '10:00', '13:00']
  const shifts: ShiftEntry[] = []

  for (const employee of employees) {
    const workedHours = Math.max(4, Math.round((employee.weeklyHours / 5) * 2) / 2)
    const offDays = new Set<number>()
    while (offDays.size < 2) offDays.add(Math.floor(Math.random() * 7))

    for (let i = 0; i < 7; i++) {
      const date = toISODate(addDays(monday, i))
      if (offDays.has(i)) {
        shifts.push({ id: `${employee.id}-${date}`, employeeId: employee.id, date, startTime: null, endTime: null })
      } else {
        const startTime = startPool[Math.floor(Math.random() * startPool.length)]!
        const span = workedHours > BREAK_THRESHOLD_HOURS ? workedHours + BREAK_HOURS : workedHours
        const endTime = addHoursToTime(startTime, span)
        shifts.push({ id: `${employee.id}-${date}`, employeeId: employee.id, date, startTime, endTime })
      }
    }
  }

  return shifts
}

function seedVacations(): VacationRequest[] {
  const today = new Date()
  return [
    {
      id: 'vac-1',
      employeeId: 'emp-sara',
      startDate: toISODate(addDays(today, 3)),
      endDate: toISODate(addDays(today, 10)),
      status: 'aprovado',
      notes: 'Férias de verão'
    },
    {
      id: 'vac-2',
      employeeId: 'emp-eduarda',
      startDate: toISODate(addDays(today, 14)),
      endDate: toISODate(addDays(today, 21)),
      status: 'pendente'
    },
    {
      id: 'vac-3',
      employeeId: 'emp-ruben',
      startDate: toISODate(addDays(today, -5)),
      endDate: toISODate(addDays(today, -1)),
      status: 'aprovado'
    },
    {
      id: 'vac-4',
      employeeId: 'emp-pedrocas',
      startDate: toISODate(addDays(today, 30)),
      endDate: toISODate(addDays(today, 35)),
      status: 'pendente'
    }
  ]
}

const STORE_WEEKLY_BASELINE: Record<string, number> = {
  'store-vilacondo': 29657,
  'store-norteshopping': 24500,
  'store-gaiashopping': 19800
}

function seedStoreSales(): StoreSalesEntry[] {
  const stores = seedStores()
  const monday = startOfWeek(new Date())
  const today = new Date()
  const entries: StoreSalesEntry[] = []

  for (const store of stores) {
    const dailyTarget = (STORE_WEEKLY_BASELINE[store.id] ?? 25000) / 7
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i)
      if (date > today) break
      const iso = toISODate(date)
      const target = Math.round(dailyTarget)
      const achieved = Math.round(target * (0.75 + Math.random() * 0.35))
      const totalClients = Math.round(achieved / (9 + Math.random() * 3))
      const totalReceipts = Math.round(totalClients * 0.15)
      const returns = Math.round(totalReceipts * 0.05)
      const units = Math.round((totalReceipts - returns) * 1.7)
      entries.push({ id: `sales-${store.id}-${iso}`, storeId: store.id, date: iso, target, achieved, totalClients, totalReceipts, returns, units })
    }
  }
  return entries
}

function seedEmployeeSales(): EmployeeSalesEntry[] {
  const sellers = seedEmployees().filter(e => e.role === 'vendedor' && e.storeId)
  const storeSales = seedStoreSales()
  const monday = startOfWeek(new Date())
  const today = new Date()
  const entries: EmployeeSalesEntry[] = []

  const sellersByStore = new Map<string, Employee[]>()
  for (const seller of sellers) {
    const list = sellersByStore.get(seller.storeId!) ?? []
    list.push(seller)
    sellersByStore.set(seller.storeId!, list)
  }

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i)
    if (date > today) break
    const iso = toISODate(date)

    for (const [storeId, storeSellers] of sellersByStore) {
      const dayEntry = storeSales.find(s => s.storeId === storeId && s.date === iso)
      if (!dayEntry) continue

      const weights = storeSellers.map(() => 0.6 + Math.random() * 0.8)
      const weightSum = weights.reduce((sum, w) => sum + w, 0)

      storeSellers.forEach((seller, idx) => {
        const share = weights[idx]! / weightSum
        const target = Math.round(dayEntry.target * share)
        const salesValue = Math.round(dayEntry.achieved * share)
        const clientsServed = Math.max(1, Math.round(salesValue / (10 + Math.random() * 4)))
        const units = Math.round(clientsServed * (1.3 + Math.random() * 0.6))
        entries.push({ id: `esales-${seller.id}-${iso}`, employeeId: seller.id, date: iso, salesValue, units, clientsServed, target })
      })
    }
  }
  return entries
}

function seedWeeklyTargets(): WeeklyTarget[] {
  const stores = seedStores()
  const weekStart = toISODate(startOfWeek(new Date()))
  return stores.map(store => ({
    id: `wtarget-${store.id}`,
    storeId: store.id,
    weekStart,
    target: STORE_WEEKLY_BASELINE[store.id] ?? 25000
  }))
}

function seedMonthlyTargets(): MonthlyTarget[] {
  const stores = seedStores()
  const month = toISODate(startOfMonth(new Date())).slice(0, 7)
  return stores.map(store => ({
    id: `mtarget-${store.id}`,
    storeId: store.id,
    month,
    target: Math.round((STORE_WEEKLY_BASELINE[store.id] ?? 25000) * 4.33)
  }))
}

export function useAppData() {
  const companies = useLocalStorage<Company[]>('ortflow-companies-v2', seedCompanies(), { mergeDefaults: false })
  const stores = useLocalStorage<Store[]>('ortflow-stores-v2', seedStores(), { mergeDefaults: false })
  const employees = useLocalStorage<Employee[]>('ortflow-employees-v6', seedEmployees(), { mergeDefaults: false })
  const shifts = useLocalStorage<ShiftEntry[]>('ortflow-shifts-v6', seedShifts(), { mergeDefaults: false })
  const vacations = useLocalStorage<VacationRequest[]>('ortflow-vacations-v3', seedVacations(), { mergeDefaults: false })
  const shiftAudit = useLocalStorage<ShiftAuditEntry[]>('ortflow-shift-audit-v1', [], { mergeDefaults: false })
  const notifications = useLocalStorage<AppNotification[]>('ortflow-notifications-v1', [], { mergeDefaults: false })
  const vacationAudit = useLocalStorage<VacationAuditEntry[]>('ortflow-vacation-audit-v1', [], { mergeDefaults: false })
  const storeSales = useLocalStorage<StoreSalesEntry[]>('ortflow-store-sales-v2', seedStoreSales(), { mergeDefaults: false })
  const employeeSales = useLocalStorage<EmployeeSalesEntry[]>('ortflow-employee-sales-v3', seedEmployeeSales(), { mergeDefaults: false })
  const monthlyTargets = useLocalStorage<MonthlyTarget[]>('ortflow-monthly-targets-v2', seedMonthlyTargets(), { mergeDefaults: false })
  const weeklyTargets = useLocalStorage<WeeklyTarget[]>('ortflow-weekly-targets-v2', seedWeeklyTargets(), { mergeDefaults: false })

  function companyById(id: string) {
    return companies.value.find(c => c.id === id)
  }

  function storeById(id: string) {
    return stores.value.find(s => s.id === id)
  }

  function storesByCompany(companyId: string) {
    return stores.value.filter(s => s.companyId === companyId)
  }

  function employeeById(id: string) {
    return employees.value.find(e => e.id === id)
  }

  function employeesByStore(storeId: string) {
    return employees.value.filter(e => e.storeId === storeId)
  }

  function addEmployee(employee: Omit<Employee, 'id'>) {
    employees.value.push({ ...employee, id: `emp-${crypto.randomUUID()}` })
  }

  function removeEmployee(id: string) {
    employees.value = employees.value.filter(e => e.id !== id)
    shifts.value = shifts.value.filter(s => s.employeeId !== id)
    vacations.value = vacations.value.filter(v => v.employeeId !== id)
  }

  function setEmployeePhoto(id: string, photoUrl: string | null) {
    const employee = employeeById(id)
    if (employee) employee.photoUrl = photoUrl
  }

  function recordShiftChange(employeeId: string, date: string, changedByEmployeeId: string, previousLabel: string, newLabel: string) {
    if (previousLabel === newLabel) return

    shiftAudit.value.unshift({
      id: `audit-${crypto.randomUUID()}`,
      employeeId,
      date,
      changedByEmployeeId,
      changedAt: new Date().toISOString(),
      previousLabel,
      newLabel
    })

    if (changedByEmployeeId === employeeId) return
    const changedByName = employeeById(changedByEmployeeId)?.name ?? 'A gestão'
    notifications.value.unshift({
      id: `notif-${crypto.randomUUID()}`,
      employeeId,
      message: `${changedByName} alterou o teu horário de ${formatDayMonth(parseISODate(date))}: ${previousLabel} → ${newLabel}`,
      createdAt: new Date().toISOString(),
      read: false
    })
  }

  function setShiftTimes(employeeId: string, date: string, startTime: string, endTime: string, changedByEmployeeId: string) {
    const existing = shifts.value.find(s => s.employeeId === employeeId && s.date === date)
    const previousLabel = shiftLabel(existing)
    if (existing) {
      existing.startTime = startTime
      existing.endTime = endTime
    } else {
      shifts.value.push({ id: `${employeeId}-${date}`, employeeId, date, startTime, endTime })
    }
    recordShiftChange(employeeId, date, changedByEmployeeId, previousLabel, shiftLabel({ startTime, endTime }))
  }

  function setDayOff(employeeId: string, date: string, changedByEmployeeId: string) {
    const existing = shifts.value.find(s => s.employeeId === employeeId && s.date === date)
    const previousLabel = shiftLabel(existing)
    if (existing) {
      existing.startTime = null
      existing.endTime = null
    } else {
      shifts.value.push({ id: `${employeeId}-${date}`, employeeId, date, startTime: null, endTime: null })
    }
    recordShiftChange(employeeId, date, changedByEmployeeId, previousLabel, 'Folga')
  }

  function shiftFor(employeeId: string, date: string) {
    return shifts.value.find(s => s.employeeId === employeeId && s.date === date)
  }

  function auditForStore(storeId: string) {
    const ids = new Set(employeesByStore(storeId).map(e => e.id))
    return shiftAudit.value.filter(a => ids.has(a.employeeId))
  }

  function notificationsFor(employeeId: string) {
    return notifications.value.filter(n => n.employeeId === employeeId)
  }

  function unreadCountFor(employeeId: string) {
    return notifications.value.filter(n => n.employeeId === employeeId && !n.read).length
  }

  function markNotificationRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) notification.read = true
  }

  function markAllNotificationsRead(employeeId: string) {
    for (const notification of notifications.value) {
      if (notification.employeeId === employeeId) notification.read = true
    }
  }

  function addVacation(request: Omit<VacationRequest, 'id' | 'status'>) {
    vacations.value.push({ ...request, id: `vac-${crypto.randomUUID()}`, status: 'pendente' })
  }

  function recordVacationAudit(request: { employeeId: string, startDate: string, endDate: string }, action: VacationAuditAction, changedByEmployeeId: string) {
    vacationAudit.value.unshift({
      id: `vac-audit-${crypto.randomUUID()}`,
      employeeId: request.employeeId,
      startDate: request.startDate,
      endDate: request.endDate,
      action,
      changedByEmployeeId,
      changedAt: new Date().toISOString()
    })
  }

  function setVacationStatus(id: string, status: VacationStatus, changedByEmployeeId: string) {
    const request = vacations.value.find(v => v.id === id)
    if (!request) return
    request.status = status
    if (status === 'aprovado' || status === 'rejeitado') {
      recordVacationAudit(request, status, changedByEmployeeId)
    }
  }

  function removeVacation(id: string, changedByEmployeeId: string) {
    const request = vacations.value.find(v => v.id === id)
    if (request) recordVacationAudit(request, 'eliminado', changedByEmployeeId)
    vacations.value = vacations.value.filter(v => v.id !== id)
  }

  function vacationAuditForStore(storeId: string) {
    const ids = new Set(employeesByStore(storeId).map(e => e.id))
    return vacationAudit.value.filter(a => ids.has(a.employeeId))
  }

  function vacationDaysInYear(startDate: string, endDate: string, year: number) {
    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`
    const start = startDate < yearStart ? yearStart : startDate
    const end = endDate > yearEnd ? yearEnd : endDate
    if (start > end) return 0
    return workingDaysBetweenInclusive(start, end)
  }

  function vacationDaysUsed(employeeId: string, year: number) {
    return vacations.value
      .filter(v => v.employeeId === employeeId && v.status === 'aprovado')
      .reduce((total, v) => total + vacationDaysInYear(v.startDate, v.endDate, year), 0)
  }

  function vacationDaysPending(employeeId: string, year: number) {
    return vacations.value
      .filter(v => v.employeeId === employeeId && v.status === 'pendente')
      .reduce((total, v) => total + vacationDaysInYear(v.startDate, v.endDate, year), 0)
  }

  function storeSalesFor(storeId: string, date: string) {
    return storeSales.value.find(s => s.storeId === storeId && s.date === date)
  }

  function setStoreSales(storeId: string, date: string, data: Omit<StoreSalesEntry, 'id' | 'storeId' | 'date'>) {
    const existing = storeSales.value.find(s => s.storeId === storeId && s.date === date)
    if (existing) {
      Object.assign(existing, data)
    } else {
      storeSales.value.push({ id: `sales-${crypto.randomUUID()}`, storeId, date, ...data })
    }
  }

  function employeeSalesFor(employeeId: string, date: string) {
    return employeeSales.value.find(s => s.employeeId === employeeId && s.date === date)
  }

  function setEmployeeSales(employeeId: string, date: string, data: Omit<EmployeeSalesEntry, 'id' | 'employeeId' | 'date'>) {
    const existing = employeeSales.value.find(s => s.employeeId === employeeId && s.date === date)
    if (existing) {
      Object.assign(existing, data)
    } else {
      employeeSales.value.push({ id: `esales-${crypto.randomUUID()}`, employeeId, date, ...data })
    }
  }

  function monthlyTargetFor(storeId: string, month: string) {
    return monthlyTargets.value.find(m => m.storeId === storeId && m.month === month)
  }

  function setMonthlyTarget(storeId: string, month: string, target: number) {
    const existing = monthlyTargetFor(storeId, month)
    if (existing) {
      existing.target = target
    } else {
      monthlyTargets.value.push({ id: `mtarget-${crypto.randomUUID()}`, storeId, month, target })
    }
  }

  function weeklyTargetFor(storeId: string, weekStart: string) {
    return weeklyTargets.value.find(w => w.storeId === storeId && w.weekStart === weekStart)
  }

  function setWeeklyTarget(storeId: string, weekStart: string, target: number) {
    const existing = weeklyTargetFor(storeId, weekStart)
    if (existing) {
      existing.target = target
    } else {
      weeklyTargets.value.push({ id: `wtarget-${crypto.randomUUID()}`, storeId, weekStart, target })
    }
  }

  function employeesOnVacation(date: string) {
    const ids = vacations.value
      .filter(v => v.status === 'aprovado' && isDateInRange(date, v.startDate, v.endDate))
      .map(v => v.employeeId)
    return employees.value.filter(e => ids.includes(e.id))
  }

  return {
    companies,
    stores,
    employees,
    shifts,
    vacations,
    shiftAudit,
    notifications,
    vacationAudit,
    storeSales,
    employeeSales,
    monthlyTargets,
    weeklyTargets,
    companyById,
    storeById,
    storesByCompany,
    employeeById,
    employeesByStore,
    addEmployee,
    removeEmployee,
    setEmployeePhoto,
    setShiftTimes,
    setDayOff,
    shiftFor,
    auditForStore,
    notificationsFor,
    unreadCountFor,
    markNotificationRead,
    markAllNotificationsRead,
    addVacation,
    setVacationStatus,
    removeVacation,
    vacationAuditForStore,
    vacationDaysUsed,
    vacationDaysPending,
    storeSalesFor,
    setStoreSales,
    employeeSalesFor,
    setEmployeeSales,
    monthlyTargetFor,
    setMonthlyTarget,
    weeklyTargetFor,
    setWeeklyTarget,
    employeesOnVacation
  }
}
