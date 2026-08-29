import { companies, employeeSales, employees, monthlyTargets, notifications, shiftAudit, shifts, stores, storeSales, vacationAudit, vacations, weeklyTargets } from '../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const [
    companyRows,
    storeRows,
    employeeRows,
    shiftRows,
    vacationRows,
    shiftAuditRows,
    notificationRows,
    vacationAuditRows,
    storeSalesRows,
    employeeSalesRows,
    monthlyTargetRows,
    weeklyTargetRows
  ] = await Promise.all([
    db.select().from(companies),
    db.select().from(stores),
    db.select().from(employees),
    db.select().from(shifts),
    db.select().from(vacations),
    db.select().from(shiftAudit),
    db.select().from(notifications),
    db.select().from(vacationAudit),
    db.select().from(storeSales),
    db.select().from(employeeSales),
    db.select().from(monthlyTargets),
    db.select().from(weeklyTargets)
  ])

  return {
    companies: companyRows,
    stores: storeRows,
    employees: employeeRows.map(({ passwordHash: _passwordHash, ...employee }) => employee),
    shifts: shiftRows,
    vacations: vacationRows,
    shiftAudit: shiftAuditRows,
    notifications: notificationRows,
    vacationAudit: vacationAuditRows,
    storeSales: storeSalesRows,
    employeeSales: employeeSalesRows,
    monthlyTargets: monthlyTargetRows,
    weeklyTargets: weeklyTargetRows
  }
})
