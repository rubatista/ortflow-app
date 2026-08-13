export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { currentUser, needsStoreSelection } = useSession()

  if (!currentUser.value) {
    if (to.path !== '/entrar') return navigateTo('/entrar')
    return
  }

  if (to.path === '/entrar') return navigateTo('/')

  if (needsStoreSelection.value && to.path !== '/lojas') return navigateTo('/lojas')
})
