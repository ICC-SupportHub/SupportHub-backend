'use client';
import { useEffect, useState } from 'react';
import { apiAuth } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 기존: userData/firebase 유틸들을 import 하던 파일.
 * 변경: 백엔드 권위 + 쿠키 세션 기반으로 동작하도록 안전한 대체 구현 제공.
 *
 * - useUserDataInit(): 컨텍스트 기반으로 user/loading만 간단히 노출
 * - registerGuestClearOnReload(): 게스트의 로컬 임시 데이터 정리 핸들러
 * - fetchUserData(): 서버의 현재 사용자(프로필) 가져오기 (게스트면 null)
 * - saveData(data): 서버에 사용자 설정 저장을 시도, 실패 시 localStorage 폴백
 */

// ==== 1) Hook: useUserDataInit =============================================
export function useUserDataInit() {
  const { user, loading } = useAuth();
  return { user, loading };
}

// ==== 2) 게스트 임시데이터 정리 ============================================
// 페이지 새로고침/닫기 시 게스트 임시 데이터 지우고 싶을 때 사용
export function registerGuestClearOnReload(options = {}) {
  const {
    keys = [
      'emotion-diaries',
      'local-conversations',
      // per-conversation messages: local-conversations:{id}:messages 는 개별 삭제가 어려워 생략
    ],
    enabled = true,
  } = options;

  if (typeof window === 'undefined' || !enabled) return;

  const handler = () => {
    try {
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}

// ==== 3) 사용자 정보 가져오기 ==============================================
// 백엔드가 세션 쿠키를 들고 있으면 현재 사용자 정보를 반환, 없으면 null
export async function fetchUserData() {
  try {
    const me = await apiAuth.me(); // { id, email, name, ... }
    return me ?? null;
  } catch (e) {
    // 401/403 → 비로그인
    return null;
  }
}

// ==== 4) 사용자 데이터 저장(설정/환경 등) ===================================
// 서버에 /api/users/me 같은 엔드포인트가 있다면 우선 시도하고,
// 없거나 실패하면 localStorage 폴백.
export async function saveData(data, options = {}) {
  const {
    serverEndpoint = '/api/users/me', // 백엔드에 존재할 경우
    lsKey = 'client-preferences',
  } = options;

  // 1) 서버로 저장 시도
  try {
    const res = await fetch(serverEndpoint, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    if (res.ok) {
      return await res.json().catch(() => ({}));
    }
    // 404/405 등: 엔드포인트 없으면 폴백
  } catch (_) {
    // 네트워크/서버 에러 → 폴백
  }

  // 2) 폴백: localStorage
  try {
    const prev = localStorage.getItem(lsKey);
    const merged = { ...(prev ? JSON.parse(prev) : {}), ...(data || {}) };
    localStorage.setItem(lsKey, JSON.stringify(merged));
    return merged;
  } catch (_) {
    return data || {};
  }
}

/**
 * (옵션) 앱 부팅 시 세션 확인만 따로 하고 싶다면 사용:
 *   import { initSession } from '@/main';
 *   await initSession();
 */
export async function initSession() {
  try {
    // 권장: AuthContext가 이미 부팅 때 apiAuth.me()를 호출하므로
    // 여기선 2차 확인/강제 갱신 용도
    const me = await apiAuth.me();
    return me ?? null;
  } catch (_) {
    return null;
  }
}
