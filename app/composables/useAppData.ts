import type { AbsenceType, AppNotification, Company, Employee, EmployeeSalesEntry, MonthlyTarget, ShiftAuditEntry, ShiftEntry, Store, StoreSalesEntry, VacationAuditEntry, VacationRequest, VacationStatus, WeeklyTarget } from '~/types'

interface BootstrapResponse {
  companies: Company[]
  stores: Store[]
  employees: Employee[]
  shifts: ShiftEntry[]
  vacations: VacationRequest[]
  shiftAudit: ShiftAuditEntry[]
  notifications: AppNotification[]
  vacationAudit: VacationAuditEntry[]
  storeSales: StoreSalesEntry[]
  employeeSales: EmployeeSalesEntry[]
  monthlyTargets: MonthlyTarget[]
  weeklyTargets: WeeklyTarget[]
}

export function useAppData() {
  const companies = useState<Company[]>('app-data-companies', () => [])
  const stores = useState<Store[]>('app-data-stores', () => [])
  const employees = useState<Employee[]>('app-data-employees', () => [])
  const shifts = useState<ShiftEntry[]>('app-data-shifts', () => [])
  const vacations = useState<VacationRequest[]>('app-data-vacations', () => [])
  const shiftAudit = useState<ShiftAuditEntry[]>('app-data-shift-audit', () => [])
  const notifications = useState<AppNotification[]>('app-data-notifications', () => [])
  const vacationAudit = useState<VacationAuditEntry[]>('app-data-vacation-audit', () => [])
  const storeSales = useState<StoreSalesEntry[]>('app-data-store-sales', () => [])
  const employeeSales = useState<EmployeeSalesEntry[]>('app-data-employee-sales', () => [])
  const monthlyTargets = useState<MonthlyTarget[]>('app-data-monthly-targets', () => [])
  const weeklyTargets = useState<WeeklyTarget[]>('app-data-weekly-targets', () => [])
  const bootstrapped = useState('app-data-bootstrapped', () => false)

  const toast = useToast()

  async function loadBootstrapData() {
    const data = await $fetch<BootstrapResponse>('/api/bootstrap', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
    })
    companies.value = data.companies
    stores.value = data.stores
    employees.value = data.employees
    shifts.value = data.shifts
    vacations.value = data.vacations
    shiftAudit.value = data.shiftAudit
    notifications.value = data.notifications
    vacationAudit.value = data.vacationAudit
    storeSales.value = data.storeSales
    employeeSales.value = data.employeeSales
    monthlyTargets.value = data.monthlyTargets
    weeklyTargets.value = data.weeklyTargets
    bootstrapped.value = true
  }

  let bootstrapPromise: Promise<void> | null = null

  /** Carrega os dados do servidor uma única vez por sessão de app. Chamado a partir do middleware de autenticação antes de renderizar qualquer página. */
  async function ensureBootstrapped() {
    if (bootstrapped.value) return
    if (!bootstrapPromise) {
      bootstrapPromise = loadBootstrapData().finally(() => {
        bootstrapPromise = null
      })
    }
    return bootstrapPromise
  }

  /** Reverte uma mutação otimista falhada, ressincronizando com o servidor. */
  function reportMutationError(error: unknown) {
    console.error(error)
    toast.add({
      title: 'Não foi possível guardar a alteração',
      description: 'A app vai sincronizar novamente com o servidor.',
      color: 'error'
    })
    loadBootstrapData().catch(err => console.error(err))
  }

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
    const record = { ...employee, id: `emp-${crypto.randomUUID()}` }
    employees.value.push(record)
    $fetch('/api/employees', { method: 'POST', body: record }).catch(reportMutationError)
  }

  function removeEmployee(id: string) {
    employees.value = employees.value.filter(e => e.id !== id)
    shifts.value = shifts.value.filter(s => s.employeeId !== id)
    vacations.value = vacations.value.filter(v => v.employeeId !== id)
    $fetch(`/api/employees/${id}`, { method: 'DELETE' }).catch(reportMutationError)
  }

  function setEmployeePhoto(id: string, photoUrl: string | null) {
    const employee = employeeById(id)
    if (employee) employee.photoUrl = photoUrl
    $fetch(`/api/employees/${id}/photo`, { method: 'PATCH', body: { photoUrl } }).catch(reportMutationError)
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

  function persistShift(employeeId: string, date: string, startTime: string | null, endTime: string | null) {
    $fetch('/api/shifts', { method: 'PUT', body: { employeeId, date, startTime, endTime } }).catch(reportMutationError)
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
    persistShift(employeeId, date, startTime, endTime)
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
    persistShift(employeeId, date, null, null)
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
    $fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(reportMutationError)
  }

  function markAllNotificationsRead(employeeId: string) {
    for (const notification of notifications.value) {
      if (notification.employeeId === employeeId) notification.read = true
    }
    $fetch('/api/notifications/read-all', { method: 'POST' }).catch(reportMutationError)
  }

  function addVacation(request: Omit<VacationRequest, 'id' | 'status'>) {
    const record = { ...request, id: `vac-${crypto.randomUUID()}`, status: 'pendente' as VacationStatus }
    vacations.value.push(record)
    $fetch('/api/vacations', { method: 'POST', body: record }).catch(reportMutationError)
  }

  function recordVacationAudit(request: { employeeId: string, type: AbsenceType, startDate: string, endDate: string }, action: VacationAuditEntry['action'], changedByEmployeeId: string) {
    vacationAudit.value.unshift({
      id: `vac-audit-${crypto.randomUUID()}`,
      employeeId: request.employeeId,
      type: request.type,
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
    $fetch(`/api/vacations/${id}/status`, { method: 'PATCH', body: { status } }).catch(reportMutationError)
  }

  function removeVacation(id: string, changedByEmployeeId: string) {
    const request = vacations.value.find(v => v.id === id)
    if (request) recordVacationAudit(request, 'eliminado', changedByEmployeeId)
    vacations.value = vacations.value.filter(v => v.id !== id)
    $fetch(`/api/vacations/${id}`, { method: 'DELETE' }).catch(reportMutationError)
  }

  /** Edita datas/tipo/notas de um pedido. Um pedido já aprovado volta a "pendente" — precisa de nova aprovação. */
  function updateVacation(id: string, updates: { type: AbsenceType, startDate: string, endDate: string, notes?: string }, changedByEmployeeId: string) {
    const request = vacations.value.find(v => v.id === id)
    if (!request) return
    const wasApproved = request.status === 'aprovado'
    request.type = updates.type
    request.startDate = updates.startDate
    request.endDate = updates.endDate
    request.notes = updates.notes
    if (wasApproved) request.status = 'pendente'
    recordVacationAudit(request, 'editado', changedByEmployeeId)
    $fetch(`/api/vacations/${id}`, { method: 'PUT', body: updates }).catch(reportMutationError)
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
      .filter(v => v.employeeId === employeeId && v.status === 'aprovado' && v.type === 'ferias')
      .reduce((total, v) => total + vacationDaysInYear(v.startDate, v.endDate, year), 0)
  }

  function vacationDaysPending(employeeId: string, year: number) {
    return vacations.value
      .filter(v => v.employeeId === employeeId && v.status === 'pendente' && v.type === 'ferias')
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
    $fetch('/api/store-sales', { method: 'PUT', body: { storeId, date, ...data } }).catch(reportMutationError)
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
    $fetch('/api/employee-sales', { method: 'PUT', body: { employeeId, date, ...data } }).catch(reportMutationError)
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
    $fetch('/api/targets/monthly', { method: 'PUT', body: { storeId, month, target } }).catch(reportMutationError)
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
    $fetch('/api/targets/weekly', { method: 'PUT', body: { storeId, weekStart, target } }).catch(reportMutationError)
  }

  function employeesOnVacation(date: string) {
    const ids = vacations.value
      .filter(v => v.status === 'aprovado' && isDateInRange(date, v.startDate, v.endDate))
      .map(v => v.employeeId)
    return employees.value.filter(e => ids.includes(e.id))
  }

  /** Devolve o pedido de ausência aprovado (de qualquer tipo) que cobre este colaborador nesta data, se existir. */
  function absenceOnDay(employeeId: string, date: string) {
    return vacations.value.find(v => v.employeeId === employeeId && v.status === 'aprovado' && isDateInRange(date, v.startDate, v.endDate))
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
    ensureBootstrapped,
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
    updateVacation,
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
    employeesOnVacation,
    absenceOnDay
  }
}
