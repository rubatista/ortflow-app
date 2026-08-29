import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { db } from '../utils/db'
import { companies, employees, employeeSales, monthlyTargets, shifts, stores, storeSales, vacations, weeklyTargets } from './schema'

/** Mesmo driver de hashing usado em runtime por nuxt-auth-utils (server/utils/password.ts), com as opções por omissão — garante que os hashes gerados aqui são válidos para `verifyPassword` no login. */
const hash = new Hash(new Scrypt({}))

const SEED_PASSWORD = 'ortflow123'

const DEFAULT_VACATION_DAYS_PER_YEAR = 22

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

function addHoursToTime(time: string, hours: number) {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h! * 60 + m! + hours * 60
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const endH = Math.floor(wrapped / 60)
  const endM = Math.round(wrapped % 60)
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

const BREAK_HOURS = 1
const BREAK_THRESHOLD_HOURS = 6

const STORE_WEEKLY_BASELINE: Record<string, number> = {
  'store-vilacondo': 29657,
  'store-norteshopping': 24500,
  'store-gaiashopping': 19800
}

async function seed() {
  const passwordHash = await hash.make(SEED_PASSWORD)

  await db.insert(companies).values([
    { id: 'company-gng', name: 'GNG Franchising' }
  ])

  const storeRows = [
    { id: 'store-vilacondo', companyId: 'company-gng', name: 'Levi\'s Vila do Conde (Outlet)', location: 'Vila do Conde' },
    { id: 'store-norteshopping', companyId: 'company-gng', name: 'Nike NorteShopping', location: 'Matosinhos' },
    { id: 'store-gaiashopping', companyId: 'company-gng', name: 'Salsa Gaia Shopping', location: 'Vila Nova de Gaia' }
  ]
  await db.insert(stores).values(storeRows)

  const vacationDaysPerYear = DEFAULT_VACATION_DAYS_PER_YEAR
  const employeeRows = [
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
  await db.insert(employees).values(employeeRows.map(e => ({ ...e, passwordHash })))

  const monday = startOfWeek(new Date())
  const shiftRows: (typeof shifts.$inferInsert)[] = []
  const startPool = ['08:00', '09:00', '10:00', '13:00']
  for (const employee of employeeRows.filter(e => e.storeId)) {
    const workedHours = Math.max(4, Math.round((employee.weeklyHours / 5) * 2) / 2)
    const offDays = new Set<number>()
    while (offDays.size < 2) offDays.add(Math.floor(Math.random() * 7))

    for (let i = 0; i < 7; i++) {
      const date = toISODate(addDays(monday, i))
      if (offDays.has(i)) {
        shiftRows.push({ id: `${employee.id}-${date}`, employeeId: employee.id, date, startTime: null, endTime: null })
      } else {
        const startTime = startPool[Math.floor(Math.random() * startPool.length)]!
        const span = workedHours > BREAK_THRESHOLD_HOURS ? workedHours + BREAK_HOURS : workedHours
        const endTime = addHoursToTime(startTime, span)
        shiftRows.push({ id: `${employee.id}-${date}`, employeeId: employee.id, date, startTime, endTime })
      }
    }
  }
  await db.insert(shifts).values(shiftRows)

  const today = new Date()
  await db.insert(vacations).values([
    { id: 'vac-1', employeeId: 'emp-sara', type: 'ferias', startDate: toISODate(addDays(today, 3)), endDate: toISODate(addDays(today, 10)), status: 'aprovado', notes: 'Férias de verão' },
    { id: 'vac-2', employeeId: 'emp-eduarda', type: 'ferias', startDate: toISODate(addDays(today, 14)), endDate: toISODate(addDays(today, 21)), status: 'pendente' },
    { id: 'vac-3', employeeId: 'emp-ruben', type: 'baixa_medica', startDate: toISODate(addDays(today, -5)), endDate: toISODate(addDays(today, -1)), status: 'aprovado' },
    { id: 'vac-4', employeeId: 'emp-pedrocas', type: 'ferias', startDate: toISODate(addDays(today, 30)), endDate: toISODate(addDays(today, 35)), status: 'pendente' }
  ])

  const storeSalesRows: (typeof storeSales.$inferInsert)[] = []
  for (const store of storeRows) {
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
      storeSalesRows.push({ id: `sales-${store.id}-${iso}`, storeId: store.id, date: iso, target, achieved, totalClients, totalReceipts, returns, units })
    }
  }
  await db.insert(storeSales).values(storeSalesRows)

  const sellers = employeeRows.filter(e => e.role === 'vendedor' && e.storeId)
  const sellersByStore = new Map<string, typeof sellers>()
  for (const seller of sellers) {
    const list = sellersByStore.get(seller.storeId!) ?? []
    list.push(seller)
    sellersByStore.set(seller.storeId!, list)
  }

  const employeeSalesRows: (typeof employeeSales.$inferInsert)[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i)
    if (date > today) break
    const iso = toISODate(date)

    for (const [storeId, storeSellers] of sellersByStore) {
      const dayEntry = storeSalesRows.find(s => s.storeId === storeId && s.date === iso)
      if (!dayEntry) continue

      const weights = storeSellers.map(() => 0.6 + Math.random() * 0.8)
      const weightSum = weights.reduce((sum, w) => sum + w, 0)

      storeSellers.forEach((seller, idx) => {
        const share = weights[idx]! / weightSum
        const target = Math.round(dayEntry.target * share)
        const salesValue = Math.round(dayEntry.achieved * share)
        const clientsServed = Math.max(1, Math.round(salesValue / (10 + Math.random() * 4)))
        const units = Math.round(clientsServed * (1.3 + Math.random() * 0.6))
        employeeSalesRows.push({ id: `esales-${seller.id}-${iso}`, employeeId: seller.id, date: iso, salesValue, units, clientsServed, target })
      })
    }
  }
  await db.insert(employeeSales).values(employeeSalesRows)

  const weekStart = toISODate(monday)
  await db.insert(weeklyTargets).values(storeRows.map(store => ({
    id: `wtarget-${store.id}`,
    storeId: store.id,
    weekStart,
    target: STORE_WEEKLY_BASELINE[store.id] ?? 25000
  })))

  const month = toISODate(new Date(today.getFullYear(), today.getMonth(), 1)).slice(0, 7)
  await db.insert(monthlyTargets).values(storeRows.map(store => ({
    id: `mtarget-${store.id}`,
    storeId: store.id,
    month,
    target: Math.round((STORE_WEEKLY_BASELINE[store.id] ?? 25000) * 4.33)
  })))

  console.log(`Seed concluído: ${employeeRows.length} colaboradores criados.`)
  console.log(`Password de acesso para todos os utilizadores semeados: ${SEED_PASSWORD}`)
  console.log('Emails:', employeeRows.map(e => e.email).join(', '))
}

seed()
