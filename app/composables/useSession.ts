export function useSession() {
  const { employees, storeById } = useAppData()

  const currentUserId = useLocalStorage<string | null>('ortflow-session-user', null)
  const currentStoreId = useLocalStorage<string | null>('ortflow-session-store', null)

  const currentUser = computed(() => employees.value.find(e => e.id === currentUserId.value) ?? null)

  const isRegional = computed(() => currentUser.value?.role === 'gerente_regional')

  const accessibleStores = computed(() => {
    const user = currentUser.value
    if (!user) return []
    if (isRegional.value) {
      return (user.managedStoreIds ?? [])
        .map(id => storeById(id))
        .filter((store): store is NonNullable<typeof store> => Boolean(store))
    }
    const store = user.storeId ? storeById(user.storeId) : undefined
    return store ? [store] : []
  })

  const needsStoreSelection = computed(() => Boolean(currentUser.value) && isRegional.value && !currentStoreId.value)

  const currentStore = computed(() => {
    if (!currentUser.value) return null
    if (isRegional.value) {
      return currentStoreId.value ? storeById(currentStoreId.value) ?? null : null
    }
    return currentUser.value.storeId ? storeById(currentUser.value.storeId) ?? null : null
  })

  function login(employeeId: string) {
    currentUserId.value = employeeId
    currentStoreId.value = null
  }

  function logout() {
    currentUserId.value = null
    currentStoreId.value = null
  }

  function selectStore(storeId: string) {
    currentStoreId.value = storeId
  }

  return {
    currentUser,
    isRegional,
    accessibleStores,
    currentStore,
    needsStoreSelection,
    login,
    logout,
    selectStore
  }
}
