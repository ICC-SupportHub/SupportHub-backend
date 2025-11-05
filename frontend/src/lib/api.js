// frontend/src/lib/api.js

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8080';

export const TOKEN_KEY = 'sh_token';

/** ✅ 토큰 가져오기 */
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || null;
}

/** ✅ 공통 요청 함수 */
async function request(path, init = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  // 응답 실패 처리
  if (!res.ok) {
    let msg = '';
    try {
      msg = await res.text();
    } catch {}
    console.error(`[API ERROR] ${path}:`, msg);
    throw new Error(`${res.status} ${res.statusText} ${msg}`);
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

/** ✅ 인증 관련 API */
export const apiAuth = {
  register: (body) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request('/api/auth/me', { method: 'GET' }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

/** ✅ 채팅 관련 API */
export const apiChat = {
  createConversation: (body) =>
    request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listConversations: () =>
    request('/api/conversations', { method: 'GET' }),

  getMessages: (id) =>
    request(`/api/conversations/${id}/messages`, { method: 'GET' }),

  sendMessage: (id, body) =>
    request(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteConversation: (id) =>
    request(`/api/conversations/${id}`, { method: 'DELETE' }),

  /** ✅ 모든 대화 삭제 (새 대화 시작용) */
  resetConversations: async () => {
    try {
      return await request('/api/conversations/reset', { method: 'DELETE' });
    } catch (err) {
      console.error('❌ resetConversations 실패:', err);
      throw err;
    }
  },
};

/** ✅ 감정 일기 API */
export const apiDiary = {
  create: (body) =>
    request('/api/diaries', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  list: () => request('/api/diaries', { method: 'GET' }),

  detail: (id) => request(`/api/diaries/${id}`, { method: 'GET' }),

  update: (id, body) =>
    request(`/api/diaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  remove: (id) => request(`/api/diaries/${id}`, { method: 'DELETE' }),

  stats: ({ range = 'week' } = {}) =>
    request(`/api/diaries/stats?range=${encodeURIComponent(range)}`, {
      method: 'GET',
    }),
};

/** ✅ 커뮤니티 API */
export const apiCommunity = {
  list: ({ sort = 'latest' } = {}) =>
    request(`/api/community/posts?sort=${encodeURIComponent(sort)}`, {
      method: 'GET',
    }),

  createPost: ({ emotion, content }) =>
    request('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ emotion, content }),
    }),

  deletePost: (postId) =>
    request(`/api/community/posts/${postId}`, { method: 'DELETE' }),

  createComment: (postId, { content }) =>
    request(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  toggleLike: (postId) =>
    request(`/api/community/posts/${postId}/like-toggle`, {
      method: 'POST',
    }),
};
