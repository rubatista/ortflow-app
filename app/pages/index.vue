<script setup lang="ts">
import { ABSENCE_TYPE_COLORS, ABSENCE_TYPE_LABELS } from '~/types'

const { employeesByStore, vacations, shiftFor, employeesOnVacation, storeSalesFor, weeklyTargetFor } = useAppData()
const { currentStore } = useSession()

const todayISO = toISODate(new Date())
const today = new Date()
const weekStart = startOfWeek(today)
const weekDaysSoFar = computed(() => {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i)
    if (day > today) break
    days.push(day)
  }
  return days
})

const weekSales = computed(() => {
  if (!currentStore.value) return null
  const totals = weekDaysSoFar.value.reduce((acc, day) => {
    const entry = storeSalesFor(currentStore.value!.id, toISODate(day))
    acc.achieved += entry?.achieved ?? 0
    acc.totalClients += entry?.totalClients ?? 0
    acc.totalReceipts += entry?.totalReceipts ?? 0
    acc.returns += entry?.returns ?? 0
    acc.units += entry?.units ?? 0
    return acc
  }, { achieved: 0, totalClients: 0, totalReceipts: 0, returns: 0, units: 0 })

  const target = weeklyTargetFor(currentStore.value.id, toISODate(weekStart))?.target ?? 0
  const salesReceipts = totals.totalReceipts - totals.returns

  return {
    ...totals,
    target,
    diff: totals.achieved - target,
    pct: target > 0 ? (totals.achieved / target) * 100 : 0,
    upt: salesReceipts > 0 ? totals.units / salesReceipts : 0,
    valuePerClient: totals.totalClients > 0 ? totals.achieved / totals.totalClients : 0
  }
})

const weekPctColor = computed(() => {
  if (!weekSales.value) return 'neutral'
  if (weekSales.value.pct >= 100) return 'success'
  if (weekSales.value.pct >= 80) return 'warning'
  return 'error'
})

const storeEmployees = computed(() => currentStore.value ? employeesByStore(currentStore.value.id) : [])
const storeEmployeeIds = computed(() => new Set(storeEmployees.value.map(e => e.id)))

const storeVacations = computed(() => vacations.value.filter(v => storeEmployeeIds.value.has(v.employeeId)))
const pendingCount = computed(() => storeVacations.value.filter(v => v.status === 'pendente').length)
const onVacationToday = computed(() => employeesOnVacation(todayISO).filter(e => storeEmployeeIds.value.has(e.id)))

const todaySchedule = computed(() => {
  return storeEmployees.value
    .map(employee => ({ employee, shift: shiftFor(employee.id, todayISO) }))
    .filter(entry => entry.shift?.startTime && entry.shift?.endTime)
})

const upcomingVacations = computed(() => {
  const limit = toISODate(addDays(new Date(), 30))
  return storeVacations.value
    .filter(v => v.status !== 'rejeitado' && v.startDate >= todayISO && v.startDate <= limit)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5)
})

const stats = computed(() => [
  { label: 'Colaboradores', value: storeEmployees.value.length, icon: 'i-lucide-users', color: 'primary' as const, to: '/team' },
  { label: 'Em turno hoje', value: todaySchedule.value.length, icon: 'i-lucide-calendar-clock', color: 'info' as const, to: '/schedules' },
  { label: 'Ausentes hoje', value: onVacationToday.value.length, icon: 'i-lucide-calendar-x', color: 'warning' as const, to: '/vacations' },
  { label: 'Pedidos pendentes', value: pendingCount.value, icon: 'i-lucide-clock', color: 'secondary' as const, to: '/vacations' }
])

