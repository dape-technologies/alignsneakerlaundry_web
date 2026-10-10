export const money = (value = 0) => `UGX ${Number(value).toLocaleString('en-UG')}`

export const dateTime = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not set'

const statusLabels = { received: 'Received', cleaning: 'In cleaning', drying: 'Drying', quality_check: 'Quality check', ready_for_collection: 'Ready for collection', collected: 'Collected', cancelled: 'Cancelled' }
export const statusLabel = (status = '') => statusLabels[status] || status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
