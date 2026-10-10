export const money = (value = 0) => `UGX ${Number(value).toLocaleString('en-UG')}`

export const dateTime = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not set'

export const statusLabel = (status = '') => status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
