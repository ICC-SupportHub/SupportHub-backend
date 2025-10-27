// frontend/src/lib/api.js

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const TOKEN_KEY = 'sh_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || null;
}

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

  if (!res.ok) {
    let msg = '';
    try {
      msg = await res.text();
    } catch {}
    throw new Error(`${res.status} ${res.statusText} ${msg}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** 인증 API */
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

  me: () =>
    request('/api/auth/me', {
      method: 'GET',
    }),

  logout: () =>
    request('/api/auth/logout', {
      method: 'POST',
    }),
};

/** 채팅 API */
export const apiChat = {
  createConversation: (body) =>
    request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listConversations: () =>
    request('/api/conversations', {
      method: 'GET',
    }),

  getMessages: (id) =>
    request(`/api/conversations/${id}/messages`, {
      method: 'GET',
    }),

  sendMessage: (id, body) =>
    request(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteConversation: (id) =>
    request(`/api/conversations/${id}`, {
      method: 'DELETE',
    }),
};

/** 감정 일기 API */
export const apiDiary = {
  create: (body) =>
    request('/api/diaries', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  list: () =>
    request('/api/diaries', {
      method: 'GET',
    }),

  detail: (id) =>
    request(`/api/diaries/${id}`, {
      method: 'GET',
    }),

  update: (id, body) =>
    request(`/api/diaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  remove: (id) =>
    request(`/api/diaries/${id}`, {
      method: 'DELETE',
    }),

  stats: ({ range = 'week' } = {}) =>
    request(`/api/diaries/stats?range=${encodeURIComponent(range)}`, {
      method: 'GET',
    }),
};

/** 🔥 커뮤니티 API (백엔드 CommunityController와 100% 맞춘 버전) */
export const apiCommunity = {
  // 목록 조회
  // sort: 'latest' | 'likes' | 'comments'
  list: ({ sort = 'latest' } = {}) =>
    request(`/api/community/posts?sort=${encodeURIComponent(sort)}`, {
      method: 'GET',
    }),

  // 게시글 작성
  createPost: ({ emotion, content }) =>
    request('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ emotion, content }),
    }),

  // 게시글 삭제
  deletePost: (postId) =>
    request(`/api/community/posts/${postId}`, {
      method: 'DELETE',
    }),

  // 댓글 작성
  createComment: (postId, { content }) =>
    request(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // 좋아요 토글
  toggleLike: (postId) =>
    request(`/api/community/posts/${postId}/like-toggle`, {
      method: 'POST',
    }),
};
