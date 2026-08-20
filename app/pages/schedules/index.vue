<script setup lang="ts">
import { ABSENCE_TYPE_COLORS, ABSENCE_TYPE_LABELS, BREAK_HOURS, BREAK_THRESHOLD_HOURS, MANAGER_ROLES, ROLE_GROUPS, ROLE_ORDER, STORE_CLOSING_TIME, STORE_OPENING_TIME } from '~/types'

const { employeesByStore, employeeById, shiftFor, setShiftTimes, setDayOff, vacations, auditForStore, absenceOnDay } = useAppData()
const { currentStore, currentUser } = useSession()
const { confirm: confirmAction } = useConfirm()
const toast = useToast()

const canEdit = computed(() => Boolean(currentUser.value && MANAGER_ROLES.includes(currentUser.value.role)))

const groupedEmployees = computed(() => {
  if (!currentStore.value) return []
  const employees = employeesByStore(currentStore.value.id)
  return ROLE_GROUPS
    .map(group => ({
      ...group,
      employees: employees
        .filter(e => group.roles.includes(e.role))
        .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
    }))
    .filter(group => group.employees.length > 0)
})

const weekAnchor = ref(startOfWeek(new Date()))

const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor.value, i)))

const weekLabel = computed(() => {
  const start = weekDays.value[0]!
  const end = weekDays.value[6]!
  return `${formatDayMonth(start)} — ${formatDayMonth(end)}`
})

function goToPreviousWeek() {
  weekAnchor.value = addDays(weekAnchor.value, -7)
}

function goToNextWeek() {
  weekAnchor.value = addDays(weekAnchor.value, 7)
}

function goToCurrentWeek() {
  weekAnchor.value = startOfWeek(new Date())
}

function entryFor(employeeId: string, day: Date) {
  return shiftFor(employeeId, toISODate(day))
}

function isOnVacation(employeeId: string, day: Date) {
  const iso = toISODate(day)
  return vacations.value.some(v => v.employeeId === employeeId && v.status === 'aprovado' && isDateInRange(iso, v.startDate, v.endDate))
}

function absenceFor(employeeId: string, day: Date) {
  return absenceOnDay(employeeId, toISODate(day))
}

function commitShift(employeeId: string, day: Date, startTime: string, endTime: string) {
  if (!currentUser.value) return
  setShiftTimes(employeeId, toISODate(day), startTime, endTime, currentUser.value.id)
}

function commitDayOff(employeeId: string, day: Date) {
  if (!currentUser.value) return
  setDayOff(employeeId, toISODate(day), currentUser.value.id)
}

async function generateRandomSchedule() {
  const actor = currentUser.value
  const store = currentStore.value
  if (!actor || !store) return
  const confirmed = await confirmAction({
    title: 'Gerar horário aleatório',
    description: 'Gerar horário aleatório para todos os colaboradores desta semana? Isto substitui os horários já definidos.',
    confirmLabel: 'Gerar',
    color: 'primary',
    icon: 'i-lucide-shuffle'
  })
  if (!confirmed) return

  for (const employee of employeesByStore(store.id)) {
    const workedHours = Math.max(4, Math.round((employee.weeklyHours / 5) * 2) / 2)
    const span = workedHours > BREAK_THRESHOLD_HOURS ? workedHours + BREAK_HOURS : workedHours
    const offDays = new Set<number>()
    while (offDays.size < 2) offDays.add(Math.floor(Math.random() * 7))

    weekDays.value.forEach((day, i) => {
      if (isOnVacation(employee.id, day)) return
      if (offDays.has(i)) {
        setDayOff(employee.id, toISODate(day), actor.id)
      } else {
        const startTime = randomShiftStart(span, STORE_OPENING_TIME, STORE_CLOSING_TIME)
        setShiftTimes(employee.id, toISODate(day), startTime, addHoursToTime(startTime, span), actor.id)
      }
    })
  }
}

async function copyPreviousWeek() {
  const actor = currentUser.value
  const store = currentStore.value
  if (!actor || !store) return
  const confirmed = await confirmAction({
    title: 'Copiar horário anterior',
    description: 'Copiar o horário da semana anterior para esta semana? Isto substitui os horários já definidos.',
    confirmLabel: 'Copiar',
    color: 'primary',
    icon: 'i-lucide-copy'
  })
  if (!confirmed) return

  const previousWeekStart = addDays(weekAnchor.value, -7)

  for (const employee of employeesByStore(store.id)) {
    weekDays.value.forEach((day, i) => {
      if (isOnVacation(employee.id, day)) return
      const previousEntry = shiftFor(employee.id, toISODate(addDays(previousWeekStart, i)))
      if (!previousEntry) return
      if (!previousEntry.startTime || !previousEntry.endTime) {
        setDayOff(employee.id, toISODate(day), actor.id)
      } else {
        setShiftTimes(employee.id, toISODate(day), previousEntry.startTime, previousEntry.endTime, actor.id)
      }
    })
  }
}

