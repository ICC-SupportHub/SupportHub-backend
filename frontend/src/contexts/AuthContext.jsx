'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 이메일로 로그인
  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 이메일로 회원가입
  const signupWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // 사용자 프로필 업데이트
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }

      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 구글 로그인
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setLoading(false)

        // localStorage에 사용자 정보 저장
        if (user) {
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }
          localStorage.setItem('sh_user', JSON.stringify(userData))
        } else {
          localStorage.removeItem('sh_user')
        }
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Firebase auth error:', error)
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    loading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
