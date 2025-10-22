// frontend/src/lib/api.js
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init && init.headers ? init.headers : {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = "";
    try { msg = await res.text(); } catch {}
    throw new Error(`${res.status} ${res.statusText} ${msg}`);
  }
  return res.json();
}

export const apiAuth = {
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body)    => request("/api/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  me: ()           => request("/api/auth/me",       { method: "GET" }),
  logout: ()       => request("/api/auth/logout",   { method: "POST" }),
};

export const apiChat = {
  createConversation: (body) => request("/api/conversations", { method: "POST", body: JSON.stringify(body) }),
  listConversations:  ()     => request("/api/conversations", { method: "GET" }),
  getMessages:        (id)   => request(`/api/conversations/${id}/messages`, { method: "GET" }),
  sendMessage:        (id, body) => request(`/api/conversations/${id}/messages`, { method: "POST", body: JSON.stringify(body) }),
  deleteConversation: (id)   => request(`/api/conversations/${id}`, { method: "DELETE" }),
};

// (신규) 감정일기 API — 백엔드에 /api/diaries.* 라우트가 있어야 동작합니다.
export const apiDiary = {
  create: (body)           => request("/api/diaries", { method: "POST", body: JSON.stringify(body) }),
  list:   ()               => request("/api/diaries", { method: "GET" }),
  detail: (id)             => request(`/api/diaries/${id}`, { method: "GET" }),
  update: (id, body)       => request(`/api/diaries/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id)             => request(`/api/diaries/${id}`, { method: "DELETE" }),
};
