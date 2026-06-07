const TOKEN_KEY = 'ai_proxy_access_token'

function readToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token = readToken(),
    auth = true,
    headers = {},
  } = options

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(path, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { raw: text }
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed: ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export { TOKEN_KEY }
