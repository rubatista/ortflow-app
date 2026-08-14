<script setup lang="ts">
const { accessibleStores, isRegional, currentUser, selectStore } = useSession()
const { employeesByStore, shiftFor, vacations, storeSalesFor, weeklyTargetFor } = useAppData()

onMounted(() => {
  if (!isRegional.value) navigateTo('/')
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

const todayISO = toISODate(new Date())

function storeStats(storeId: string) {
  const staff = employeesByStore(storeId)
  const ids = new Set(staff.map(e => e.id))

  const achieved = weekDays.value.reduce((sum, day) => sum + (storeSalesFor(storeId, toISODate(day))?.achieved ?? 0), 0)
  const target = weeklyTargetFor(storeId, toISODate(weekAnchor.value))?.target ?? 0

  const onShiftToday = staff.filter((e) => {
    const shift = shiftFor(e.id, todayISO)
    return shift?.startTime && shift?.endTime
  }).length

  const pendingVacations = vacations.value.filter(v => v.status === 'pendente' && ids.has(v.employeeId)).length

  return {
    staffCount: staff.length,
    achieved,
    target,
    pct: target > 0 ? (achieved / target) * 100 : 0,
    onShiftToday,
    pendingVacations
  }
}

const regionStats = computed(() => {
  return accessibleStores.value.reduce((acc, store) => {
    const stats = storeStats(store.id)
    acc.staffCount += stats.staffCount
    acc.onShiftToday += stats.onShiftToday
    acc.pendingVacations += stats.pendingVacations
    return acc
  }, { staffCount: 0, onShiftToday: 0, pendingVacations: 0 })
})

function enterStore(storeId: string) {
  selectStore(storeId)
  navigateTo('/')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Painel regional
        </h1>
        <p class="text-muted mt-1">
          Olá {{ currentUser?.name }} · comparação das {{ accessibleStores.length }} lojas que geres
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
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <SectionIcon
            icon="i-lucide-users"
            color="primary"
          />
          <div class="min-w-0">
            <p class="text-2xl font-bold text-highlighted leading-none">
              {{ regionStats.staffCount }}
            </p>
            <p class="text-sm text-muted mt-1 break-words">
              Colaboradores
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <SectionIcon
            icon="i-lucide-calendar-clock"
            color="info"
          />
          <div class="min-w-0">
            <p class="text-2xl font-bold text-highlighted leading-none">
              {{ regionStats.onShiftToday }}
            </p>
            <p class="text-sm text-muted mt-1 break-words">
              Em turno hoje
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <SectionIcon
            icon="i-lucide-clock"
            color="warning"
          />
          <div class="min-w-0">
            <p class="text-2xl font-bold text-highlighted leading-none">
              {{ regionStats.pendingVacations }}
            </p>
            <p class="text-sm text-muted mt-1 break-words">
              Férias pendentes
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-building-2"
            color="secondary"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Lojas
          </h2>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th class="text-left font-medium text-muted pb-2 pr-4">
                Loja
              </th>
              <th class="text-center font-medium text-muted pb-2 px-2">
                Vendas da semana
              </th>
              <th class="text-center font-medium text-muted pb-2 px-2">
                Em turno hoje
              </th>
              <th class="text-center font-medium text-muted pb-2 px-2">
                Férias pendentes
              </th>
              <th class="pb-2" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="store in accessibleStores"
              :key="store.id"
              class="cursor-pointer hover:bg-elevated/60"
              @click="enterStore(store.id)"
            >
              <td class="py-3 pr-4 border-b border-default">
                <p class="font-medium text-highlighted">
                  {{ store.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ store.location }}
                </p>
              </td>
              <td class="py-3 px-2 text-center border-b border-default">
                <UBadge
                  :color="storeStats(store.id).target <= 0 ? 'neutral' : storeStats(store.id).pct >= 100 ? 'success' : storeStats(store.id).pct >= 80 ? 'warning' : 'error'"
                  variant="subtle"
                >
                  {{ formatCurrency(storeStats(store.id).achieved) }} / {{ formatCurrency(storeStats(store.id).target) }}
                  <span v-if="storeStats(store.id).target > 0"> · {{ formatPercent(storeStats(store.id).pct) }}</span>
                </UBadge>
              </td>
              <td class="py-3 px-2 text-center border-b border-default">
                {{ storeStats(store.id).onShiftToday }} / {{ storeStats(store.id).staffCount }}
              </td>
              <td class="py-3 px-2 text-center border-b border-default">
                <UBadge
                  :color="storeStats(store.id).pendingVacations > 0 ? 'warning' : 'neutral'"
                  variant="subtle"
                >
                  {{ storeStats(store.id).pendingVacations }}
                </UBadge>
              </td>
              <td class="py-3 pl-2 text-right border-b border-default">
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4 text-muted"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
