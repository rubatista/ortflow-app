<script setup lang="ts">
import type { Role } from '~/types'
import { AVATAR_COLORS, DEFAULT_VACATION_DAYS_PER_YEAR, MANAGER_ROLES, ROLE_COLORS, ROLE_LABELS, ROLE_ORDER, WEEKLY_HOURS_OPTIONS } from '~/types'

const { employeesByStore, addEmployee, removeEmployee } = useAppData()
const { currentStore, currentUser } = useSession()
const { confirm: confirmAction } = useConfirm()

const canManage = computed(() => Boolean(currentUser.value && MANAGER_ROLES.includes(currentUser.value.role)))

const roleOptions = ROLE_ORDER
  .filter(role => role !== 'gerente_regional')
  .map(role => ({ label: ROLE_LABELS[role], value: role }))

const weeklyHoursOptions = WEEKLY_HOURS_OPTIONS.map(hours => ({ label: `${hours}h/semana`, value: hours }))

const storeEmployees = computed(() => {
  if (!currentStore.value) return []
  return [...employeesByStore(currentStore.value.id)]
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
})

const isMemberModalOpen = ref(false)
const newMember = reactive({ name: '', email: '', role: 'vendedor' as Exclude<Role, 'gerente_regional'>, weeklyHours: 40, vacationDaysPerYear: DEFAULT_VACATION_DAYS_PER_YEAR })

function openMemberModal() {
  newMember.name = ''
  newMember.email = ''
  newMember.role = 'vendedor'
  newMember.weeklyHours = 40
  newMember.vacationDaysPerYear = DEFAULT_VACATION_DAYS_PER_YEAR
  isMemberModalOpen.value = true
}

function submitMember() {
  if (!newMember.name.trim() || !currentStore.value) return
  addEmployee({
    name: newMember.name.trim(),
    email: newMember.email.trim(),
    role: newMember.role,
    weeklyHours: newMember.weeklyHours,
    vacationDaysPerYear: newMember.vacationDaysPerYear,
    companyId: currentStore.value.companyId,
    storeId: currentStore.value.id,
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!
  })
  isMemberModalOpen.value = false
}

async function confirmRemoveMember(id: string, name: string) {
  if (!canManage.value) return
  const confirmed = await confirmAction({
    title: 'Remover colaborador',
    description: `Tens a certeza que queres remover "${name}" da equipa desta loja? Esta ação não pode ser desfeita.`,
    confirmLabel: 'Remover',
    icon: 'i-lucide-trash-2'
  })
  if (confirmed) removeEmployee(id)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Equipa
        </h1>
        <p class="text-muted mt-1">
          Colaboradores de {{ currentStore?.name }}.
        </p>
      </div>
      <UButton
        label="Novo colaborador"
        icon="i-lucide-user-plus"
        @click="openMemberModal"
      />
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2.5">
          <SectionIcon
            icon="i-lucide-users"
            color="primary"
            size="sm"
          />
          <h2 class="font-semibold text-highlighted">
            Colaboradores
          </h2>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ storeEmployees.length }}
          </UBadge>
        </div>
      </template>

      <ul class="divide-y divide-default">
        <li
          v-for="member in storeEmployees"
          :key="member.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3 cursor-pointer hover:bg-elevated/40 rounded-lg px-2 -mx-2"
          @click="navigateTo(`/team/${member.id}`)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <PersonAvatar
              :name="member.name"
              :color="member.color"
              :photo-url="member.photoUrl"
            />
            <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ member.name }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ member.email }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              :color="ROLE_COLORS[member.role]"
              variant="subtle"
            >
              {{ ROLE_LABELS[member.role] }}
            </UBadge>
            <UBadge
              color="neutral"
              variant="outline"
            >
              {{ member.weeklyHours }}h/semana
            </UBadge>
            <UBadge
              color="neutral"
              variant="outline"
            >
              {{ member.vacationDaysPerYear }} dias férias
            </UBadge>
            <UButton
              v-if="canManage"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.stop="confirmRemoveMember(member.id, member.name)"
            />
          </div>
        </li>
        <li
          v-if="storeEmployees.length === 0"
          class="text-sm text-muted py-4 text-center"
        >
          Sem colaboradores nesta loja.
        </li>
      </ul>
    </UCard>

    <UModal
      v-model:open="isMemberModalOpen"
      title="Novo colaborador"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Nome">
            <UInput
              v-model="newMember.name"
              placeholder="Ex: Maria Sousa"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Email">
            <UInput
              v-model="newMember.email"
              type="email"
              placeholder="maria.sousa@ortflow.pt"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Cargo">
            <USelectMenu
              v-model="newMember.role"
              value-key="value"
              :items="roleOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Carga horária">
            <USelectMenu
              v-model="newMember.weeklyHours"
              value-key="value"
              :items="weeklyHoursOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Dias de férias anuais">
            <UInput
              v-model="newMember.vacationDaysPerYear"
              type="number"
              min="0"
              max="30"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton
          label="Adicionar"
          block
          @click="submitMember"
        />
      </template>
    </UModal>
  </div>
</template>
