import { reactive } from 'vue'
import { apiRequest, TOKEN_KEY } from '../lib/api'

const USER_KEY = 'ai_proxy_user'
const SESSION_KEY = 'ai_proxy_session'

const state = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  session: null,
  ready: false,
  loading: false,
  error: '',
})

let hydratePromise = null

function saveSession(token, user, session = null) {
  state.token = token
  state.user = user
  state.session = session
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function clearSession() {
  state.token = ''
  state.user = null
  state.session = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(SESSION_KEY)
}

function isSuperadmin(user) {
  return ['superadmin', 'admin'].includes(user?.role)
}

async function hydrate() {
  if (hydratePromise) {
    return hydratePromise
  }

  hydratePromise = (async () => {
    const cachedUser = localStorage.getItem(USER_KEY)
    const cachedSession = localStorage.getItem(SESSION_KEY)
    if (cachedUser && !state.user) {
      try {
        state.user = JSON.parse(cachedUser)
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }
    if (cachedSession && !state.session) {
      try {
        state.session = JSON.parse(cachedSession)
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }

    if (!state.token) {
      state.ready = true
      hydratePromise = null
      return
    }

    try {
      const user = await apiRequest('/api/v1/auth/me')
      saveSession(state.token, user, state.session)
    } catch {
      clearSession()
    } finally {
      state.ready = true
      hydratePromise = null
    }
  })()

  return hydratePromise
}

async function login(email, password) {
  state.loading = true
  state.error = ''
  try {
    const response = await apiRequest('/api/v1/auth/token', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    saveSession(response.access_token, response.user, response.session)
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
  isSuperadmin,
}
