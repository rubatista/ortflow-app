<script setup lang="ts">
import type { AbsenceType, BadgeColor } from '~/types'
import { ABSENCE_TYPE_COLORS, ABSENCE_TYPE_LABELS, ABSENCE_TYPE_OPTIONS, MANAGER_ROLES, VACATION_AUDIT_COLORS, VACATION_AUDIT_LABELS, VACATION_STATUS_COLORS } from '~/types'

/** Classes literais (o Tailwind não compila `bg-${cor}` gerado dinamicamente). */
const DOT_COLOR_CLASSES: Record<BadgeColor, string> = {
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  neutral: 'bg-neutral'
}

const RING_COLOR_CLASSES: Record<BadgeColor, string> = {
  success: 'ring-success',
  error: 'ring-error',
  warning: 'ring-warning',
  info: 'ring-info',
  primary: 'ring-primary',
  secondary: 'ring-secondary',
  neutral: 'ring-neutral'
}

const { employeesByStore, employeeById, vacations, employeesOnVacation, absenceOnDay, addVacation, setVacationStatus, removeVacation, updateVacation, vacationAuditForStore, vacationDaysUsed, vacationDaysPending } = useAppData()
const { currentStore, currentUser } = useSession()
const { confirm: confirmAction } = useConfirm()

const isManager = computed(() => Boolean(currentUser.value && MANAGER_ROLES.includes(currentUser.value.role)))

function canRemove(vacation: { employeeId: string, status: string }) {
  if (isManager.value) return true
  return vacation.employeeId === currentUser.value?.id && vacation.status !== 'aprovado'
}

/** Um gerente não pode aprovar/rejeitar o seu próprio pedido. */
function canDecide(vacation: { employeeId: string }) {
  return isManager.value && vacation.employeeId !== currentUser.value?.id
}

function approve(id: string) {
  if (currentUser.value) setVacationStatus(id, 'aprovado', currentUser.value.id)
}

function reject(id: string) {
  if (currentUser.value) setVacationStatus(id, 'rejeitado', currentUser.value.id)
}

async function remove(id: string) {
  if (!currentUser.value) return
  const confirmed = await confirmAction({
    title: 'Eliminar pedido de ausência',
    description: 'Tens a certeza que queres eliminar este pedido de ausência? Esta ação não pode ser desfeita.',
    confirmLabel: 'Eliminar',
    icon: 'i-lucide-trash-2'
  })
  if (confirmed) removeVacation(id, currentUser.value.id)
}

const vacationHistory = computed(() => {
  if (!currentStore.value) return []
  return vacationAuditForStore(currentStore.value.id)
})

const historyPageSize = 8
const historyPage = ref(1)

const vacationHistoryPage = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize
  return vacationHistory.value.slice(start, start + historyPageSize)
})

const employees = computed(() => currentStore.value ? employeesByStore(currentStore.value.id) : [])
const employeeIds = computed(() => new Set(employees.value.map(e => e.id)))

const currentYear = new Date().getFullYear()

function balanceFor(employee: { id: string, vacationDaysPerYear: number }) {
  const used = vacationDaysUsed(employee.id, currentYear)
  const pending = vacationDaysPending(employee.id, currentYear)
  return { allocated: employee.vacationDaysPerYear, used, pending, remaining: employee.vacationDaysPerYear - used - pending }
}

const balanceRows = computed(() => {
  if (isManager.value) return employees.value
  return employees.value.filter(e => e.id === currentUser.value?.id)
})

const monthAnchor = ref(startOfMonth(new Date()))

const monthLabel = computed(() => formatMonthYear(monthAnchor.value))

const calendarCells = computed(() => {
  const first = monthAnchor.value
  const total = daysInMonth(first)
  const leading = (first.getDay() + 6) % 7 // Monday = 0

  const cells: { date: Date | null, iso: string | null }[] = []
  for (let i = 0; i < leading; i++) cells.push({ date: null, iso: null })
  for (let day = 1; day <= total; day++) {
    const date = new Date(first.getFullYear(), first.getMonth(), day)
    cells.push({ date, iso: toISODate(date) })
  }
  return cells
})