const aiPrompt = ref('')
const aiLoading = ref(false)

interface AiScheduleAssignment {
  employeeId: string
  date: string
  startTime: string | null
  endTime: string | null
}

async function generateWithAI() {
  const actor = currentUser.value
  const store = currentStore.value
  if (!actor || !store || !aiPrompt.value.trim()) return

  const confirmed = await confirmAction({
    title: 'Gerar horário com IA',
    description: 'Isto substitui os horários já definidos para esta semana, consoante o pedido feito à IA.',
    confirmLabel: 'Gerar',
    color: 'primary',
    icon: 'i-lucide-sparkles'
  })
  if (!confirmed) return

  aiLoading.value = true
  try {
    const employeesPayload = employeesByStore(store.id).map(employee => ({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      weeklyHours: employee.weeklyHours,
      vacationDates: weekDays.value.filter(day => isOnVacation(employee.id, day)).map(day => toISODate(day))
    }))

    const result = await $fetch<{ assignments: AiScheduleAssignment[] }>('/api/schedules/generate', {
      method: 'POST',
      body: {
        prompt: aiPrompt.value.trim(),
        storeOpeningTime: STORE_OPENING_TIME,
        storeClosingTime: STORE_CLOSING_TIME,
        weekDays: weekDays.value.map(toISODate),
        employees: employeesPayload
      }
    })

    const validDates = new Set(weekDays.value.map(toISODate))

    for (const assignment of result.assignments) {
      const employee = employeeById(assignment.employeeId)
      if (!employee || employee.storeId !== store.id) continue
      if (!validDates.has(assignment.date)) continue
      if (isOnVacation(assignment.employeeId, parseISODate(assignment.date))) continue

      if (assignment.startTime && assignment.endTime) {
        setShiftTimes(assignment.employeeId, assignment.date, assignment.startTime, assignment.endTime, actor.id)
      } else {
        setDayOff(assignment.employeeId, assignment.date, actor.id)
      }
    }

    aiPrompt.value = ''
    toast.add({ title: 'Horário gerado', description: 'A IA aplicou o horário pedido.', color: 'success' })
  } catch (err) {
    const description = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Tenta novamente.'
    toast.add({ title: 'Erro ao gerar horário', description, color: 'error' })
  } finally {
    aiLoading.value = false
  }
}

const storeAudit = computed(() => {
  if (!currentStore.value) return []
  return auditForStore(currentStore.value.id)
})

const auditPageSize = 8
const auditPage = ref(1)

const storeAuditPage = computed(() => {
  const start = (auditPage.value - 1) * auditPageSize
  return storeAudit.value.slice(start, start + auditPageSize)
})

function weeklyScheduledHours(employeeId: string) {
  return weekDays.value.reduce((total, day) => {
    if (isOnVacation(employeeId, day)) return total
    return total + shiftWorkedHours(entryFor(employeeId, day))
  }, 0)
}

