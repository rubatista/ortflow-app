<script setup lang="ts">
import { MANAGER_ROLES, PODIUM_COLORS } from '~/types'

const { employeesByStore, employeeSalesFor, setEmployeeSales, storeSalesFor, setStoreSales, shiftFor, vacations } = useAppData()
const { currentStore, currentUser } = useSession()

const canEdit = computed(() => Boolean(currentUser.value && MANAGER_ROLES.includes(currentUser.value.role)))

/** Só vendedores vendem e têm resultados individuais — arrumação, provador e gerência ficam fora destes cálculos. */
const sellers = computed(() => {
  if (!currentStore.value) return []
  return employeesByStore(currentStore.value.id)
    .filter(e => e.role === 'vendedor')
    .sort((a, b) => a.name.localeCompare(b.name))
})

const weekAnchor = ref(startOfWeek(new Date()))
const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor.value, i)))
const weekLabel = computed(() => `${formatDayMonth(weekDays.value[0]!)} — ${formatDayMonth(weekDays.value[6]!)}`)

function goToPreviousWeek() {
  weekAnchor.value = addDays(weekAnchor.value, -7)
}

function goToNextWeek() {
  weekAnchor.value = addDays(weekAnchor.value, 7)
}

function goToCurrentWeek() {
  weekAnchor.value = startOfWeek(new Date())
}

function employeeEntryFor(employeeId: string, day: Date) {
  return employeeSalesFor(employeeId, toISODate(day))
}

function commitEmployeeSales(employeeId: string, day: Date, salesValue: number, units: number, clientsServed: number, target: number) {
  setEmployeeSales(employeeId, toISODate(day), { salesValue, units, clientsServed, target })
}

function storeEntryFor(day: Date) {
  return currentStore.value ? storeSalesFor(currentStore.value.id, toISODate(day)) : undefined
}

function isOnVacation(employeeId: string, day: Date) {
  const iso = toISODate(day)
  return vacations.value.some(v => v.employeeId === employeeId && v.status === 'aprovado' && isDateInRange(iso, v.startDate, v.endDate))
}

function isDayOff(employeeId: string, day: Date) {
  const entry = shiftFor(employeeId, toISODate(day))
  return !entry?.startTime || !entry?.endTime
}

/** Sem objetivo em dias de férias ou folga — não trabalham, não vendem. */
function isOffThatDay(employeeId: string, day: Date) {
  return isOnVacation(employeeId, day) || isDayOff(employeeId, day)
}

function sellerWorkedHours(employeeId: string, day: Date) {
  if (isOffThatDay(employeeId, day)) return 0
  return shiftWorkedHours(shiftFor(employeeId, toISODate(day)))
}

/** Horas trabalhadas por todos os vendedores nesse dia — base para repartir o objetivo da loja. */
function totalSellerHours(day: Date) {
  return sellers.value.reduce((sum, seller) => sum + sellerWorkedHours(seller.id, day), 0)
}

/** Sugestão de objetivo diário (fatia do objetivo da loja proporcional às horas trabalhadas), usada só para pré-preencher o campo ao atribuir manualmente. */
function suggestedTarget(employeeId: string, day: Date) {
  const dayTarget = storeEntryFor(day)?.target ?? 0
  const totalHours = totalSellerHours(day)
  if (totalHours <= 0) return 0
  return dayTarget * (sellerWorkedHours(employeeId, day) / totalHours)
}

function weeklyTotals(employeeId: string) {
  return weekDays.value.reduce((acc, day) => {
    const entry = employeeEntryFor(employeeId, day)
    acc.sales += entry?.salesValue ?? 0
    acc.units += entry?.units ?? 0
    acc.clients += entry?.clientsServed ?? 0
    acc.target += entry?.target ?? 0
    return acc
  }, { sales: 0, units: 0, clients: 0, target: 0 })
}

const leaderboard = computed(() => {
  return sellers.value.map((employee) => {
    const totals = weeklyTotals(employee.id)
    return {
      employee,
      sales: totals.sales,
      units: totals.units,
      clients: totals.clients,
      target: totals.target,
      achievedPct: totals.target > 0 ? (totals.sales / totals.target) * 100 : 0,
      valuePerClient: totals.clients > 0 ? totals.sales / totals.clients : 0
    }
  })
})

