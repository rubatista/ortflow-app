<script setup lang="ts">
const { accessibleStores, isRegional, currentUser, selectStore } = useSession()
const { employeesByStore: storeEmployees } = useAppData()

onMounted(() => {
  if (!isRegional.value) navigateTo('/')
})

function enterStore(storeId: string) {
  selectStore(storeId)
  navigateTo('/')
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-3xl mx-auto">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-highlighted">
        Escolhe uma loja
      </h1>
      <p class="text-muted mt-1">
        Olá {{ currentUser?.name }}, geres {{ accessibleStores.length }} lojas. Qual queres consultar?
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard
        v-for="store in accessibleStores"
        :key="store.id"
        class="cursor-pointer hover:ring-2 hover:ring-primary transition"
        @click="enterStore(store.id)"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-primary/10 p-2.5">
            <UIcon
              name="i-lucide-store"
              class="size-5 text-primary"
            />
          </div>
          <div>
            <p class="font-semibold text-highlighted">
              {{ store.name }}
            </p>
            <p class="text-sm text-muted">
              {{ store.location }} · {{ storeEmployees(store.id).length }} colaboradores
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
