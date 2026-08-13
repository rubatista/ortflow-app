<script setup lang="ts">
import { ROLE_ORDER } from '~/types'

const { employeesByStore, shiftFor, vacations } = useAppData()
const { currentStore } = useSession()

const employees = computed(() => {
  if (!currentStore.value) return []
  return [...employeesByStore(currentStore.value.id)]
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
})

const monthAnchor = ref(startOfMonth(new Date()))
const monthLabel = computed(() => formatMonthYear(monthAnchor.value))

function goToPreviousMonth() {
  monthAnchor.value = startOfMonth(addMonths(monthAnchor.value, -1))
}

function goToNextMonth() {
  monthAnchor.value = startOfMonth(addMonths(monthAnchor.value, 1))
}

function goToCurrentMonth() {
  monthAnchor.value = startOfMonth(new Date())
}

const weeksInMonth = computed(() => {
  const firstDay = monthAnchor.value
  const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
  const weeks: Date[] = []
  let cursor = startOfWeek(firstDay)
  while (cursor <= lastDay) {
    weeks.push(cursor)
    cursor = addDays(cursor, 7)
  }
  return weeks
})

function weekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function weekLabel(weekStart: Date) {
  return `${formatDayMonth(weekStart)} — ${formatDayMonth(addDays(weekStart, 6))}`
}

function isOnVacation(employeeId: string, day: Date) {
  const iso = toISODate(day)
  return vacations.value.some(v => v.employeeId === employeeId && v.status === 'aprovado' && isDateInRange(iso, v.startDate, v.endDate))
}

function cellText(employeeId: string, day: Date) {
  if (isOnVacation(employeeId, day)) return 'Férias'
  return shiftLabel(shiftFor(employeeId, toISODate(day)))
}

function printPage() {
  window.print()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Mapa de horário para impressão
        </h1>
        <p class="text-muted mt-1">
          {{ currentStore?.name }} · afixar em local visível (ACT)
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="subtle"
          @click="goToPreviousMonth"
        />
        <UButton
          :label="monthLabel"
          color="neutral"
          variant="subtle"
          icon="i-lucide-calendar"
          class="capitalize"
          @click="goToCurrentMonth"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="subtle"
          @click="goToNextMonth"
        />
        <UButton
          label="Voltar"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/horarios"
        />
        <UButton
          label="Imprimir"
          icon="i-lucide-printer"
          @click="printPage"
        />
      </div>
    </div>

    <div class="hidden print:block mb-2">
      <h1 class="text-lg font-bold">
        Mapa de Horário de Trabalho
      </h1>
      <p class="text-sm">
        {{ currentStore?.name }} — {{ monthLabel }}
      </p>
    </div>

    <div
      v-if="employees.length === 0"
      class="text-sm text-muted py-8 text-center print:hidden"
    >
      Sem colaboradores nesta loja.
    </div>

    <table
      v-for="week in weeksInMonth"
      :key="toISODate(week)"
      class="w-full text-xs border-collapse mb-4 print-week"
    >
      <thead>
        <tr>
          <th
            colspan="8"
            class="text-left font-semibold text-highlighted pb-1 border-b border-default"
          >
            Semana de {{ weekLabel(week) }}
          </th>
        </tr>
        <tr>
          <th class="text-left font-medium text-muted py-1 pr-2 border-b border-default min-w-32">
            Colaborador
          </th>
          <th
            v-for="day in weekDays(week)"
            :key="day.toISOString()"
            class="text-center font-medium text-muted py-1 px-1 border-b border-default"
          >
            <div class="capitalize">
              {{ formatWeekday(day) }}
            </div>
            <div class="font-normal">
              {{ day.getDate() }}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="employee in employees"
          :key="employee.id"
          class="even:bg-elevated/40 print:even:bg-transparent"
        >
          <td class="py-1 pr-2 border-b border-default font-medium text-highlighted">
            {{ employee.name }}
          </td>
          <td
            v-for="day in weekDays(week)"
            :key="day.toISOString()"
            class="text-center py-1 px-1 border-b border-default whitespace-nowrap"
          >
            {{ cellText(employee.id, day) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 12mm;
  }

  .print-week {
    break-inside: avoid;
  }
}
</style>