const salesPodium = computed(() => {
  return [...leaderboard.value].filter(e => e.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 3)
})

const valuePodium = computed(() => {
  return [...leaderboard.value].filter(e => e.clients > 0).sort((a, b) => b.valuePerClient - a.valuePerClient).slice(0, 3)
})

function commitStoreSales(day: Date, data: { target: number, achieved: number, totalClients: number, totalReceipts: number, returns: number, units: number }) {
  if (currentStore.value) setStoreSales(currentStore.value.id, toISODate(day), data)
}

const weeklyStoreTotals = computed(() => {
  return weekDays.value.reduce((acc, day) => {
    const entry = storeEntryFor(day)
    acc.target += entry?.target ?? 0
    acc.achieved += entry?.achieved ?? 0
    return acc
  }, { target: 0, achieved: 0 })
})

const weeklyAchievedPct = computed(() => {
  if (!weeklyStoreTotals.value.target) return 0
  return (weeklyStoreTotals.value.achieved / weeklyStoreTotals.value.target) * 100
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Vendas
        </h1>
        <p class="text-muted mt-1">
          Resultados diários e pódios da semana · {{ currentStore?.name }}
        </p>
        <p class="text-xs text-muted mt-1">
          Apenas vendedores têm resultados individuais.
        </p>
      </div>
      <div class="flex items-center gap-2">
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
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2.5">
            <SectionIcon
              icon="i-lucide-trophy"
              color="warning"
              size="sm"
            />
            <h2 class="font-semibold text-highlighted">
              Maior valor de vendas
            </h2>
          </div>
        </template>
        <div
          v-if="salesPodium.length === 0"
          class="text-sm text-muted py-4 text-center"
        >
          Sem vendas registadas esta semana.
        </div>
        <ul
          v-else
          class="flex flex-col gap-3"
        >
          <li
            v-for="(entry, index) in salesPodium"
            :key="entry.employee.id"
            class="flex items-center gap-3"
          >
            <span
              class="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              :style="{ backgroundColor: PODIUM_COLORS[index] }"
            >
              {{ index + 1 }}º
            </span>
            <PersonAvatar
              :name="entry.employee.name"
              :color="entry.employee.color"
              :photo-url="entry.employee.photoUrl"
              size="sm"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ entry.employee.name }}
              </p>
              <p class="text-xs text-muted">
                {{ entry.units }} unidades<span v-if="entry.target > 0"> · {{ formatPercent(entry.achievedPct) }} do objetivo</span>
              </p>
            </div>
            <p class="text-sm font-semibold text-highlighted shrink-0">
              {{ formatCurrency(entry.sales) }}
            </p>
          </li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2.5">
            <SectionIcon
              icon="i-lucide-hand-coins"
              color="success"
              size="sm"
            />
            <h2 class="font-semibold text-highlighted">
              Maior valor por cliente
            </h2>
          </div>
        </template>
        <div
          v-if="valuePodium.length === 0"
          class="text-sm text-muted py-4 text-center"
        >
          Sem clientes registados esta semana.
        </div>
        <ul
          v-else
          class="flex flex-col gap-3"
        >
          <li
            v-for="(entry, index) in valuePodium"
            :key="entry.employee.id"
            class="flex items-center gap-3"
          >
            <span
              class="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              :style="{ backgroundColor: PODIUM_COLORS[index] }"
            >
              {{ index + 1 }}º
            </span>
            <PersonAvatar
              :name="entry.employee.name"
              :color="entry.employee.color"
              :photo-url="entry.employee.photoUrl"
              size="sm"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ entry.employee.name }}
              </p>
              <p class="text-xs text-muted">
                {{ entry.clients }} clientes
              </p>
            </div>
            <p class="text-sm font-semibold text-highlighted shrink-0">
              {{ formatCurrency(entry.valuePerClient) }}
            </p>
          </li>
        </ul>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <SectionIcon
              icon="i-lucide-target"
              color="primary"
              size="sm"
            />
            <h2 class="font-semibold text-highlighted">
              Objectivo da loja
            </h2>
          </div>
          <UBadge
            :color="weeklyAchievedPct >= 100 ? 'success' : weeklyAchievedPct >= 80 ? 'warning' : 'error'"
            variant="subtle"
          >
            {{ formatCurrency(weeklyStoreTotals.achieved) }} / {{ formatCurrency(weeklyStoreTotals.target) }} · {{ formatPercent(weeklyAchievedPct) }}
          </UBadge>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="text-center font-medium pb-2 px-1 min-w-24"
                :class="isToday(day) ? 'text-primary' : 'text-muted'"
              >
                <div class="capitalize">
                  {{ formatWeekday(day) }}
                </div>
                <div class="text-xs font-normal">
                  {{ formatDayMonth(day) }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="px-1 py-2 text-center align-middle"
                :class="isToday(day) ? 'bg-primary/5' : ''"
              >
                <StoreSalesCell
                  :target="storeEntryFor(day)?.target ?? null"
                  :achieved="storeEntryFor(day)?.achieved ?? null"
                  :total-clients="storeEntryFor(day)?.totalClients ?? null"
                  :total-receipts="storeEntryFor(day)?.totalReceipts ?? null"
                  :returns="storeEntryFor(day)?.returns ?? null"
                  :units="storeEntryFor(day)?.units ?? null"
                  :editable="canEdit"
                  @commit="(data) => commitStoreSales(day, data)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-users"
            color="secondary"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Resultados por colaborador
          </h2>
        </div>
      </template>

      <div
        v-if="sellers.length === 0"
        class="text-sm text-muted py-4 text-center"
      >
        Sem vendedores nesta loja.
      </div>

      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th class="text-left font-medium text-muted pr-4 pb-2 min-w-40">
                Colaborador
              </th>
              <th
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="text-center font-medium pb-2 px-1 min-w-24"
                :class="isToday(day) ? 'text-primary' : 'text-muted'"
              >
                <div class="capitalize">
                  {{ formatWeekday(day) }}
                </div>
                <div class="text-xs font-normal">
                  {{ formatDayMonth(day) }}
                </div>
              </th>
              <th class="text-center font-medium text-muted pb-2 px-2 min-w-28">
                Total
              </th>
              <th class="text-center font-medium text-muted pb-2 px-2 min-w-24">
                €/cliente
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="employee in sellers"
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
                  <p class="font-medium text-highlighted truncate">
                    {{ employee.name }}
                  </p>
                </div>
              </td>
              <td
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="px-1 py-2 text-center align-middle"
                :class="isToday(day) ? 'bg-primary/5' : ''"
              >
                <UBadge
                  v-if="isOnVacation(employee.id, day)"
                  color="success"
                  variant="subtle"
                  class="w-full justify-center"
                >
                  Férias
                </UBadge>
                <UBadge
                  v-else-if="isDayOff(employee.id, day)"
                  color="neutral"
                  variant="subtle"
                  class="w-full justify-center"
                >
                  Folga
                </UBadge>
                <SalesCell
                  v-else
                  :sales-value="employeeEntryFor(employee.id, day)?.salesValue ?? null"
                  :units="employeeEntryFor(employee.id, day)?.units ?? null"
                  :clients-served="employeeEntryFor(employee.id, day)?.clientsServed ?? null"
                  :target="employeeEntryFor(employee.id, day)?.target ?? null"
                  :suggested-target="suggestedTarget(employee.id, day)"
                  :editable="canEdit"
                  @commit="(sales, units, clients, target) => commitEmployeeSales(employee.id, day, sales, units, clients, target)"
                />
              </td>
              <td class="px-2 py-2 text-center align-middle">
                <UBadge
                  :color="weeklyTotals(employee.id).target <= 0 ? 'neutral' : weeklyTotals(employee.id).sales >= weeklyTotals(employee.id).target ? 'success' : weeklyTotals(employee.id).sales >= weeklyTotals(employee.id).target * 0.8 ? 'warning' : 'error'"
                  variant="subtle"
                >
                  {{ formatCurrency(weeklyTotals(employee.id).sales) }}
                </UBadge>
                <p class="text-xs text-muted mt-1">
                  {{ weeklyTotals(employee.id).units }} un.
                  <span v-if="weeklyTotals(employee.id).target > 0"> · obj. {{ formatCurrency(weeklyTotals(employee.id).target) }}</span>
                </p>
              </td>
              <td class="px-2 py-2 text-center align-middle rounded-r-lg">
                {{ formatCurrency(weeklyTotals(employee.id).clients > 0 ? weeklyTotals(employee.id).sales / weeklyTotals(employee.id).clients : 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