function goToPreviousMonth() {
  monthAnchor.value = startOfMonth(addMonths(monthAnchor.value, -1))
}

function goToNextMonth() {
  monthAnchor.value = startOfMonth(addMonths(monthAnchor.value, 1))
}

function goToCurrentMonth() {
  monthAnchor.value = startOfMonth(new Date())
}

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const filter = ref<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('todos')
const filterTabs = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Aprovados', value: 'aprovado' },
  { label: 'Rejeitados', value: 'rejeitado' }
]

const filteredVacations = computed(() => {
  const list = vacations.value
    .filter(v => employeeIds.value.has(v.employeeId))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
  if (filter.value === 'todos') return list
  return list.filter(v => v.status === filter.value)
})

function employeesOnVacationInStore(iso: string) {
  return employeesOnVacation(iso).filter(e => employeeIds.value.has(e.id))
}

/** Cor do anel do avatar (desktop) consoante o tipo de ausência da pessoa neste dia. */
function ringColorFor(employeeId: string, iso: string) {
  const type = absenceOnDay(employeeId, iso)?.type ?? 'ferias'
  return RING_COLOR_CLASSES[ABSENCE_TYPE_COLORS[type]]
}

/** Tipos de ausência distintos presentes neste dia, nesta loja (para o indicador compacto no mobile). */
function absenceTypesForDay(iso: string): AbsenceType[] {
  const types = new Set<AbsenceType>()
  for (const employee of employeesOnVacationInStore(iso)) {
    const record = vacations.value.find(v => v.employeeId === employee.id && v.status === 'aprovado' && isDateInRange(iso, v.startDate, v.endDate))
    if (record) types.add(record.type)
  }
  return Array.from(types)
}

const selectedDay = ref<{ date: Date, iso: string } | null>(null)
const isDayModalOpen = ref(false)

function openDayModal(date: Date, iso: string) {
  selectedDay.value = { date, iso }
  isDayModalOpen.value = true
}

const selectedDayEmployees = computed(() => {
  if (!selectedDay.value) return []
  const iso = selectedDay.value.iso
  return employeesOnVacationInStore(iso).map(employee => ({
    employee,
    vacation: vacations.value.find(v => v.employeeId === employee.id && v.status === 'aprovado' && isDateInRange(iso, v.startDate, v.endDate))
  }))
})

const isRequestModalOpen = ref(false)
const newRequest = reactive({ type: 'ferias' as AbsenceType, startDate: '', endDate: '', notes: '' })

function openRequestModal() {
  newRequest.type = 'ferias'
  newRequest.startDate = toISODate(new Date())
  newRequest.endDate = toISODate(new Date())
  newRequest.notes = ''
  isRequestModalOpen.value = true
}

function submitRequest() {
  if (!currentUser.value || !newRequest.startDate || !newRequest.endDate) return
  if (newRequest.endDate < newRequest.startDate) return
  addVacation({
    employeeId: currentUser.value.id,
    type: newRequest.type,
    startDate: newRequest.startDate,
    endDate: newRequest.endDate,
    notes: newRequest.notes.trim() || undefined
  })
  isRequestModalOpen.value = false
}

function canEdit(vacation: { employeeId: string }) {
  return vacation.employeeId === currentUser.value?.id
}

const isEditModalOpen = ref(false)
const editingVacationId = ref<string | null>(null)
const editRequest = reactive({ type: 'ferias' as AbsenceType, startDate: '', endDate: '', notes: '' })

const editingVacation = computed(() => vacations.value.find(v => v.id === editingVacationId.value) ?? null)

function openEditModal(vacation: { id: string, type: AbsenceType, startDate: string, endDate: string, notes?: string }) {
  editingVacationId.value = vacation.id
  editRequest.type = vacation.type
  editRequest.startDate = vacation.startDate
  editRequest.endDate = vacation.endDate
  editRequest.notes = vacation.notes ?? ''
  isEditModalOpen.value = true
}

