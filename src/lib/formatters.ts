const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

export function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return 'N/A'
  }

  return moneyFormatter.format(value)
}

export function formatDate(value: string | null): string {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) {
    return value
  }

  return dateFormatter.format(parsed)
}

export function safeText(value: string | null): string {
  return value && value.trim().length > 0 ? value : 'N/A'
}
