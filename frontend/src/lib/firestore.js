import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

// 일기 관련 Firestore 함수들
export const diaryService = {
  // 사용자의 모든 일기 가져오기
  async getUserDiaries(userId) {
    try {
      const diariesRef = collection(db, 'users', userId, 'diaries')
      const q = query(diariesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('일기 목록 가져오기 실패:', error)
      throw error
    }
  },

  // 특정 일기 가져오기
  async getDiary(diaryId) {
    try {
      // 단일 다큐먼트 조회는 사용자 uid가 없으므로 호출부에서 경로를 알 때만 사용
      // 필요 시 getUserDiaries로 리스트 후 필터링 사용
      const diaryRef = doc(db, 'diaries', diaryId)
      const diarySnap = await getDoc(diaryRef)
      
      if (diarySnap.exists()) {
        return { id: diarySnap.id, ...diarySnap.data() }
      } else {
        throw new Error('일기를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('일기 가져오기 실패:', error)
      throw error
    }
  },

  // 새 일기 저장
  async saveDiary(userId, diaryData) {
    try {
      const diariesRef = collection(db, 'users', userId, 'diaries')
      const docRef = await addDoc(diariesRef, {
        emotions: diaryData.emotions,
        content: diaryData.content,
        feedback: diaryData.feedback,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return { id: docRef.id, ...diaryData }
    } catch (error) {
      console.error('일기 저장 실패:', error)
      throw error
    }
  },

  // 일기 수정
  async updateDiary(diaryId, updateData) {
    try {
      // 경로 상 사용자 uid를 모르면 업데이트가 불가하므로 호출부에서 별도 관리 필요
      const diaryRef = doc(db, 'diaries', diaryId)
      await updateDoc(diaryRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      })
      
      return { id: diaryId, ...updateData }
    } catch (error) {
      console.error('일기 수정 실패:', error)
      throw error
    }
  },

  // 일기 삭제
  async deleteDiary(diaryId) {
    try {
      const diaryRef = doc(db, 'diaries', diaryId)
      await deleteDoc(diaryRef)
      return true
    } catch (error) {
      console.error('일기 삭제 실패:', error)
      throw error
    }
  }
}

// 대화 관련 Firestore 함수들
export const conversationService = {
  // 사용자의 모든 대화 가져오기
  async getUserConversations(userId) {
    try {
      const conversationsRef = collection(db, 'users', userId, 'conversations')
      const q = query(conversationsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('대화 목록 가져오기 실패:', error)
      throw error
    }
  },

  // 특정 대화 가져오기
  async getConversation(conversationId) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId)
      const conversationSnap = await getDoc(conversationRef)
      
      if (conversationSnap.exists()) {
        return { id: conversationSnap.id, ...conversationSnap.data() }
      } else {
        throw new Error('대화를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('대화 가져오기 실패:', error)
      throw error
    }
  },

  // 새 대화 저장
  async saveConversation(userId, conversationData) {
    try {
      const conversationsRef = collection(db, 'users', userId, 'conversations')
      const docRef = await addDoc(conversationsRef, {
        messages: conversationData.messages,
        topic: conversationData.topic,
        title: conversationData.title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return { id: docRef.id, ...conversationData }
    } catch (error) {
      console.error('대화 저장 실패:', error)
      throw error
    }
  },

  // 대화 수정 (메시지 추가 등)
  async updateConversation(conversationId, updateData) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId)
      await updateDoc(conversationRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      })
      
      return { id: conversationId, ...updateData }
    } catch (error) {
      console.error('대화 수정 실패:', error)
      throw error
    }
  },

  // 대화 삭제
  async deleteConversation(conversationId) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId)
      await deleteDoc(conversationRef)
      return true
    } catch (error) {
      console.error('대화 삭제 실패:', error)
      throw error
    }
  }
}

// 공유 대화 관련 함수들
export const sharedConversationService = {
  // 공유 대화 저장
  async saveSharedConversation(conversationData) {
    try {
      const sharedRef = collection(db, 'sharedConversations')
      const docRef = await addDoc(sharedRef, {
        messages: conversationData.messages,
        title: conversationData.title,
        createdAt: serverTimestamp()
      })
      
      return { id: docRef.id, ...conversationData }
    } catch (error) {
      console.error('공유 대화 저장 실패:', error)
      throw error
    }
  },

  // 공유 대화 가져오기
  async getSharedConversation(sharedId) {
    try {
      const sharedRef = doc(db, 'sharedConversations', sharedId)
      const sharedSnap = await getDoc(sharedRef)
      
      if (sharedSnap.exists()) {
        return { id: sharedSnap.id, ...sharedSnap.data() }
      } else {
        throw new Error('공유 대화를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('공유 대화 가져오기 실패:', error)
      throw error
    }
  }
}
