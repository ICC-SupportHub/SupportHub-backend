import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { diaryService, conversationService } from '@/lib/firestore'

// 사용자 인증 상태에 따른 데이터 동기화 훅
export const useDataSync = () => {
  const { user } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle', 'syncing', 'success', 'error'

  // localStorage에서 Firebase로 데이터 마이그레이션
  const syncLocalDataToFirebase = async () => {
    if (!user) return

    setIsSyncing(true)
    setSyncStatus('syncing')

    try {
      // 일기 데이터 동기화
      const localDiaries = localStorage.getItem('emotion-diaries')
      if (localDiaries) {
        const diaries = JSON.parse(localDiaries)
        const firebaseDiaries = await diaryService.getUserDiaries(user.uid)
        
        // Firebase에 없는 일기들만 추가
        for (const diary of diaries) {
          const exists = firebaseDiaries.some(fbDiary => 
            fbDiary.content === diary.content && 
            new Date(fbDiary.createdAt?.toDate?.() || fbDiary.createdAt).getTime() === new Date(diary.createdAt).getTime()
          )
          
          if (!exists) {
            await diaryService.saveDiary(user.uid, {
              emotions: diary.emotions || (diary.emotion ? [diary.emotion] : []),
              content: diary.content,
              feedback: diary.feedback || '',
            })
          }
        }
      }

      // 대화 데이터 동기화 (선택적)
      const localConversations = localStorage.getItem('ai-conversations')
      if (localConversations) {
        const conversations = JSON.parse(localConversations)
        const firebaseConversations = await conversationService.getUserConversations(user.uid)
        
        // Firebase에 없는 대화들만 추가
        for (const conversation of conversations) {
          const exists = firebaseConversations.some(fbConv => 
            fbConv.messages?.length === conversation.messages?.length &&
            fbConv.createdAt?.toDate?.()?.getTime() === new Date(conversation.createdAt).getTime()
          )
          
          if (!exists && conversation.messages && conversation.messages.length > 1) {
            await conversationService.saveConversation(user.uid, {
              messages: conversation.messages,
              topic: conversation.topic || 'general',
              title: conversation.title || `AI와의 감정 대화 - ${new Date(conversation.createdAt).toLocaleDateString('ko-KR')}`,
            })
          }
        }
      }

      setSyncStatus('success')
      
      // 동기화 완료 후 localStorage 데이터는 유지 (백업용)
      // 필요시 localStorage.clear()로 완전 삭제 가능
      
    } catch (error) {
      console.error('데이터 동기화 실패:', error)
      setSyncStatus('error')
    } finally {
      setIsSyncing(false)
    }
  }

  // Firebase에서 localStorage로 데이터 백업
  const backupFirebaseDataToLocal = async () => {
    if (!user) return

    try {
      // 일기 데이터 백업
      const diaries = await diaryService.getUserDiaries(user.uid)
      const formattedDiaries = diaries.map(diary => ({
        id: diary.id,
        date: diary.createdAt?.toDate?.()?.toISOString() || diary.createdAt,
        emotions: diary.emotions,
        content: diary.content,
        feedback: diary.feedback,
        createdAt: diary.createdAt?.toDate?.()?.toISOString() || diary.createdAt,
        updatedAt: diary.updatedAt?.toDate?.()?.toISOString() || diary.updatedAt,
      }))
      localStorage.setItem('emotion-diaries-backup', JSON.stringify(formattedDiaries))

      // 대화 데이터 백업
      const conversations = await conversationService.getUserConversations(user.uid)
      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        messages: conv.messages,
        topic: conv.topic,
        title: conv.title,
        createdAt: conv.createdAt?.toDate?.()?.toISOString() || conv.createdAt,
        updatedAt: conv.updatedAt?.toDate?.()?.toISOString() || conv.updatedAt,
      }))
      localStorage.setItem('ai-conversations-backup', JSON.stringify(formattedConversations))

    } catch (error) {
      console.error('데이터 백업 실패:', error)
    }
  }

  // 사용자 로그인 시 자동 동기화
  useEffect(() => {
    if (user && syncStatus === 'idle') {
      syncLocalDataToFirebase()
    }
  }, [user])

  return {
    isSyncing,
    syncStatus,
    syncLocalDataToFirebase,
    backupFirebaseDataToLocal,
  }
}
