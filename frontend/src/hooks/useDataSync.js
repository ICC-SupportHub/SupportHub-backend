'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiDiary, apiChat } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Firestore 동기화를 없애고, 백엔드 REST(API) 중심으로
 * 일기/대화 데이터를 불러오고 갱신하는 훅.
 *
 * - 로그인 유저: 백엔드에서 일기/대화 조회
 * - 비로그인: localStorage 폴백(기존 UX 유지)
 *
 * 반환:
 *   { diaries, conversations, loading, error,
 *     refresh,    // 일기+대화 동시 새로고침
 *     upsertDiary, deleteDiary,
 *     createConversation, listConversations, getMessages, sendMessage, deleteConversation
 *   }
 */
export default function useDataSync(options = {}) {
  const {
    pollMs = 0,         // >0 설정 시 주기적 폴링
    enable = true,      // 훅 동작 on/off
    lsDiaryKey = 'emotion-diaries',
    lsConvKey = 'local-conversations',
  } = options;

  const { user } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);
  const timerRef = useRef(null);

  const normalizeDiary = useCallback((d) => ({
    id: d.id ?? d.diaryId ?? `${Date.now()}-${Math.random()}`,
    content: d.content ?? '',
    emotions: d.emotions ?? (d.emotion ? [d.emotion] : []),
    feedback: d.feedback ?? '',
    createdAt: d.createdAt ?? d.created_at ?? new Date().toISOString(),
    updatedAt: d.updatedAt ?? d.updated_at ?? d.createdAt ?? new Date().toISOString(),
  }), []);

  const loadDiaries = useCallback(async () => {
    if (!enable) return [];
    try {
      if (user) {
        const resp = await apiDiary.list();
        const list = Array.isArray(resp) ? resp.map(normalizeDiary) : [];
        setDiaries(list);
        return list;
      }
      // guest: localStorage
      const saved = localStorage.getItem(lsDiaryKey);
      const list = saved ? JSON.parse(saved) : [];
      setDiaries(list);
      return list;
    } catch (e) {
      setErr(e);
      // 폴백: localStorage
      const saved = localStorage.getItem(lsDiaryKey);
      const list = saved ? JSON.parse(saved) : [];
      setDiaries(list);
      return list;
    }
  }, [enable, lsDiaryKey, normalizeDiary, user]);

  const loadConversations = useCallback(async () => {
    if (!enable) return [];
    try {
      if (user) {
        const list = await apiChat.listConversations();
        setConversations(Array.isArray(list) ? list : []);
        return Array.isArray(list) ? list : [];
      }
      // guest: localStorage
      const saved = localStorage.getItem(lsConvKey);
      const list = saved ? JSON.parse(saved) : [];
      setConversations(list);
      return list;
    } catch (e) {
      setErr(e);
      const saved = localStorage.getItem(lsConvKey);
      const list = saved ? JSON.parse(saved) : [];
      setConversations(list);
      return list;
    }
  }, [enable, lsConvKey, user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDiaries(), loadConversations()]);
    } finally {
      setLoading(false);
    }
  }, [loadConversations, loadDiaries]);

  // CRUD — Diary
  const upsertDiary = useCallback(async (payload, diaryId = null) => {
    if (user) {
      if (diaryId) {
        await apiDiary.update(diaryId, payload);
      } else {
        await apiDiary.create(payload);
      }
      await loadDiaries();
    } else {
      // guest: localStorage
      const saved = localStorage.getItem(lsDiaryKey);
      let list = saved ? JSON.parse(saved) : [];
      if (diaryId) {
        list = list.map(d => d.id === diaryId ? {
          ...d,
          ...payload,
          updatedAt: new Date().toISOString()
        } : d);
      } else {
        list = [{
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload,
        }, ...list];
      }
      localStorage.setItem(lsDiaryKey, JSON.stringify(list));
      setDiaries(list);
    }
  }, [lsDiaryKey, loadDiaries, user]);

  const deleteDiary = useCallback(async (diaryId) => {
    if (!diaryId) return;
    if (user) {
      await apiDiary.remove(diaryId);
      await loadDiaries();
    } else {
      const saved = localStorage.getItem(lsDiaryKey);
      const list = saved ? JSON.parse(saved) : [];
      const next = list.filter(d => d.id !== diaryId);
      localStorage.setItem(lsDiaryKey, JSON.stringify(next));
      setDiaries(next);
    }
  }, [lsDiaryKey, loadDiaries, user]);

  // Chat helpers
  const createConversation = useCallback(async ({ title, topic }) => {
    if (user) {
      const c = await apiChat.createConversation({ title, topic });
      await loadConversations();
      return c;
    } else {
      const saved = localStorage.getItem(lsConvKey);
      const list = saved ? JSON.parse(saved) : [];
      const conv = {
        id: `${Date.now()}`,
        title: title || '대화',
        topic: topic || 'general',
        createdAt: new Date().toISOString(),
      };
      const next = [conv, ...list];
      localStorage.setItem(lsConvKey, JSON.stringify(next));
      setConversations(next);
      return conv;
    }
  }, [lsConvKey, loadConversations, user]);

  const listConversations = useCallback(async () => {
    if (user) {
      return apiChat.listConversations();
    }
    const saved = localStorage.getItem(lsConvKey);
    return saved ? JSON.parse(saved) : [];
  }, [lsConvKey, user]);

  const getMessages = useCallback(async (conversationId) => {
    if (!conversationId) return [];
    if (user) {
      const msgs = await apiChat.getMessages(conversationId);
      return Array.isArray(msgs) ? msgs : [];
    }
    const key = `${lsConvKey}:${conversationId}:messages`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }, [lsConvKey, user]);

  const sendMessage = useCallback(async (conversationId, body) => {
    if (!conversationId) throw new Error('conversationId가 필요합니다.');
    if (user) {
      return apiChat.sendMessage(conversationId, body);
    }
    const key = `${lsConvKey}:${conversationId}:messages`;
    const saved = localStorage.getItem(key);
    const msgs = saved ? JSON.parse(saved) : [];
    const userMsg = {
      id: `${Date.now()}`,
      role: 'user',
      content: body?.content ?? '',
      createdAt: new Date().toISOString()
    };
    const aiMsg = {
      id: `${Date.now()+1}`,
      role: 'assistant',
      content: '게스트 모드에서는 로컬 저장만 됩니다.',
      createdAt: new Date().toISOString()
    };
    const next = [...msgs, userMsg, aiMsg];
    localStorage.setItem(key, JSON.stringify(next));
    return { messages: next };
  }, [lsConvKey, user]);

  const deleteConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;
    if (user) {
      await apiChat.deleteConversation(conversationId);
      await loadConversations();
    } else {
      const saved = localStorage.getItem(lsConvKey);
      const list = saved ? JSON.parse(saved) : [];
      const next = list.filter(c => c.id !== conversationId);
      localStorage.setItem(lsConvKey, JSON.stringify(next));
      // 메시지 로컬 키도 정리
      localStorage.removeItem(`${lsConvKey}:${conversationId}:messages`);
      setConversations(next);
    }
  }, [lsConvKey, loadConversations, user]);

  // 초기/폴링 로드
  useEffect(() => {
    if (!enable) return;
    refresh();
    if (pollMs > 0) {
      timerRef.current = setInterval(refresh, pollMs);
      return () => clearInterval(timerRef.current);
    }
  }, [enable, pollMs, refresh]);

  const value = useMemo(() => ({
    diaries,
    conversations,
    loading,
    error,
    refresh,
    upsertDiary,
    deleteDiary,
    createConversation,
    listConversations,
    getMessages,
    sendMessage,
    deleteConversation,
  }), [
    diaries, conversations, loading, error,
    refresh, upsertDiary, deleteDiary,
    createConversation, listConversations, getMessages, sendMessage, deleteConversation
  ]);

  return value;
}
