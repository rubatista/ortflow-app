export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    if (to.path !== '/login') return navigateTo('/login')
    return
  }

  if (to.path === '/login') return navigateTo('/')

  const { ensureBootstrapped } = useAppData()
  await ensureBootstrapped()

  const { needsStoreSelection } = useSession()
  if (needsStoreSelection.value && to.path !== '/stores') return navigateTo('/stores')
})
