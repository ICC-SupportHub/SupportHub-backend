// 앱 엔트리: 로그인 상태 감지 및 데이터 초기화 예시 (ESM)
import { useUserDataInit, registerGuestClearOnReload, fetchUserData, saveData } from './lib/userData'
import { CLOUD_SAVE_ENABLED } from './lib/featureFlags'
import { auth } from './lib/firebase'

// 1) 게스트 데이터는 새로고침 시 초기화
registerGuestClearOnReload()

// 2) 로그인 상태 감지 후 사용자 데이터 로드
let currentUser = null
useUserDataInit(async (user) => {
  currentUser = user
  if (user?.uid && CLOUD_SAVE_ENABLED) {
    // 예시: 사용자 다이어리 로드
    const diaries = await fetchUserData(user.uid, 'diaries')
    console.log('[loaded diaries]', diaries)
    // 예시: 사용자 대화 로드
    const conversations = await fetchUserData(user.uid, 'conversations')
    console.log('[loaded conversations]', conversations)
  } else {
    console.log('[guest mode]')
  }
})

// 3) 저장 예시
export const exampleSaveDiary = async () => {
  const payload = {
    emotions: ['행복', '감사'],
    content: '오늘 작은 성취가 있었고 감사한 하루였다.',
    feedback: '자기 강점에 주목한 점이 인상적이에요.',
  }
  const result = await saveData({ user: currentUser, dataType: 'diaries', payload })
  console.log('[saved diary]', result)
}

export const exampleSaveConversation = async () => {
  const payload = {
    messages: [
      { role: 'user', content: '요즘 불안해요.' },
      { role: 'assistant', content: '불안을 느끼게 하는 상황을 함께 살펴볼까요?' },
    ],
    topic: 'anxiety',
    title: '불안에 대한 대화',
  }
  const result = await saveData({ user: currentUser, dataType: 'conversations', payload })
  console.log('[saved conversation]', result)
}


