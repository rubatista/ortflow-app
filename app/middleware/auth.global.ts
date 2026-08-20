export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { currentUser, needsStoreSelection } = useSession()

  if (!currentUser.value) {
    if (to.path !== '/login') return navigateTo('/login')
    return
  }

  if (to.path === '/login') return navigateTo('/')

  if (needsStoreSelection.value && to.path !== '/stores') return navigateTo('/stores')
})
