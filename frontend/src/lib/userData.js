// 로그인 감지 + 사용자 데이터 관리 (ES 모듈 기반 유틸)
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { diaryService, conversationService } from './firestore'
import { CLOUD_SAVE_ENABLED } from './featureFlags'

const GUEST_KEY = 'guestData'

// 게스트 데이터 초기화 (새로고침 시 제거)
export const registerGuestClearOnReload = () => {
  if (typeof window === 'undefined') return
  const handler = () => {
    try {
      localStorage.removeItem(GUEST_KEY)
    } catch {}
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}

// 게스트 데이터 쓰기/읽기
export const setGuestData = (dataType, payload) => {
  if (typeof window === 'undefined') return
  const current = JSON.parse(localStorage.getItem(GUEST_KEY) || '{}')
  const next = { ...current, [dataType]: payload }
  localStorage.setItem(GUEST_KEY, JSON.stringify(next))
}

export const getGuestData = (dataType) => {
  if (typeof window === 'undefined') return null
  const current = JSON.parse(localStorage.getItem(GUEST_KEY) || '{}')
  return current[dataType] || null
}

// 사용자 데이터 로드 (users/{uid}/{dataType})
export const fetchUserData = async (uid, dataType) => {
  if (!uid) return null
  if (!CLOUD_SAVE_ENABLED) return null
  if (dataType === 'diaries') {
    return await diaryService.getUserDiaries(uid)
  }
  if (dataType === 'conversations') {
    return await conversationService.getUserConversations(uid)
  }
  return null
}

// 사용자 데이터 저장 (로그인/비로그인 분기)
export const saveData = async ({ user, dataType, payload }) => {
  // Firebase 저장 기능 비활성화 시 항상 로컬 저장
  if (!CLOUD_SAVE_ENABLED) {
    setGuestData(dataType, payload)
    return payload
  }

  if (user?.uid) {
    if (dataType === 'diaries') {
      return await diaryService.saveDiary(user.uid, payload)
    }
    if (dataType === 'conversations') {
      return await conversationService.saveConversation(user.uid, payload)
    }
  }

  setGuestData(dataType, payload)
  return payload
}

// 로그인 상태 감지 후 사용자 데이터 로딩 콜백 제공
export const useUserDataInit = (onUserChange) => {
  // 이 유틸은 훅이 아닌, 앱 초기화에서 호출되는 리스너 등록 함수
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    try {
      await onUserChange?.(user)
    } catch (e) {
      console.error('useUserDataInit error:', e)
    }
  })
  return unsubscribe
}


