'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiAuth } from '@/lib/api'

/**
 * AuthContext
 * - 백엔드 JWT 기반 로그인/회원가입 연동
 * - accessToken은 localStorage('sh_token')에 저장
 * - /api/auth/me 로 유저정보 동기화
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // localStorage → 메모리 로드 & me() 동기화
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('sh_token') : null
    setToken(t)
  }, [])

  useEffect(() => {
    const sync = async () => {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const me = await apiAuth.me() // api.js가 Authorization 헤더를 자동 주입해야 함
        setUser(me)
      } catch {
        // 토큰 만료/오류 시 정리
        localStorage.removeItem('sh_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    sync()
  }, [token])

  const signupWithEmail = async (email, password, nickname) => {
    try {
      const res = await apiAuth.register({ email, password, nickname })
      // 응답: {accessToken, tokenType, userId, email, nickname, role}
      const t = res?.accessToken
      if (t) {
        localStorage.setItem('sh_token', t)
        setToken(t)
        setUser({ id: res.userId, email: res.email, nickname: res.nickname, role: res.role })
        return { success: true, data: res }
      }
      return { success: false, error: '토큰이 없습니다.' }
    } catch (e) {
      return { success: false, error: e?.message || '회원가입 실패' }
    }
  }

  const loginWithEmail = async (email, password) => {
    try {
      const res = await apiAuth.login({ email, password })
      const t = res?.accessToken
      if (t) {
        localStorage.setItem('sh_token', t)
        setToken(t)
        setUser({ id: res.userId, email: res.email, nickname: res.nickname, role: res.role })
        return { success: true, data: res }
      }
      return { success: false, error: '토큰이 없습니다.' }
    } catch (e) {
      return { success: false, error: e?.message || '로그인 실패' }
    }
  }

  // 아직 구현 안 했으면 일단 실패 반환
  const loginWithGoogle = async () => {
    return { success: false, error: '구글 로그인은 아직 준비 중입니다.' }
  }

  const logout = async () => {
    try {
      // 서버에 세션이 없으니 로컬만 정리
      localStorage.removeItem('sh_token')
      setToken(null)
      setUser(null)
      // 필요하면 apiAuth.logout() 호출 (백엔드 라우트 준비된 경우)
    } catch {
      // noop
    }
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signupWithEmail,
      loginWithEmail,
      loginWithGoogle,
      logout,
    }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
