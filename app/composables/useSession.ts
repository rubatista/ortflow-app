export function useSession() {
  const { employees, storeById } = useAppData()
  const { user, clear } = useUserSession()

  const currentStoreId = useLocalStorage<string | null>('ortflow-session-store', null)

  const currentUser = computed(() => employees.value.find(e => e.id === user.value?.id) ?? null)

  const isRegional = computed(() => currentUser.value?.role === 'gerente_regional')

  const accessibleStores = computed(() => {
    const employee = currentUser.value
    if (!employee) return []
    if (isRegional.value) {
      return (employee.managedStoreIds ?? [])
        .map(id => storeById(id))
        .filter((store): store is NonNullable<typeof store> => Boolean(store))
    }
    const store = employee.storeId ? storeById(employee.storeId) : undefined
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

  async function logout() {
    currentStoreId.value = null
    await clear()
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
    logout,
    selectStore
  }
}
