import api from '../api/api'

export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
export const costCentreOptions = ['Operations', 'Administration', 'Sales', 'Maintenance', 'Executive']
export const fuelTypeOptions = ['Unleaded 91', 'Unleaded 95', 'Unleaded 98', 'Diesel', 'LPG', 'Electric (charge)']

export function validateReceiptFile(file) {
  if (!file) return 'Please select a receipt image or PDF.'
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and PDF receipts are supported.'
  }
  if (file.size > MAX_RECEIPT_FILE_SIZE) {
    return 'Receipt files must be 10MB or smaller.'
  }
  return ''
}

export function resolveReceiptUrl(receiptUrl) {
  if (!receiptUrl) return ''
  if (/^https?:\/\//.test(receiptUrl)) return receiptUrl
  const origin = api.defaults.baseURL.replace(/\/api\/?$/, '')
  return `${origin}${receiptUrl.startsWith('/') ? '' : '/'}${receiptUrl}`
}

export function formatAuDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-AU').format(new Date(`${value}T00:00:00`))
}

export function formatAudCurrency(value) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0))
}

export function buildFuelReference(id) {
  return `FR-${`${id}`.padStart(6, '0')}`
}

export function formatVehicleDisplay(vehicle) {
  if (!vehicle) return '—'
  const registration = vehicle.registration_number || 'Unknown vehicle'
  const description = [vehicle.make, vehicle.model].filter(Boolean).join(' ')
  return description ? `${registration} — ${description}` : registration
}
