<script setup lang="ts">
import { MANAGER_ROLES } from '~/types'

const { storeSalesFor, monthlyTargetFor, setMonthlyTarget, weeklyTargetFor, setWeeklyTarget } = useAppData()
const { currentStore, currentUser } = useSession()

const canEdit = computed(() => Boolean(currentUser.value && MANAGER_ROLES.includes(currentUser.value.role)))

const monthAnchor = ref(startOfMonth(new Date()))
const monthLabel = computed(() => formatMonthYear(monthAnchor.value))
const monthKey = computed(() => toISODate(monthAnchor.value).slice(0, 7))

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

const monthlyTarget = computed(() => currentStore.value ? monthlyTargetFor(currentStore.value.id, monthKey.value)?.target ?? 0 : 0)

const draftMonthlyTarget = ref('')
watch([monthlyTarget, () => currentStore.value?.id], () => {
  draftMonthlyTarget.value = monthlyTarget.value > 0 ? String(monthlyTarget.value) : ''
}, { immediate: true })

function commitMonthlyTarget() {
  if (!currentStore.value) return
  setMonthlyTarget(currentStore.value.id, monthKey.value, Number(draftMonthlyTarget.value) || 0)
}

function weeklyTarget(weekStart: Date) {
  return currentStore.value ? weeklyTargetFor(currentStore.value.id, toISODate(weekStart))?.target ?? 0 : 0
}

const weeklyDrafts = reactive<Record<string, string>>({})

watch([weeksInMonth, () => currentStore.value?.id], () => {
  for (const week of weeksInMonth.value) {
    const key = toISODate(week)
    const value = weeklyTarget(week)
    weeklyDrafts[key] = value > 0 ? String(value) : ''
  }
}, { immediate: true })

function commitWeeklyTarget(weekStart: Date) {
  if (!currentStore.value) return
  const key = toISODate(weekStart)
  setWeeklyTarget(currentStore.value.id, key, Number(weeklyDrafts[key]) || 0)
}

const distributedTotal = computed(() => weeksInMonth.value.reduce((sum, week) => sum + weeklyTarget(week), 0))

function distributeEvenly() {
  if (!currentStore.value || weeksInMonth.value.length === 0) return
  const share = Math.round((monthlyTarget.value / weeksInMonth.value.length) * 100) / 100
  for (const week of weeksInMonth.value) {
    const key = toISODate(week)
    setWeeklyTarget(currentStore.value.id, key, share)
    weeklyDrafts[key] = share > 0 ? String(share) : ''
  }
}

function weekAchieved(weekStart: Date) {
  if (!currentStore.value) return 0
  let total = 0
  for (let i = 0; i < 7; i++) {
    total += storeSalesFor(currentStore.value.id, toISODate(addDays(weekStart, i)))?.achieved ?? 0
  }
  return total
}

function weekLabel(weekStart: Date) {
  return `${formatDayMonth(weekStart)} — ${formatDayMonth(addDays(weekStart, 6))}`
}

const monthAchieved = computed(() => {
  if (!currentStore.value) return 0
  const first = monthAnchor.value
  const total = daysInMonth(first)
  let sum = 0
  for (let d = 1; d <= total; d++) {
    sum += storeSalesFor(currentStore.value.id, toISODate(new Date(first.getFullYear(), first.getMonth(), d)))?.achieved ?? 0
  }
  return sum
})

const monthPct = computed(() => monthlyTarget.value > 0 ? (monthAchieved.value / monthlyTarget.value) * 100 : 0)

const distributionColor = computed(() => {
  if (monthlyTarget.value <= 0) return 'neutral'
  return Math.abs(distributedTotal.value - monthlyTarget.value) < 1 ? 'success' : 'warning'
})

const monthPctColor = computed(() => {
  if (monthlyTarget.value <= 0) return 'neutral'
  if (monthPct.value >= 100) return 'success'
  if (monthPct.value >= 80) return 'warning'
  return 'error'
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Objetivos
        </h1>
        <p class="text-muted mt-1">
          Objetivo mensal e distribuição por semana · {{ currentStore?.name }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
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
      </div>
    </div>

    <div
      v-if="!canEdit"
      class="text-sm text-muted py-12 text-center"
    >
      Esta página é apenas para gestão da loja.
    </div>

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2.5">
            <SectionIcon
              icon="i-lucide-target"
              color="primary"
              size="sm"
            />
            <h2 class="font-semibold text-highlighted">
              Objetivo mensal
            </h2>
          </div>
        </template>

        <div class="flex flex-col sm:flex-row sm:items-center gap-6">
          <RadialProgress
            :value="monthPct"
            :color="monthPctColor"
            size="lg"
            :label="formatPercent(monthPct)"
            caption="do objetivo"
          />

          <div class="flex flex-col sm:flex-row sm:items-end gap-6 flex-1">
            <UFormField
              label="Objetivo do mês (€)"
              class="max-w-56"
            >
              <UInput
                v-model="draftMonthlyTarget"
                type="number"
                step="0.01"
                @change="commitMonthlyTarget"
              />
            </UFormField>

            <div class="flex gap-6">
              <div>
                <p class="text-xs text-muted">
                  Apurado no mês
                </p>
                <p class="text-lg font-bold text-highlighted">
                  {{ formatCurrency(monthAchieved) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <SectionIcon
                icon="i-lucide-calendar-range"
                color="info"
                size="sm"
              />
              <h2 class="font-semibold text-highlighted">
                Distribuição por semana
              </h2>
            </div>
            <UButton
              label="Distribuir igualmente"
              icon="i-lucide-scale"
              size="xs"
              color="neutral"
              variant="subtle"
              @click="distributeEvenly"
            />
          </div>
        </template>

        <ul class="divide-y divide-default">
          <li
            v-for="week in weeksInMonth"
            :key="toISODate(week)"
            class="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted">
                {{ weekLabel(week) }}
              </p>
              <p class="text-xs text-muted">
                Semana {{ isoWeekNumber(week) }} · apurado {{ formatCurrency(weekAchieved(week)) }}
                <span v-if="weeklyTarget(week) > 0"> · {{ formatPercent((weekAchieved(week) / weeklyTarget(week)) * 100) }}</span>
              </p>
            </div>
            <UInput
              v-model="weeklyDrafts[toISODate(week)]"
              type="number"
              step="0.01"
              size="sm"
              class="w-36"
              placeholder="Objetivo (€)"
              @change="commitWeeklyTarget(week)"
            />
          </li>
        </ul>

        <template #footer>
          <div class="flex items-center justify-between">
            <p class="text-sm text-muted">
              Distribuído pelas semanas
            </p>
            <UBadge
              :color="distributionColor"
              variant="subtle"
            >
              {{ formatCurrency(distributedTotal) }} / {{ formatCurrency(monthlyTarget) }}
            </UBadge>
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
