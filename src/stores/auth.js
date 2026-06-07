import { reactive } from 'vue'
import { apiRequest, TOKEN_KEY } from '../lib/api'

const USER_KEY = 'ai_proxy_user'

const state = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  ready: false,
  loading: false,
  error: '',
})

let hydratePromise = null

function saveSession(token, user) {
  state.token = token
  state.user = user
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  state.token = ''
  state.user = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function hydrate() {
  if (hydratePromise) {
    return hydratePromise
  }

  hydratePromise = (async () => {
    const cachedUser = localStorage.getItem(USER_KEY)
    if (cachedUser && !state.user) {
      try {
        state.user = JSON.parse(cachedUser)
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }

    if (!state.token) {
      state.ready = true
      hydratePromise = null
      return
    }

    try {
      const user = await apiRequest('/api/v1/auth/me')
      saveSession(state.token, user)
    } catch {
      clearSession()
    } finally {
      state.ready = true
      hydratePromise = null
    }
  })()

  return hydratePromise
}

async function login(email) {
  state.loading = true
  state.error = ''
  try {
    const response = await apiRequest('/api/v1/auth/token', {
      method: 'POST',
      body: { email },
      auth: false,
    })
    saveSession(response.access_token, response.user)
    return response.user
  } catch (error) {
    state.error = error.message
    throw error
  } finally {
    state.loading = false
    state.ready = true
  }
}

async function logout() {
  try {
    if (state.token) {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' })
    }
  } catch {
    // ignore logout transport failures and clear local session anyway
  } finally {
    clearSession()
    state.ready = true
  }
}

export const authStore = {
  state,
  hydrate,
  login,
  logout,
  clearSession,
}
