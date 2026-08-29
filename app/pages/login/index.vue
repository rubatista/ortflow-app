<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  if (!email.value.trim() || !password.value) return
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value }
    })
    await refreshSession()
    await navigateTo('/')
  } catch {
    toast.add({ title: 'Não foi possível entrar', description: 'Verifica o email e a password.', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-highlighted">
            Entrar
          </h1>
          <p class="text-muted mt-1 text-sm">
            Acede com o teu email e password do OrtFlow.
          </p>
        </div>
      </template>

      <form
        class="flex flex-col gap-4"
        @submit.prevent="submit"
      >
        <UFormField label="Email">
          <UInput
            v-model="email"
            type="email"
            placeholder="nome@ortflow.pt"
            autocomplete="username"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Password">
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>
        <UButton
          label="Entrar"
          type="submit"
          block
          :loading="loading"
        />
      </form>
    </UCard>
  </div>
</template>
