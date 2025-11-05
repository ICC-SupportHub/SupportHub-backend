'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HomeIcon,
  MessageSquareIcon,
  BookOpenIcon,
  LineChartIcon,
  BrainIcon,
  UsersIcon,
  PhoneIcon,
  PlusIcon,
  ChevronLeftIcon,
  SettingsIcon,
  LogOutIcon,
} from 'lucide-react'
import { useIsMobile } from '@/components/ui/use-mobile'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiChat } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'

export function SidebarNav({ onCollapseChange, isMobileOpen, onMobileClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const { user, logout } = useAuth()

  /** ✅ 사이드바 접기 */
  const handleCollapseToggle = () => {
    if (isMobile) {
      onMobileClose?.()
    } else {
      const newCollapsed = !isCollapsed
      setIsCollapsed(newCollapsed)
      onCollapseChange?.(newCollapsed)
    }
  }

  /** ✅ 로그아웃 */
  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
      router.push('/auth/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  /** ✅ “새 채팅” 버튼 클릭 시 */
  const handleNewChat = async () => {
    try {
      // 기존 대화 모두 삭제
      await apiChat.resetConversations()
      localStorage.removeItem('supporthub_cid')

      toast({
        title: '새 대화 시작 🎉',
        description: '기존 대화가 모두 삭제되었어요.',
      })

      // ✅ ai-chat 페이지로 이동 (매번 고유한 쿼리로 완전 리셋)
      const newParam = `?new=${Date.now()}`
      if (pathname.startsWith('/ai-chat')) {
        router.replace(`/ai-chat${newParam}`)
      } else {
        router.push(`/ai-chat${newParam}`)
      }

      if (isMobile) onMobileClose?.()
    } catch (err) {
      console.error('새 대화 초기화 실패:', err)
      toast({
        title: '삭제 실패',
        description: '대화 초기화 중 오류가 발생했어요.',
        variant: 'destructive',
      })
    }
  }

  /** ✅ 드롭다운 외부 클릭 시 닫기 */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  /** ✅ 네비게이션 아이템 */
  const navItems = [
    { title: '홈', href: '/', icon: HomeIcon },
    { title: 'AI 대화', href: '/ai-chat', icon: MessageSquareIcon },
    { title: '감정 일기', href: '/emotion-diary', icon: BookOpenIcon },
    { title: '감정 통계', href: '/emotion-stats', icon: LineChartIcon },
    { title: '대화 주제', href: '/conversation-topics', icon: BrainIcon },
    { title: '커뮤니티', href: '/anonymous-community', icon: UsersIcon },
    { title: '긴급 지원', href: '/emergency-support', icon: PhoneIcon },
  ]

  return (
    <>
      {/* ✅ 모바일 오버레이 */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      {/* ✅ 사이드바 본체 */}
      <div
        className={cn(
          'relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300',
          isMobile
            ? 'fixed left-0 top-0 z-40 h-screen w-72 transform shadow-2xl transition-transform duration-300'
            : isCollapsed
              ? 'w-16'
              : 'w-64',
          isMobile && !isMobileOpen && '-translate-x-full'
        )}
      >
        {/* ✅ 헤더 */}
        <div className="p-4">
          <div className="mb-6 flex items-center gap-2">
            <div
              className="group flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 transition-transform duration-200 hover:scale-110"
              onClick={handleCollapseToggle}
            >
              <span className="text-sm font-bold text-white group-hover:hidden">
                S
              </span>
              <ChevronLeftIcon
                className={cn(
                  'hidden h-4 w-4 text-white transition-transform duration-200 group-hover:block',
                  isCollapsed ? 'rotate-180' : ''
                )}
              />
            </div>

            {!isCollapsed && (
              <Link href="/">
                <span className="cursor-pointer align-middle text-lg font-semibold leading-none text-gray-900 hover:text-gray-700">
                  SupportHub
                </span>
              </Link>
            )}
          </div>

          {!isCollapsed && (
            <p className="mb-4 mt-2 px-1 text-xs leading-relaxed text-gray-500">
              마음을 나누는 AI 감정공감 대화 플랫폼
            </p>
          )}

          {/* ✅ 새 채팅 버튼 */}
          <Button
            onClick={handleNewChat}
            className={cn(
              'h-9 border border-gray-200 bg-gray-50 font-medium text-gray-700 hover:bg-gray-100',
              isCollapsed
                ? 'h-8 w-8 justify-center p-0'
                : 'w-full justify-start px-3'
            )}
          >
            <div className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">새 채팅</span>}
            </div>
          </Button>
        </div>

        {/* ✅ 구분선 */}
        <div className="mx-2 my-2 h-0.5 bg-gray-100" />

        {/* ✅ 네비게이션 */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && onMobileClose?.()}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'h-9 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      isCollapsed
                        ? 'h-8 w-8 justify-center p-0'
                        : 'w-full justify-start px-3',
                      isActive && 'bg-gray-100 text-gray-900'
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate text-left">{item.title}</span>
                      )}
                    </div>
                  </Button>
                </Link>
              )
            })}
          </div>
        </ScrollArea>

        {/* ✅ 사용자 메뉴 (하단) */}
        <div
          className="relative border-t border-gray-200 p-4"
          ref={userMenuRef}
        >
          {user ? (
            <>
              <div
                className={cn(
                  'flex cursor-pointer items-center rounded-lg p-2 hover:bg-gray-50',
                  isCollapsed ? 'justify-center' : 'gap-3'
                )}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="프로필"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {user.displayName || user.email || '사용자'}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                )}
              </div>

              {showUserMenu && (
                <div className="absolute bottom-full left-4 z-50 mb-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="py-1">
                    <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <SettingsIcon className="h-4 w-4" />
                      설정
                    </button>
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={handleLogout}
                    >
                      <LogOutIcon className="h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => isMobile && onMobileClose?.()}
            >
              <div
                className={cn(
                  'flex cursor-pointer items-center rounded-lg p-2 hover:bg-gray-50',
                  isCollapsed ? 'justify-center' : 'gap-3'
                )}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <UsersIcon className="h-4 w-4 text-gray-600" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      로그인
                    </div>
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
