<script setup lang="ts">
import { MANAGER_ROLES, ROLE_LABELS } from '~/types'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  htmlAttrs: {
    lang: 'pt-PT'
  }
})

const title = 'OrtFlow'
const description = 'Gestão de equipas, horários e mapa de férias.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const { currentUser, currentStore, isRegional, logout } = useSession()
const { notificationsFor, unreadCountFor, markNotificationRead, markAllNotificationsRead } = useAppData()

const canManage = computed(() => Boolean(currentUser.value && MANAGER_ROLES.includes(currentUser.value.role)))

const links = computed(() => {
  const items = [
    { label: 'Dashboard', to: '/', icon: 'i-lucide-layout-dashboard' }
  ]
  if (isRegional.value) {
    items.push({ label: 'Painel regional', to: '/regiao', icon: 'i-lucide-building-2' })
  }
  items.push(
    { label: 'Equipa', to: '/equipas', icon: 'i-lucide-users' },
    { label: 'Horários', to: '/horarios', icon: 'i-lucide-calendar-clock' },
    { label: 'Vendas', to: '/vendas', icon: 'i-lucide-trending-up' },
    { label: 'Férias', to: '/ferias', icon: 'i-lucide-tree-palm' }
  )
  if (canManage.value) {
    items.push({ label: 'Objetivos', to: '/objetivos', icon: 'i-lucide-target' })
  }
  return items
})

const myNotifications = computed(() => currentUser.value ? notificationsFor(currentUser.value.id) : [])
const unreadCount = computed(() => currentUser.value ? unreadCountFor(currentUser.value.id) : 0)

function markAllRead() {
  if (currentUser.value) markAllNotificationsRead(currentUser.value.id)
}

const userMenuItems = computed(() => {
  const actions = []
  if (currentUser.value) {
    actions.push({ label: 'Perfil', icon: 'i-lucide-user', to: `/equipas/${currentUser.value.id}` })
  }
  if (isRegional.value) {
    actions.push({ label: 'Trocar loja', icon: 'i-lucide-store', to: '/lojas' })
  }
  const logoutAction = [{
    label: 'Sair',
    icon: 'i-lucide-log-out',
    onSelect: () => {
      logout()
      navigateTo('/entrar')
    }
  }]
  return [actions, logoutAction]
})
</script>

<template>
  <UApp>
    <ConfirmDialog />

    <UDashboardGroup
      v-if="currentUser"
      unit="px"
    >
      <UDashboardSidebar
        collapsible
        resizable
        :min-size="180"
        :max-size="320"
        :default-size="240"
        class="print:hidden"
      >
        <template #header>
          <NuxtLink
            to="/"
            class="flex items-center gap-2"
          >
            <AppLogo />
          </NuxtLink>
        </template>

        <UNavigationMenu
          :items="links"
          orientation="vertical"
        />

        <template #footer>
          <div
            v-if="currentStore"
            class="w-full rounded-2xl bg-primary/10 p-4 flex flex-col gap-1"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-store"
                class="size-4 text-primary shrink-0"
              />
              <p class="text-sm font-semibold text-highlighted truncate">
                {{ currentStore.name }}
              </p>
            </div>
            <p class="text-xs text-muted truncate">
              {{ currentStore.location }}
            </p>
            <UButton
              v-if="isRegional"
              label="Trocar loja"
              icon="i-lucide-repeat"
              color="primary"
              variant="soft"
              size="xs"
              block
              class="mt-2"
              to="/lojas"
            />
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardPanel>
        <template #header>
          <UDashboardNavbar class="print:hidden">
            <template #right>
              <UColorModeButton />
              <UPopover>
                <UChip
                  :show="unreadCount > 0"
                  :text="unreadCount > 9 ? '9+' : unreadCount"
                  color="error"
                  :ui="{ base: 'h-[19px] min-w-[19px] px-1 text-[11px] font-bold ring-2' }"
                >
                  <UButton
                    icon="i-lucide-bell"
                    color="neutral"
                    variant="ghost"
                  />
                </UChip>

                <template #content>
                  <div class="w-80 max-h-96 overflow-y-auto">
                    <div class="flex items-center justify-between p-3 border-b border-default">
                      <p class="font-medium text-highlighted text-sm">
                        Notificações
                      </p>
                      <UButton
                        v-if="unreadCount > 0"
                        label="Marcar todas como lidas"
                        size="xs"
                        color="neutral"
                        variant="link"
                        @click="markAllRead"
                      />
                    </div>
                    <div
                      v-if="myNotifications.length === 0"
                      class="text-sm text-muted py-6 text-center"
                    >
                      Sem notificações.
                    </div>
                    <ul
                      v-else
                      class="divide-y divide-default"
                    >
                      <li
                        v-for="notification in myNotifications"
                        :key="notification.id"
                        class="p-3 flex items-start gap-2 cursor-pointer"
                        :class="notification.read ? '' : 'bg-primary/5'"
                        @click="markNotificationRead(notification.id)"
                      >
                        <span
                          class="size-1.5 rounded-full mt-1.5 shrink-0"
                          :class="notification.read ? 'bg-transparent' : 'bg-primary'"
                        />
                        <div class="min-w-0">
                          <p class="text-sm text-highlighted">
                            {{ notification.message }}
                          </p>
                          <p class="text-xs text-muted mt-0.5">
                            {{ formatRelativeTime(notification.createdAt) }}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </template>
              </UPopover>
              <UDropdownMenu :items="userMenuItems">
                <UButton
                  color="neutral"
                  variant="ghost"
                >
                  <PersonAvatar
                    :name="currentUser.name"
                    :color="currentUser.color"
                    :photo-url="currentUser.photoUrl"
                    size="sm"
                  />
                  <span class="hidden sm:flex flex-col items-start leading-tight">
                    <span class="text-sm font-medium">{{ currentUser.name }}</span>
                    <span class="text-xs text-muted">{{ ROLE_LABELS[currentUser.role] }}</span>
                  </span>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="size-4"
                  />
                </UButton>
              </UDropdownMenu>
            </template>
          </UDashboardNavbar>
        </template>

        <template #body>
          <UContainer class="py-8 print:max-w-none print:p-0">
            <NuxtPage />
          </UContainer>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>

    <template v-else>
      <UHeader>
        <template #left>
          <NuxtLink to="/">
            <AppLogo />
          </NuxtLink>
        </template>
      </UHeader>

      <UMain>
        <UContainer class="py-8">
          <NuxtPage />
        </UContainer>
      </UMain>

      <UFooter>
        <template #left>
          <p class="text-sm text-muted">
            OrtFlow • © {{ new Date().getFullYear() }}
          </p>
        </template>
      </UFooter>
    </template>
  </UApp>
</template>