function weeklyHoursColor(employeeId: string, weeklyHours: number) {
  const scheduled = weeklyScheduledHours(employeeId)
  if (scheduled === weeklyHours) return 'success'
  return scheduled > weeklyHours ? 'error' : 'warning'
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Horários
        </h1>
        <p class="text-muted mt-1">
          Entradas e saídas por colaborador · {{ currentStore?.name }}
        </p>
        <p
          v-if="!canEdit"
          class="text-xs text-muted mt-1 flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-lock"
            class="size-3.5"
          />
          Apenas o gerente e os subgerentes podem alterar horários.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="subtle"
          @click="goToPreviousWeek"
        />
        <UButton
          :label="weekLabel"
          color="neutral"
          variant="subtle"
          icon="i-lucide-calendar"
          @click="goToCurrentWeek"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="subtle"
          @click="goToNextWeek"
        />
        <UButton
          label="Mapa para impressão"
          icon="i-lucide-printer"
          color="neutral"
          variant="subtle"
          to="/schedules/print"
        />
        <UButton
          v-if="canEdit"
          label="Copiar semana anterior"
          icon="i-lucide-copy"
          color="neutral"
          variant="subtle"
          @click="copyPreviousWeek"
        />
        <UButton
          v-if="canEdit"
          label="Gerar horário aleatório"
          icon="i-lucide-shuffle"
          color="neutral"
          variant="subtle"
          @click="generateRandomSchedule"
        />
      </div>
    </div>

    <UCard v-if="canEdit">
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-sparkles"
            color="primary"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Gerar horário com IA
          </h2>
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <UTextarea
          v-model="aiPrompt"
          placeholder="Ex: A Sara só pode trabalhar até às 18h esta semana e o José Alberto quer folgar no sábado."
          :rows="2"
          autoresize
          class="w-full"
        />
        <div class="flex justify-end">
          <UButton
            label="Gerar"
            icon="i-lucide-sparkles"
            :loading="aiLoading"
            :disabled="!aiPrompt.trim()"
            @click="generateWithAI"
          />
        </div>
      </div>
    </UCard>

    <div
      v-if="groupedEmployees.length === 0"
      class="text-sm text-muted py-8 text-center"
    >
      Sem colaboradores nesta loja.
    </div>

    <UCard
      v-for="group in groupedEmployees"
      :key="group.label"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            :icon="group.icon"
            :color="group.color"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            {{ group.label }}
          </h2>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ group.employees.length }}
          </UBadge>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th class="text-left font-medium text-muted pr-4 pb-2 min-w-40">
                Colaborador
              </th>
              <th
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="text-center font-medium pb-2 px-1 min-w-28"
                :class="isToday(day) ? 'text-primary' : 'text-muted'"
              >
                <div class="capitalize">
                  {{ formatWeekday(day) }}
                </div>
                <div class="text-xs font-normal">
                  {{ formatDayMonth(day) }}
                </div>
              </th>
              <th class="text-center font-medium text-muted pb-2 px-2 min-w-24">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="employee in group.employees"
              :key="employee.id"
              class="even:bg-elevated/40"
            >
              <td class="pr-4 py-2 align-middle rounded-l-lg">
                <div class="flex items-center gap-2.5">
                  <PersonAvatar
                    :name="employee.name"
                    :color="employee.color"
                    :photo-url="employee.photoUrl"
                    size="sm"
                  />
                  <div class="min-w-0">
                    <p class="font-medium text-highlighted truncate">
                      {{ employee.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ employee.weeklyHours }}h/semana
                    </p>
                  </div>
                </div>
              </td>
              <td
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="px-1 py-2 text-center align-middle"
                :class="isToday(day) ? 'bg-primary/5' : ''"
              >
                <ScheduleCell
                  :start-time="entryFor(employee.id, day)?.startTime ?? null"
                  :end-time="entryFor(employee.id, day)?.endTime ?? null"
                  :editable="canEdit"
                  :absence-label="absenceFor(employee.id, day) ? ABSENCE_TYPE_LABELS[absenceFor(employee.id, day)!.type] : null"
                  :absence-color="absenceFor(employee.id, day) ? ABSENCE_TYPE_COLORS[absenceFor(employee.id, day)!.type] : undefined"
                  @commit="(start, end) => commitShift(employee.id, day, start, end)"
                  @day-off="commitDayOff(employee.id, day)"
                />
              </td>
              <td class="px-2 py-2 text-center align-middle rounded-r-lg">
                <UBadge
                  :color="weeklyHoursColor(employee.id, employee.weeklyHours)"
                  variant="subtle"
                >
                  {{ weeklyScheduledHours(employee.id) }}h / {{ employee.weeklyHours }}h
                </UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UCard v-if="canEdit">
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-history"
            color="neutral"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Histórico de alterações
          </h2>
        </div>
      </template>

      <div
        v-if="storeAudit.length === 0"
        class="text-sm text-muted py-4 text-center"
      >
        Sem alterações registadas.
      </div>
      <ul
        v-else
        class="divide-y divide-default"
      >
        <li
          v-for="entry in storeAuditPage"
          :key="entry.id"
          class="flex items-center justify-between gap-3 py-2.5 text-sm"
        >
          <p class="text-highlighted">
            <span class="font-medium">{{ employeeById(entry.changedByEmployeeId)?.name ?? 'Alguém' }}</span>
            alterou o horário de
            <span class="font-medium">{{ employeeById(entry.employeeId)?.name ?? 'colaborador removido' }}</span>
            ({{ formatDayMonth(parseISODate(entry.date)) }}): {{ entry.previousLabel }} → {{ entry.newLabel }}
          </p>
          <span class="text-xs text-muted shrink-0">{{ formatRelativeTime(entry.changedAt) }}</span>
        </li>
      </ul>
      <div
        v-if="storeAudit.length > auditPageSize"
        class="flex justify-center pt-4"
      >
        <UPagination
          v-model:page="auditPage"
          :total="storeAudit.length"
          :items-per-page="auditPageSize"
        />
      </div>
    </UCard>
  </div>
</template>
