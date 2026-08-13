export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
