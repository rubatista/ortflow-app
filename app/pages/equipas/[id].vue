<script setup lang="ts">
import { COLOR_HEX, MAX_PHOTO_SIZE_BYTES, ROLE_COLORS, ROLE_LABELS, VACATION_STATUS_COLORS } from '~/types'

const route = useRoute()
const employeeId = computed(() => String(route.params.id))

const { employeeById, storeById, shiftFor, vacations, employeeSalesFor, vacationDaysUsed, vacationDaysPending, setEmployeePhoto } = useAppData()
const { currentStore, currentUser } = useSession()
const toast = useToast()

const employee = computed(() => employeeById(employeeId.value))

onMounted(() => {
  const isOwnProfile = employee.value?.id === currentUser.value?.id
  if (!employee.value || (!isOwnProfile && employee.value.storeId !== currentStore.value?.id)) {
    navigateTo('/equipas')
  }
})

const isSeller = computed(() => employee.value?.role === 'vendedor')

const initials = computed(() => {
  if (!employee.value) return ''
  return employee.value.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
})

const heroColor = computed(() => COLOR_HEX[employee.value?.color ?? 'blue'])

const photoInput = ref<HTMLInputElement | null>(null)

function triggerPhotoUpload() {
  photoInput.value?.click()
}

function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.add({ title: 'Ficheiro inválido', description: 'Escolhe uma imagem.', color: 'error' })
    return
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    toast.add({ title: 'Imagem demasiado grande', description: 'O tamanho máximo é 2 MB.', color: 'error' })
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    setEmployeePhoto(employeeId.value, String(reader.result))
  }
  reader.readAsDataURL(file)
}

function removePhoto() {
  setEmployeePhoto(employeeId.value, null)
}

const currentWeekStart = startOfWeek(new Date())
const currentWeekDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)))

function isOnVacation(day: Date) {
  const iso = toISODate(day)
  return vacations.value.some(v => v.employeeId === employeeId.value && v.status === 'aprovado' && isDateInRange(iso, v.startDate, v.endDate))
}

function shiftEntryFor(day: Date) {
  return shiftFor(employeeId.value, toISODate(day))
}

const weeklyWorkedHours = computed(() => {
  return currentWeekDays.value.reduce((total, day) => {
    if (isOnVacation(day)) return total
    return total + shiftWorkedHours(shiftEntryFor(day))
  }, 0)
})

const currentYear = new Date().getFullYear()

const vacationBalance = computed(() => {
  if (!employee.value) return { allocated: 0, used: 0, pending: 0, remaining: 0 }
  const used = vacationDaysUsed(employeeId.value, currentYear)
  const pending = vacationDaysPending(employeeId.value, currentYear)
  return { allocated: employee.value.vacationDaysPerYear, used, pending, remaining: employee.value.vacationDaysPerYear - used - pending }
})

function weekSalesTotals(weekStart: Date) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return days.reduce((acc, day) => {
    const entry = employeeSalesFor(employeeId.value, toISODate(day))
    acc.sales += entry?.salesValue ?? 0
    acc.units += entry?.units ?? 0
    acc.clients += entry?.clientsServed ?? 0
    acc.target += entry?.target ?? 0
    return acc
  }, { sales: 0, units: 0, clients: 0, target: 0 })
}

const thisWeekSales = computed(() => weekSalesTotals(currentWeekStart))
const weeklyTargetPct = computed(() => thisWeekSales.value.target > 0 ? (thisWeekSales.value.sales / thisWeekSales.value.target) * 100 : 0)

const recentWeeks = computed(() => {
  return Array.from({ length: 6 }, (_, i) => {
    const weekStart = addDays(currentWeekStart, -7 * (5 - i))
    const totals = weekSalesTotals(weekStart)
    return { weekStart, ...totals }
  })
})

const hasSalesHistory = computed(() => recentWeeks.value.some(w => w.sales > 0))
const maxWeekSales = computed(() => Math.max(1, ...recentWeeks.value.map(w => w.sales)))

