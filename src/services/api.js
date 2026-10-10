import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

export async function initializeCsrf() {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
}

export function validationErrors(error) {
  return error.response?.data?.errors || {}
}
