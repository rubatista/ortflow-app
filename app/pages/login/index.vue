<script setup lang="ts">
import { ROLE_LABELS } from '~/types'

const { stores, employees, storeById } = useAppData()
const { login } = useSession()

const regionalManagers = computed(() => employees.value.filter(e => e.role === 'gerente_regional'))

function storeStaff(storeId: string) {
  return employees.value.filter(e => e.storeId === storeId)
}

function enterAs(employeeId: string) {
  login(employeeId)
  navigateTo('/')
}
</script>

<template>
  <div class="flex flex-col gap-8 max-w-3xl mx-auto">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-highlighted">
        Entrar
      </h1>
      <p class="text-muted mt-1">
        Protótipo sem autenticação real — escolhe quem és para simular o acesso.
      </p>
    </div>

    <UCard v-if="regionalManagers.length">
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Gestão multi-loja
        </h2>
      </template>
      <ul class="divide-y divide-default">
        <li
          v-for="manager in regionalManagers"
          :key="manager.id"
          class="flex items-center justify-between gap-3 py-2.5"
        >
          <div class="flex items-center gap-2.5">
            <PersonAvatar
              :name="manager.name"
              :color="manager.color"
              :photo-url="manager.photoUrl"
            />
            <div>
              <p class="text-sm font-medium text-highlighted">
                {{ manager.name }}
              </p>
              <p class="text-xs text-muted">
                {{ ROLE_LABELS[manager.role] }} · {{ manager.managedStoreIds?.length ?? 0 }} lojas
              </p>
            </div>
          </div>
          <UButton
            label="Entrar"
            size="sm"
            variant="subtle"
            @click="enterAs(manager.id)"
          />
        </li>
      </ul>
    </UCard>

    <UCard
      v-for="store in stores"
      :key="store.id"
    >
      <template #header>
        <h2 class="font-semibold text-highlighted">
          {{ store.name }}
        </h2>
        <p class="text-sm text-muted">
          {{ storeById(store.id)?.location }}
        </p>
      </template>
      <ul class="divide-y divide-default">
        <li
          v-for="member in storeStaff(store.id)"
          :key="member.id"
          class="flex items-center justify-between gap-3 py-2.5"
        >
          <div class="flex items-center gap-2.5">
            <PersonAvatar
              :name="member.name"
              :color="member.color"
              :photo-url="member.photoUrl"
            />
            <div>
              <p class="text-sm font-medium text-highlighted">
                {{ member.name }}
              </p>
              <p class="text-xs text-muted">
                {{ ROLE_LABELS[member.role] }}
              </p>
            </div>
          </div>
          <UButton
            label="Entrar"
            size="sm"
            variant="subtle"
            @click="enterAs(member.id)"
          />
        </li>
      </ul>
    </UCard>
  </div>
</template>
