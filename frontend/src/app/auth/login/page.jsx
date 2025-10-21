'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2Icon, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { loginWithEmail, loginWithGoogle } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await loginWithEmail(email, password)
      if (result.success) {
        toast.success('로그인에 성공했습니다!')
        router.push('/')
      } else {
        toast.error(result.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      toast.error('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const result = await loginWithGoogle()
      if (result.success) {
        toast.success('구글 로그인에 성공했습니다!')
        router.push('/')
      } else {
        toast.error(result.error || '구글 로그인에 실패했습니다.')
      }
    } catch (error) {
      toast.error('구글 로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-white">
              <div className="h-4 w-4 rounded-sm bg-purple-600"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-purple-600">Support</span>
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Hub
            </span>
          </h1>
        </div>
        <p className="text-gray-600">마음을 나누는 AI 감정공감 대화 플랫폼</p>
      </div>

      {/* Login Form */}
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">로그인</h2>
            <p className="text-gray-600">
              서비스를 이용하려면 로그인이 필요합니다
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="font-medium text-gray-900">
                이메일
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 pl-10 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="font-medium text-gray-900">
                비밀번호
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-gray-300 pl-10 pr-10 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-purple-600 font-medium text-white transition-colors duration-200 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              로그인
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full border-gray-300 transition-colors duration-200 hover:bg-gray-50"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <div className="flex items-center">
              <div className="mr-3 h-5 w-5">
                <svg viewBox="0 0 24 24" className="h-full w-full">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              Google로 로그인
            </div>
          </Button>

          {/* Links */}
          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-purple-600 transition-colors duration-200 hover:text-purple-700"
              >
                회원가입
              </Link>
            </p>
            <p className="text-sm">
              <Link
                href="#"
                className="text-gray-600 transition-colors duration-200 hover:text-gray-700"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
