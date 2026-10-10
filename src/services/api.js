import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

export async function initializeCsrf() {
  const configuredApi = import.meta.env.VITE_API_BASE_URL || '/api'
  const csrfUrl = import.meta.env.VITE_CSRF_URL
    || (configuredApi.startsWith('http')
      ? new URL('/sanctum/csrf-cookie', configuredApi).toString()
      : '/sanctum/csrf-cookie')

  await axios.get(csrfUrl, { withCredentials: true })
}

export function validationErrors(error) {
  return error.response?.data?.errors || {}
}