function submitEdit() {
  if (!currentUser.value || !editingVacationId.value || !editRequest.startDate || !editRequest.endDate) return
  if (editRequest.endDate < editRequest.startDate) return
  updateVacation(editingVacationId.value, {
    type: editRequest.type,
    startDate: editRequest.startDate,
    endDate: editRequest.endDate,
    notes: editRequest.notes.trim() || undefined
  }, currentUser.value.id)
  isEditModalOpen.value = false
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Ausências
        </h1>
        <p class="text-muted mt-1">
          Calendário e pedidos de ausência · {{ currentStore?.name }}
        </p>
      </div>
      <UButton
        label="Novo pedido"
        icon="i-lucide-plus"
        @click="openRequestModal"
      />
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <SectionIcon
              icon="i-lucide-calendar-days"
              color="primary"
              size="sm"
            />
            <h2 class="font-semibold text-highlighted capitalize">
              {{ monthLabel }}
            </h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="subtle"
              size="sm"
              @click="goToPreviousMonth"
            />
            <UButton
              label="Hoje"
              color="neutral"
              variant="subtle"
              size="sm"
              @click="goToCurrentMonth"
            />
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="subtle"
              size="sm"
              @click="goToNextMonth"
            />
          </div>
        </div>
      </template>

      <div class="grid grid-cols-7 gap-1 sm:gap-1.5">
        <div
          v-for="label in weekdayLabels"
          :key="label"
          class="text-[10px] sm:text-xs font-medium text-muted text-center pb-1 truncate"
        >
          {{ label }}
        </div>

        <div
          v-for="(cell, index) in calendarCells"
          :key="index"
          class="min-h-14 sm:min-h-20 rounded-lg border border-default p-1 sm:p-1.5"
          :class="[
            cell.date && isToday(cell.date) ? 'border-primary bg-primary/5' : '',
            cell.iso && employeesOnVacationInStore(cell.iso).length > 0 ? 'cursor-pointer hover:border-primary/50 hover:bg-elevated/40 transition' : '',
            cell.iso && employeesOnVacationInStore(cell.iso).length > 0 && !(cell.date && isToday(cell.date)) ? 'bg-elevated/60 sm:bg-transparent' : ''
          ]"
          @click="cell.date && cell.iso && employeesOnVacationInStore(cell.iso).length > 0 && openDayModal(cell.date, cell.iso)"
        >
          <template v-if="cell.date && cell.iso">
            <div class="flex items-center justify-between gap-1 sm:block">
              <p class="text-[10px] sm:text-xs text-muted mb-1">
                {{ cell.date.getDate() }}
              </p>
              <div
                v-if="employeesOnVacationInStore(cell.iso).length > 0"
                class="sm:hidden flex items-center gap-0.5 shrink-0"
              >
                <span
                  v-for="type in absenceTypesForDay(cell.iso).slice(0, 4)"
                  :key="type"
                  class="size-2 rounded-full"
                  :class="DOT_COLOR_CLASSES[ABSENCE_TYPE_COLORS[type]]"
                />
              </div>
            </div>
            <div class="hidden sm:flex -space-x-2">
              <PersonAvatar
                v-for="person in employeesOnVacationInStore(cell.iso).slice(0, 3)"
                :key="person.id"
                :name="person.name"
                :color="person.color"
                :photo-url="person.photoUrl"
                size="sm"
                class="ring-2"
                :class="ringColorFor(person.id, cell.iso)"
              />
              <span
                v-if="employeesOnVacationInStore(cell.iso).length > 3"
                class="text-[10px] sm:text-xs text-muted self-center ml-1.5"
              >
                +{{ employeesOnVacationInStore(cell.iso).length - 3 }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-tree-palm"
            color="success"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Saldo de férias {{ currentYear }}
          </h2>
        </div>
      </template>

      <ul class="divide-y divide-default">
        <li
          v-for="employee in balanceRows"
          :key="employee.id"
          class="flex flex-wrap items-center justify-between gap-3 py-2.5"
        >
          <div class="flex items-center gap-2.5">
            <PersonAvatar
              :name="employee.name"
              :color="employee.color"
              :photo-url="employee.photoUrl"
              size="sm"
            />
            <p class="text-sm font-medium text-highlighted">
              {{ employee.name }}
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs text-muted">
            <span>Atribuídos: {{ balanceFor(employee).allocated }}</span>
            <span>Usados: {{ balanceFor(employee).used }}</span>
            <span v-if="balanceFor(employee).pending > 0">Pendentes: {{ balanceFor(employee).pending }}</span>
            <UBadge
              :color="balanceFor(employee).remaining >= 0 ? 'success' : 'error'"
              variant="subtle"
            >
              Saldo: {{ balanceFor(employee).remaining }}
            </UBadge>
          </div>
        </li>
        <li
          v-if="balanceRows.length === 0"
          class="text-sm text-muted py-4 text-center"
        >
          Sem colaboradores.
        </li>
      </ul>
    </UCard>

    <UCard>
      <template #header>
        <UTabs
          v-model="filter"
          :items="filterTabs"
          size="sm"
        />
      </template>

      <div
        v-if="filteredVacations.length === 0"
        class="text-sm text-muted py-4 text-center"
      >
        Sem pedidos de ausência nesta categoria.
      </div>

      <ul
        v-else
        class="divide-y divide-default"
      >
        <li
          v-for="vacation in filteredVacations"
          :key="vacation.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
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
                <span v-if="vacation.notes"> · {{ vacation.notes }}</span>
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              :color="ABSENCE_TYPE_COLORS[vacation.type]"
              variant="subtle"
            >
              {{ ABSENCE_TYPE_LABELS[vacation.type] }}
            </UBadge>
            <UBadge
              :color="VACATION_STATUS_COLORS[vacation.status]"
              variant="outline"
            >
              {{ vacation.status }}
            </UBadge>
            <UButton
              v-if="canDecide(vacation) && vacation.status !== 'aprovado'"
              icon="i-lucide-check"
              color="success"
              variant="ghost"
              size="xs"
              @click="approve(vacation.id)"
            />
            <UButton
              v-if="canDecide(vacation) && vacation.status !== 'rejeitado'"
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              size="xs"
              @click="reject(vacation.id)"
            />
            <UButton
              v-if="canEdit(vacation)"
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="openEditModal(vacation)"
            />
            <UButton
              v-if="canRemove(vacation)"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="remove(vacation.id)"
            />
          </div>
        </li>
      </ul>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-history"
            color="neutral"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Histórico
          </h2>
        </div>
      </template>

      <div
        v-if="vacationHistory.length === 0"
        class="text-sm text-muted py-4 text-center"
      >
        Sem alterações registadas.
      </div>
      <ul
        v-else
        class="divide-y divide-default"
      >
        <li
          v-for="entry in vacationHistoryPage"
          :key="entry.id"
          class="flex items-center justify-between gap-3 py-2.5 text-sm"
        >
          <p class="text-highlighted">
            <span class="font-medium">{{ employeeById(entry.changedByEmployeeId)?.name ?? 'Alguém' }}</span>
            <UBadge
              :color="VACATION_AUDIT_COLORS[entry.action]"
              variant="subtle"
              size="sm"
              class="mx-1"
            >
              {{ VACATION_AUDIT_LABELS[entry.action] }}
            </UBadge>
            o pedido de
            <UBadge
              :color="ABSENCE_TYPE_COLORS[entry.type]"
              variant="subtle"
              size="sm"
              class="mx-1"
            >
              {{ ABSENCE_TYPE_LABELS[entry.type] }}
            </UBadge>
            de
            <span class="font-medium">{{ employeeById(entry.employeeId)?.name ?? 'colaborador removido' }}</span>
            ({{ formatDayMonth(parseISODate(entry.startDate)) }} — {{ formatDayMonth(parseISODate(entry.endDate)) }})
          </p>
          <span class="text-xs text-muted shrink-0">{{ formatRelativeTime(entry.changedAt) }}</span>
        </li>
      </ul>
      <div
        v-if="vacationHistory.length > historyPageSize"
        class="flex justify-center pt-4"
      >
        <UPagination
          v-model:page="historyPage"
          :total="vacationHistory.length"
          :items-per-page="historyPageSize"
        />
      </div>
    </UCard>

    <UModal
      v-model:open="isRequestModalOpen"
      title="Novo pedido de ausência"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Tipo">
            <USelectMenu
              v-model="newRequest.type"
              value-key="value"
              :items="ABSENCE_TYPE_OPTIONS"
              class="w-full"
            />
          </UFormField>
          <p
            v-if="newRequest.type === 'ferias' && currentUser"
            class="text-xs text-muted -mt-2"
          >
            Saldo disponível: {{ balanceFor(employeeById(currentUser.id)!).remaining }} dias
            ({{ balanceFor(employeeById(currentUser.id)!).allocated }} atribuídos ·
            {{ balanceFor(employeeById(currentUser.id)!).used }} usados ·
            {{ balanceFor(employeeById(currentUser.id)!).pending }} pendentes)
          </p>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Início">
              <UInput
                v-model="newRequest.startDate"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Fim">
              <UInput
                v-model="newRequest.endDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Notas">
            <UInput
              v-model="newRequest.notes"
              placeholder="Opcional"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton
          label="Submeter pedido"
          block
          @click="submitRequest"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="isEditModalOpen"
      title="Editar pedido de ausência"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <p
            v-if="editingVacation?.status === 'aprovado'"
            class="text-xs text-warning -mt-1"
          >
            Este pedido já está aprovado. Ao guardar, volta a ficar pendente de aprovação.
          </p>
          <UFormField label="Tipo">
            <USelectMenu
              v-model="editRequest.type"
              value-key="value"
              :items="ABSENCE_TYPE_OPTIONS"
              class="w-full"
            />
          </UFormField>
          <p
            v-if="editRequest.type === 'ferias' && editingVacation"
            class="text-xs text-muted -mt-2"
          >
            Saldo disponível: {{ balanceFor(employeeById(editingVacation.employeeId)!).remaining }} dias
            ({{ balanceFor(employeeById(editingVacation.employeeId)!).allocated }} atribuídos ·
            {{ balanceFor(employeeById(editingVacation.employeeId)!).used }} usados ·
            {{ balanceFor(employeeById(editingVacation.employeeId)!).pending }} pendentes)
          </p>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Início">
              <UInput
                v-model="editRequest.startDate"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Fim">
              <UInput
                v-model="editRequest.endDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Notas">
            <UInput
              v-model="editRequest.notes"
              placeholder="Opcional"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton
          label="Guardar alterações"
          block
          @click="submitEdit"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="isDayModalOpen"
      :title="selectedDay ? formatLong(selectedDay.date) : ''"
    >
      <template #body>
        <ul class="flex flex-col gap-3">
          <li
            v-for="entry in selectedDayEmployees"
            :key="entry.employee.id"
            class="flex items-center gap-2.5"
          >
            <PersonAvatar
              :name="entry.employee.name"
              :color="entry.employee.color"
              :photo-url="entry.employee.photoUrl"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ entry.employee.name }}
              </p>
              <p
                v-if="entry.vacation"
                class="text-xs text-muted"
              >
                {{ formatDayMonth(parseISODate(entry.vacation.startDate)) }} — {{ formatDayMonth(parseISODate(entry.vacation.endDate)) }}
              </p>
            </div>
            <UBadge
              v-if="entry.vacation"
              :color="ABSENCE_TYPE_COLORS[entry.vacation.type]"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              {{ ABSENCE_TYPE_LABELS[entry.vacation.type] }}
            </UBadge>
          </li>
        </ul>
      </template>
    </UModal>
  </div>
</template>
