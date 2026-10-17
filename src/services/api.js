import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})
const sessionClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

let csrfRequest
let csrfReadyAt = 0
let sessionRequest
let sessionVerifiedAt = 0
let authFailureNotified = false
const csrfRefreshInterval = 5 * 60 * 1000
const sessionVerificationInterval = 30 * 1000

function readCookie(name) {
  if (typeof document === 'undefined') return ''

  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find((value) => value.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : ''
}

function attachXsrfToken(config) {
  const token = readCookie('XSRF-TOKEN')
  if (!token) return

  if (typeof config.headers?.set === 'function') {
    config.headers.set('X-XSRF-TOKEN', token)
    return
  }

  config.headers = config.headers || {}
  config.headers['X-XSRF-TOKEN'] = token
}

function notifyAuthExpired() {
  if (authFailureNotified || typeof window === 'undefined') return
  authFailureNotified = true
  csrfReadyAt = 0
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

export function resetAuthFailure() {
  authFailureNotified = false
  sessionVerifiedAt = Date.now()
}

export function clearSessionState() {
  sessionVerifiedAt = 0
  csrfReadyAt = 0
}

export async function keepSessionAlive(force = false, notifyOnFailure = true) {
  if (!force && sessionVerifiedAt && Date.now() - sessionVerifiedAt < sessionVerificationInterval) return
  if (!sessionRequest) sessionRequest = sessionClient.get('/me')

  try {
    const { data } = await sessionRequest
    sessionVerifiedAt = Date.now()
    return data.user
  } catch (error) {
    sessionVerifiedAt = 0
    if (notifyOnFailure && error.response?.status === 401) notifyAuthExpired()
    throw error
  } finally {
    sessionRequest = null
  }
}

export async function initializeCsrf(force = false) {
  const configuredApi = import.meta.env.VITE_API_BASE_URL || '/api'
  const csrfUrl = import.meta.env.VITE_CSRF_URL
    || (configuredApi.startsWith('http')
      ? new URL('/sanctum/csrf-cookie', configuredApi).toString()
      : '/sanctum/csrf-cookie')

  if (!force && csrfReadyAt && Date.now() - csrfReadyAt < csrfRefreshInterval) return

  if (!csrfRequest) {
    csrfRequest = axios.get(csrfUrl, { withCredentials: true })
  }

  try {
    await csrfRequest
    csrfReadyAt = Date.now()
  } catch (error) {
    csrfReadyAt = 0
    throw error
  } finally {
    csrfRequest = null
  }
}

const mutatingMethods = new Set(['post', 'put', 'patch', 'delete'])

api.interceptors.request.use(async (config) => {
  const mutating = mutatingMethods.has(config.method?.toLowerCase())
  if (mutating) {
    await initializeCsrf()
    attachXsrfToken(config)
  }
  return config
})

api.interceptors.response.use((response) => {
  if (!String(response.config?.url || '').endsWith('/health')) sessionVerifiedAt = Date.now()
  return response
}, async (error) => {
  const config = error.config
  const status = error.response?.status

  if (status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true
    await initializeCsrf(true)
    attachXsrfToken(config)
    return api.request(config)
  }

  const endpoint = String(config?.url || '').split('?')[0]
  if (status === 401 && config && !config._authRetried && !['/login', '/logout', '/me'].includes(endpoint)) {
    config._authRetried = true
    try {
      await keepSessionAlive(true, false)
      await initializeCsrf(true)
      attachXsrfToken(config)
      return api.request(config)
    } catch {
      notifyAuthExpired()
    }
  } else if (status === 401 && !['/login', '/me'].includes(endpoint)) {
    notifyAuthExpired()
  }

  throw error
})

export function validationErrors(error) {
  if (error.response?.data?.errors) return error.response.data.errors
  if (error.response?.status === 401) return { form: ['Your session expired. Sign in again to continue.'] }
  if (error.response?.status === 419) return { form: ['The secure form token could not be refreshed. Please try again.'] }
  return { form: [error.response?.data?.message || 'The form could not be submitted.'] }
}
