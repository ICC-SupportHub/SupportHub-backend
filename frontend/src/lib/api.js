// frontend/src/lib/api.js
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL

function authHeaders() {
  if (typeof window === 'undefined') return {}
  const t = localStorage.getItem('sh_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init && init.headers ? init.headers : {}),
    },
    ...init,
  })
  if (!res.ok) {
    let msg = ''
    try {
      msg = await res.text()
    } catch {}
    throw new Error(`${res.status} ${res.statusText} ${msg}`)
  }
  // 일부 엔드포인트는 빈 응답일 수 있으니 방어
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export const apiAuth = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me', { method: 'GET' }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
}

export const apiChat = {
  createConversation: (body) => request('/api/conversations', { method: 'POST', body: JSON.stringify(body) }),
  listConversations: () => request('/api/conversations', { method: 'GET' }),
  getMessages: (id) => request(`/api/conversations/${id}/messages`, { method: 'GET' }),
  sendMessage: (id, body) => request(`/api/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  deleteConversation: (id) => request(`/api/conversations/${id}`, { method: 'DELETE' }),
}

export const apiDiary = {
  create: (body) => request('/api/diaries', { method: 'POST', body: JSON.stringify(body) }),
  list: () => request('/api/diaries', { method: 'GET' }),
  detail: (id) => request(`/api/diaries/${id}`, { method: 'GET' }),
  update: (id, body) => request(`/api/diaries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/api/diaries/${id}`, { method: 'DELETE' }),
}
