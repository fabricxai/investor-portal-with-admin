import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrencyRange(amount: number): string {
  const rounded = Math.round(amount / 1000) * 1000
  const lower = Math.max(0, rounded - 2000)
  const upper = rounded + 2000
  return `${formatCurrency(lower)}–${formatCurrency(upper)}`
}

export function formatMonthsRange(months: number): string {
  const lower = Math.max(1, months - 3)
  const upper = months + 3
  return `~${lower}–${upper} months`
}