const monthAchieved = computed(() => {
  const monthStart = startOfMonth(new Date())
  const total = daysInMonth(monthStart)
  let sum = 0
  for (let d = 1; d <= total; d++) {
    sum += employeeSalesFor(employeeId.value, toISODate(new Date(monthStart.getFullYear(), monthStart.getMonth(), d)))?.salesValue ?? 0
  }
  return sum
})

const employeeVacations = computed(() => {
  return vacations.value
    .filter(v => v.employeeId === employeeId.value)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
})
</script>

<template>
  <div
    v-if="employee"
    class="flex flex-col gap-6"
  >
    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="sm"
        to="/equipas"
      />
      <p class="text-sm text-muted">
        Equipa / {{ employee.name }}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
      <div class="flex flex-col gap-6">
        <UCard>
          <div class="flex flex-col items-center text-center gap-4">
            <div class="relative group">
              <img
                v-if="employee.photoUrl"
                :src="employee.photoUrl"
                :alt="employee.name"
                class="size-28 rounded-full object-cover ring-4 ring-default"
              >
              <div
                v-else
                class="size-28 rounded-full flex items-center justify-center text-3xl font-bold text-white ring-4 ring-default"
                :style="{ backgroundColor: heroColor }"
              >
                {{ initials }}
              </div>
              <button
                type="button"
                class="absolute bottom-0 right-0 flex items-center justify-center size-9 rounded-full bg-primary text-inverted shadow-sm ring-2 ring-default cursor-pointer hover:brightness-95"
                aria-label="Carregar foto de perfil"
                @click="triggerPhotoUpload"
              >
                <UIcon
                  name="i-lucide-camera"
                  class="size-4"
                />
              </button>
              <input
                ref="photoInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onPhotoSelected"
              >
            </div>
            <UButton
              v-if="employee.photoUrl"
              label="Remover foto"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="link"
              size="xs"
              @click="removePhoto"
            />
          </div>
          <div class="pt-4 flex flex-col gap-4">
            <div class="text-center">
              <h1 class="text-xl font-bold text-highlighted">
                {{ employee.name }}
              </h1>
              <p class="text-sm text-muted">
                {{ ROLE_LABELS[employee.role] }}
              </p>
              <div class="flex items-center justify-center gap-2 mt-2">
                <UBadge
                  :color="ROLE_COLORS[employee.role]"
                  variant="subtle"
                >
                  {{ ROLE_LABELS[employee.role] }}
                </UBadge>
              </div>
            </div>

            <div class="flex flex-col divide-y divide-default border-t border-default text-sm">
              <div class="flex items-center justify-between py-2.5">
                <span class="text-muted">Loja</span>
                <span class="text-highlighted font-medium">{{ employee.storeId ? storeById(employee.storeId)?.name : 'Gerência regional' }}</span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="text-muted">Carga horária</span>
                <span class="text-highlighted font-medium">{{ employee.weeklyHours }}h/semana</span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="text-muted">Férias anuais</span>
                <span class="text-highlighted font-medium">{{ employee.vacationDaysPerYear }} dias</span>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Contacto
            </h2>
          </template>
          <div class="flex items-center gap-2.5 text-sm">
            <SectionIcon
              icon="i-lucide-mail"
              color="neutral"
              size="sm"
            />
            <span class="text-highlighted">{{ employee.email }}</span>
          </div>
        </UCard>
      </div>

      <div class="flex flex-col gap-6">
        <div
          class="grid gap-4"
          :class="isSeller ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'"
        >
          <UCard>
            <div class="flex flex-col items-center gap-2 py-2">
              <RadialProgress
                :value="weeklyWorkedHours"
                :max="employee.weeklyHours"
                color="primary"
                size="md"
                :label="`${weeklyWorkedHours}h`"
                caption="Horas esta semana"
              />
            </div>
          </UCard>
          <UCard>
            <div class="flex flex-col items-center gap-2 py-2">
              <RadialProgress
                :value="Math.max(0, vacationBalance.remaining)"
                :max="vacationBalance.allocated || 1"
                :color="vacationBalance.remaining >= 0 ? 'success' : 'error'"
                size="md"
                :label="`${vacationBalance.remaining}`"
                caption="Dias de férias"
              />
            </div>
          </UCard>
          <UCard v-if="isSeller">
            <div class="flex flex-col items-center gap-2 py-2">
              <RadialProgress
                :value="weeklyTargetPct"
                color="warning"
                size="md"
                :label="formatPercent(weeklyTargetPct)"
                caption="Objetivo da semana"
              />
            </div>
          </UCard>
        </div>

        <UCard v-if="isSeller">
          <template #header>
            <div class="flex items-center gap-2.5">
              <SectionIcon
                icon="i-lucide-trending-up"
                color="success"
                size="sm"
              />
              <h2 class="font-semibold text-highlighted">
                Desempenho de vendas
              </h2>
            </div>
          </template>

          <div class="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p class="text-xs text-muted">
                Vendas este mês
              </p>
              <p class="text-xl font-bold text-highlighted">
                {{ formatCurrency(monthAchieved) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted">
                Vendas esta semana
              </p>
              <p class="text-xl font-bold text-highlighted">
                {{ formatCurrency(thisWeekSales.sales) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted">
                Valor por cliente
              </p>
              <p class="text-xl font-bold text-highlighted">
                {{ formatCurrency(thisWeekSales.clients > 0 ? thisWeekSales.sales / thisWeekSales.clients : 0) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted mb-2">
            Últimas 6 semanas
          </p>
          <div
            v-if="!hasSalesHistory"
            class="h-32 flex items-center justify-center text-sm text-muted border border-dashed border-default rounded-lg"
          >
            Sem vendas registadas ainda.
          </div>
          <div
            v-else
            class="flex gap-3 h-32"
          >
            <div
              v-for="week in recentWeeks"
              :key="toISODate(week.weekStart)"
              class="flex-1 flex flex-col items-center gap-1.5"
              :title="`Semana de ${formatDayMonth(week.weekStart)}: ${formatCurrency(week.sales)}`"
            >
              <div class="w-full flex-1 flex items-end">
                <div
                  class="w-full rounded-t-md bg-success/70"
                  :style="{ height: `${Math.max(4, (week.sales / maxWeekSales) * 100)}%` }"
                />
              </div>
              <span class="text-[10px] text-muted">{{ formatDayMonth(week.weekStart) }}</span>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2.5">
              <SectionIcon
                icon="i-lucide-calendar-clock"
                color="info"
                size="sm"
              />
              <h2 class="font-semibold text-highlighted">
                Horário desta semana
              </h2>
            </div>
          </template>

          <ul class="divide-y divide-default">
            <li
              v-for="day in currentWeekDays"
              :key="day.toISOString()"
              class="flex items-center justify-between py-2"
            >
              <p class="text-sm text-highlighted capitalize">
                {{ formatWeekday(day) }} · {{ formatDayMonth(day) }}
              </p>
              <UBadge
                v-if="isOnVacation(day)"
                color="success"
                variant="subtle"
              >
                Férias
              </UBadge>
              <UBadge
                v-else
                :color="shiftEntryFor(day)?.startTime ? 'primary' : 'neutral'"
                variant="subtle"
              >
                {{ shiftLabel(shiftEntryFor(day)) }}
              </UBadge>
            </li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2.5">
              <SectionIcon
                icon="i-lucide-tree-palm"
                color="secondary"
                size="sm"
              />
              <h2 class="font-semibold text-highlighted">
                Histórico de férias
              </h2>
            </div>
          </template>

          <div
            v-if="employeeVacations.length === 0"
            class="text-sm text-muted py-4 text-center"
          >
            Sem pedidos de férias registados.
          </div>
          <ul
            v-else
            class="divide-y divide-default"
          >
            <li
              v-for="vacation in employeeVacations"
              :key="vacation.id"
              class="flex items-center justify-between py-2.5"
            >
              <p class="text-sm text-highlighted">
                {{ formatDayMonth(parseISODate(vacation.startDate)) }} — {{ formatDayMonth(parseISODate(vacation.endDate)) }}
              </p>
              <UBadge
                :color="VACATION_STATUS_COLORS[vacation.status]"
                variant="subtle"
              >
                {{ vacation.status }}
              </UBadge>
            </li>
          </ul>
        </UCard>
      </div>
    </div>
  </div>
</template>