function employeeById(id: string) {
  return storeEmployees.value.find(e => e.id === id)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div>
      <h1 class="text-2xl font-bold text-highlighted">
        Dashboard
      </h1>
      <p class="text-muted mt-1">
        {{ currentStore?.name }} · {{ formatLong(new Date()) }}
      </p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
        :ui="{ body: 'p-3 sm:p-6' }"
        class="cursor-pointer hover:ring-2 hover:ring-primary/40 transition"
        @click="navigateTo(stat.to)"
      >
        <div class="flex items-center gap-2.5 sm:gap-3">
          <SectionIcon
            :icon="stat.icon"
            :color="stat.color"
          />
          <div class="min-w-0">
            <p class="text-2xl font-bold text-highlighted leading-none">
              {{ stat.value }}
            </p>
            <p
              class="text-sm text-muted mt-1 break-words"
              style="hyphens: auto"
            >
              {{ stat.label }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard v-if="weekSales">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">
            Objetivo da semana
          </h2>
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ formatMonthYear(today) }} · Semana {{ isoWeekNumber(today) }}
          </UBadge>
        </div>
      </template>

      <p
        v-if="weekSales.target <= 0"
        class="text-xs text-muted -mt-2 mb-4"
      >
        Ainda não há objetivo definido para esta semana — define-o em Objetivos.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-6">
        <RadialProgress
          :value="weekSales.pct"
          :color="weekPctColor"
          size="lg"
          :label="formatPercent(weekSales.pct)"
          caption="do objetivo"
        />

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 w-full">
          <div>
            <p class="text-xs text-muted flex items-center gap-1">
              <UIcon
                name="i-lucide-trending-up"
                class="size-3.5"
              />
              Faturação
            </p>
            <p class="text-xl font-bold text-highlighted">
              {{ formatCurrency(weekSales.achieved) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted flex items-center gap-1">
              <UIcon
                name="i-lucide-target"
                class="size-3.5"
              />
              Objetivo
            </p>
            <p class="text-xl font-bold text-highlighted">
              {{ formatCurrency(weekSales.target) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted flex items-center gap-1">
              <UIcon
                name="i-lucide-arrow-right-left"
                class="size-3.5"
              />
              Diferença
            </p>
            <p
              class="text-xl font-bold"
              :class="weekSales.diff >= 0 ? 'text-success' : 'text-error'"
            >
              {{ weekSales.diff >= 0 ? '+' : '' }}{{ formatCurrency(weekSales.diff) }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-default">
        <div>
          <p class="text-xs text-muted">
            UPT
          </p>
          <p class="text-sm font-medium text-highlighted">
            {{ weekSales.upt.toFixed(1) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-muted">
            €/cliente
          </p>
          <p class="text-sm font-medium text-highlighted">
            {{ formatCurrency(weekSales.valuePerClient) }}
          </p>
        </div>
      </div>
    </UCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Escala de hoje
          </h2>
        </template>

        <div
          v-if="todaySchedule.length === 0"
          class="text-sm text-muted py-4 text-center"
        >
          Sem turnos atribuídos para hoje.
        </div>
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="entry in todaySchedule"
            :key="entry.employee.id"
            class="flex items-center justify-between py-2.5"
          >
            <div class="flex items-center gap-2.5">
              <PersonAvatar
                :name="entry.employee.name"
                :color="entry.employee.color"
                :photo-url="entry.employee.photoUrl"
                size="sm"
              />
              <p class="text-sm font-medium text-highlighted">
                {{ entry.employee.name }}
              </p>
            </div>
            <UBadge
              v-if="entry.shift"
              color="primary"
              variant="subtle"
            >
              {{ entry.shift.startTime }} – {{ entry.shift.endTime }} · {{ shiftWorkedHours(entry.shift) }}h
            </UBadge>
          </li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Próximas ausências
          </h2>
        </template>

        <div
          v-if="upcomingVacations.length === 0"
          class="text-sm text-muted py-4 text-center"
        >
          Sem ausências agendadas nos próximos 30 dias.
        </div>
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="vacation in upcomingVacations"
            :key="vacation.id"
            class="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <div class="flex items-center gap-2.5">
              <PersonAvatar
                :name="employeeById(vacation.employeeId)?.name ?? '?'"
                :color="employeeById(vacation.employeeId)?.color"
                :photo-url="employeeById(vacation.employeeId)?.photoUrl"
                size="sm"
              />
              <div>
                <p class="text-sm font-medium text-highlighted">
                  {{ employeeById(vacation.employeeId)?.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ formatDayMonth(parseISODate(vacation.startDate)) }} — {{ formatDayMonth(parseISODate(vacation.endDate)) }}
                </p>
              </div>
            </div>
            <UBadge
              :color="ABSENCE_TYPE_COLORS[vacation.type]"
              variant="subtle"
            >
              {{ ABSENCE_TYPE_LABELS[vacation.type] }}
            </UBadge>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
