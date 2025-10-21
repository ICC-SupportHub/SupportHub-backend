'use client'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  PhoneIcon,
  MessageSquareIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  UsersIcon,
  HeartIcon,
  HelpCircleIcon,
  RefreshCwIcon,
  Copy,
  InfoIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { useEffect, useState, useRef } from 'react'
import EmergencyFlowchart from '@/app/emergency-support/components/emergency-flowchart'
import FAQSection from '@/app/emergency-support/components/faq-section'
import SpecializedServices from '@/app/emergency-support/components/specialized-services'
import BreathingExercise from '@/app/emergency-support/components/breathing-exercise'
import RegionalServices from '@/app/emergency-support/components/regional-services'

const EmergencyPage = () => {
  const [animalStates, setAnimalStates] = useState({
    cat: { showImage: false, imageUrl: '', loading: false },
    dog: { showImage: false, imageUrl: '', loading: false },
  })
  const [isVisible, setIsVisible] = useState(false)
  const [breathingOpen, setBreathingOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('emergency')
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 })
  const tabRefs = useRef({})

  const copyNumber = async (n) => {
    try {
      await navigator.clipboard.writeText(n)
      toast.success('번호가 복사됐어요')
    } catch {
      toast.error('복사에 실패했어요')
    }
  }

  const emergencyContacts = [
    {
      name: '청소년전화 1388',
      number: '1388',
      description:
        '청소년 관련 고민/도움 365일 24시간. 문자(#1388)\n카카오톡(#1388)도 가능',
      type: '전화',
    },
    {
      name: '청소년 사이버상담센터',
      number: 'www.cyber1388.kr',
      description: '익명 채팅 상담 가능 (24시간)',
      type: '온라인',
    },
    {
      name: '정신건강 상담전화',
      number: '1577-0199',
      description: '정신 건강 및 위기 상담 24시간 (전국, 지역번호 없이)',
      type: '전화',
    },
    {
      name: '보건복지상담센터',
      number: '129',
      description: '긴급복지, 복지사각지대, 학대 관련 상담 24시간',
      type: '전화',
    },
    {
      name: '자살예방 상담전화',
      number: '109',
      description: '자살 관련 상담 24시간',
      type: '전화',
    },
    {
      name: '생명의전화',
      number: '1588-9191',
      description: '자살 예방 상담 24시간',
      type: '전화',
    },
  ]

  const selfCareResources = [
    {
      title: '호흡 운동',
      description: '4-7-8 호흡법으로 마음을 진정시켜보세요',
      action: '지금 시작하기',
      detail:
        '4초 동안 숨을 들이마시고, 7초 동안 참은 후, 8초 동안 천천히 내쉬세요. 이를 4회 반복합니다.',
      type: 'breath',
    },
    {
      title: '긍정적 생각',
      description: '지금 이 순간 감사한 것 3가지를 떠올려보세요',
      action: '생각해보기',
      detail:
        '작은 것이라도 좋습니다. 따뜻한 차 한 잔, 편안한 침대, 나를 걱정해주는 사람 등을 떠올려보세요.',
    },
    {
      title: '안전한 장소',
      description:
        '신뢰할 수 있는 사람에게 연락하거나 안전한 곳으로 이동하세요',
      action: '도움 요청하기',
      detail:
        '가족, 친구, 동료 중 믿을 수 있는 사람에게 연락하거나, 공공장소나 병원 등 안전한 곳으로 이동하세요.',
    },
    {
      title: '🐱 귀여운 고양이 보기',
      description: '사랑스러운 고양이 사진으로 마음을 달래보세요',
      action: '고양이 보기',
      detail: '랜덤한 고양이 사진으로 마음을 편안하게 해보세요!',
      type: 'cat',
    },
    {
      title: '🐶 귀여운 강아지 보기',
      description: '사랑스러운 강아지 사진으로 마음을 따뜻하게 하세요',
      action: '강아지 보기',
      detail: '랜덤한 강아지 사진으로 마음을 따뜻하게 해보세요!',
      type: 'dog',
    },
    {
      title: '5-4-3-2-1 기법',
      description: '현재 순간에 집중하여 불안감을 줄여보세요',
      action: '시작하기',
      detail:
        '보이는 것 5개, 만질 수 있는 것 4개, 들리는 것 3개, 냄새나는 것 2개, 맛보는 것 1개를 찾아보세요.',
    },
    {
      title: '따뜻한 샤워',
      description: '따뜻한 물로 몸과 마음을 이완시켜보세요',
      action: '시도해보기',
      detail:
        '따뜻한 물의 온도와 감촉에 집중하며 긴장을 풀어보세요. 10-15분 정도가 적당합니다.',
    },
    {
      title: '음악 듣기',
      description: '좋아하는 음악이나 자연 소리를 들어보세요',
      action: '음악 재생',
      detail:
        '클래식, 자연 소리, 좋아하는 노래 등 마음을 편안하게 해주는 음악을 선택하세요.',
    },
  ]

  // 고양이 이미지 가져오기 함수
  const fetchCatImage = async (apiType) => {
    setAnimalStates((prev) => ({
      ...prev,
      cat: { ...prev.cat, loading: true, selectedApi: apiType },
    }))

    try {
      const timestamp = Date.now()
      let catUrl = ''

      switch (apiType) {
        case 'cataas':
          catUrl = `https://cataas.com/cat?${timestamp}`
          break
        case 'thecat':
          try {
            const response = await fetch(
              'https://api.thecatapi.com/v1/images/search'
            )
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            if (data && data[0] && data[0].url) {
              catUrl = data[0].url
            } else {
              throw new Error('The Cat API 응답 오류')
            }
          } catch (error) {
            catUrl = `https://cataas.com/cat?${timestamp}`
          }
          break
        case 'randomcat':
          try {
            const response = await fetch(
              `https://api.thecatapi.com/v1/images/search?limit=1&${timestamp}`
            )
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            if (data && data[0] && data[0].url) {
              catUrl = data[0].url
            } else {
              throw new Error('Random Cat API 응답 오류')
            }
          } catch (error) {
            catUrl = `https://cataas.com/cat?${timestamp}`
          }
          break
        default:
          catUrl = `https://cataas.com/cat?${timestamp}`
      }

      if (catUrl.startsWith('http')) {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          setAnimalStates((prev) => ({
            ...prev,
            cat: {
              showImage: true,
              imageUrl: catUrl,
              loading: false,
              selectedApi: apiType,
            },
          }))
        }

        img.onerror = () => {
          setAnimalStates((prev) => ({
            ...prev,
            cat: {
              showImage: true,
              imageUrl: `https://cataas.com/cat?${Date.now()}`,
              loading: false,
              selectedApi: apiType,
            },
          }))
        }

        img.src = catUrl
      } else {
        setAnimalStates((prev) => ({
          ...prev,
          cat: {
            showImage: true,
            imageUrl: catUrl,
            loading: false,
            selectedApi: apiType,
          },
        }))
      }
    } catch (error) {
      setAnimalStates((prev) => ({
        ...prev,
        cat: {
          showImage: true,
          imageUrl: `https://cataas.com/cat?${Date.now()}`,
          loading: false,
          selectedApi: apiType,
        },
      }))
    }
  }

  // 강아지 이미지 가져오기 함수
  const fetchDogImage = async (apiType) => {
    setAnimalStates((prev) => ({
      ...prev,
      dog: { ...prev.dog, loading: true, selectedApi: apiType },
    }))

    try {
      let dogUrl = ''

      switch (apiType) {
        case 'dogceo':
          try {
            const response = await fetch(
              'https://dog.ceo/api/breeds/image/random'
            )
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            if (data && data.status === 'success' && data.message) {
              dogUrl = data.message
            } else {
              throw new Error('Dog CEO API 응답 오류')
            }
          } catch (error) {
            throw error
          }
          break

        case 'dogfacts':
          try {
            const response = await fetch(
              'https://some-random-api.com/animal/dog'
            )
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            if (data && data.image) {
              dogUrl = data.image
            } else {
              throw new Error('Dog Facts API 응답 오류')
            }
          } catch (error) {
            const fallbackResponse = await fetch(
              'https://dog.ceo/api/breeds/image/random'
            )
            const fallbackData = await fallbackResponse.json()
            dogUrl = fallbackData.message
          }
          break

        case 'shibe':
          try {
            const response = await fetch(
              'https://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true'
            )
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            if (data && Array.isArray(data) && data.length > 0) {
              dogUrl = data[0]
            } else {
              throw new Error('Shibe API 응답 오류')
            }
          } catch (error) {
            const fallbackResponse = await fetch(
              'https://dog.ceo/api/breeds/image/random'
            )
            const fallbackData = await fallbackResponse.json()
            dogUrl = fallbackData.message
          }
          break

        case 'randomdog':
          try {
            const apiOptions = [
              {
                url: 'https://random.dog/woof.json',
                handler: async (response) => {
                  const data = await response.json()
                  if (
                    data &&
                    data.url &&
                    !data.url.includes('.mp4') &&
                    !data.url.includes('.webm')
                  ) {
                    return data.url
                  }
                  throw new Error('비디오 파일이거나 응답 오류')
                },
              },
              {
                url: 'https://dog-api.kinduff.com/api/facts',
                handler: async (response) => {
                  throw new Error('Facts API는 이미지 미제공')
                },
              },
              {
                url: 'https://api.woofbot.io/v1/woof',
                handler: async (response) => {
                  const data = await response.json()
                  if (data && data.image) {
                    return data.image
                  }
                  throw new Error('WoofBot API 응답 오류')
                },
              },
            ]

            let success = false
            for (const option of apiOptions) {
              try {
                const response = await fetch(option.url)
                if (!response.ok) continue
                dogUrl = await option.handler(response)
                success = true
                break
              } catch (optionError) {
                continue
              }
            }

            if (!success) {
              throw new Error('모든 Random Dog API 옵션 실패')
            }
          } catch (error) {
            const fallbackResponse = await fetch(
              'https://dog.ceo/api/breeds/image/random'
            )
            const fallbackData = await fallbackResponse.json()
            dogUrl = fallbackData.message
          }
          break

        default:
          const response = await fetch(
            'https://dog.ceo/api/breeds/image/random'
          )
          const data = await response.json()
          dogUrl = data.message
      }

      setAnimalStates((prev) => ({
        ...prev,
        dog: {
          showImage: true,
          imageUrl: dogUrl,
          loading: false,
          selectedApi: apiType,
        },
      }))
    } catch (error) {
      try {
        const fallbackResponse = await fetch(
          'https://dog.ceo/api/breeds/image/random'
        )
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setAnimalStates((prev) => ({
            ...prev,
            dog: {
              showImage: true,
              imageUrl:
                fallbackData.message ||
                '/placeholder.svg?height=300&width=400&text=🐶 강아지 로드 실패',
              loading: false,
              selectedApi: apiType,
            },
          }))
        } else {
          throw new Error('최종 fallback도 실패')
        }
      } catch (finalError) {
        setAnimalStates((prev) => ({
          ...prev,
          dog: {
            showImage: true,
            imageUrl:
              '/placeholder.svg?height=300&width=400&text=🐶 모든 API 실패',
            loading: false,
            selectedApi: apiType,
          },
        }))
      }
    }
  }

  const tabs = [
    { id: 'emergency', name: '긴급 상황', icon: AlertTriangleIcon },
    { id: 'professional', name: '전문 상담', icon: UsersIcon },
    { id: 'selfcare', name: '자가 관리', icon: HeartIcon },
    { id: 'help', name: '도움말', icon: HelpCircleIcon },
  ]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab]
    if (activeTabElement) {
      const { offsetWidth, offsetLeft } = activeTabElement
      setIndicatorStyle({
        width: offsetWidth,
        left: offsetLeft,
      })
    }
  }, [activeTab])

  const handleCall = (number) => {
    if (number.startsWith('www')) {
      window.open(`https://${number}`, '_blank')
    } else {
      window.open(`tel:${number}`)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-auto bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 p-3 dark:from-slate-900 dark:via-red-900 dark:to-pink-900 md:p-4">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=1080&width=1920')`,
          }}
        />
      </div>

      {/* 부드러운 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20 dark:from-slate-900/50 dark:via-transparent dark:to-slate-900/30" />

      <div
        className={`relative z-10 mx-auto w-full max-w-5xl space-y-4 transition-all duration-1000 ease-out md:space-y-6 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* 헤더 */}
        <Card className="rounded-lg shadow-lg">
          <CardHeader className="rounded-t-lg bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-4 text-white shadow-lg md:p-6">
            <CardTitle className="flex items-center justify-center gap-2 text-center text-2xl font-bold md:text-3xl">
              <AlertTriangleIcon
                className="h-6 w-6 md:h-8 md:w-8"
                aria-hidden="true"
              />
              긴급 심리지원
            </CardTitle>
            <p className="mt-2 text-center text-sm text-red-100 md:text-base">
              위기 상황에서 즉시 도움을 받을 수 있는 연락처와 자가 관리 방법을
              제공합니다
            </p>
          </CardHeader>
        </Card>

        {/* 응급상황 알림 (아이콘을 문장과 같은 줄에 표시) */}
        <Alert className="border-red-200 bg-red-50/80 shadow-sm backdrop-blur-sm dark:bg-red-950/50">
          <AlertDescription className="m-0 flex items-center gap-2 text-sm text-red-800 dark:text-red-200 md:text-base">
            <AlertTriangleIcon
              className="h-4 w-4 shrink-0 text-red-600 md:h-5 md:w-5"
              aria-hidden="true"
            />
            <span>
              <strong>응급상황 시:</strong> 생명이 위험하다고 느끼시면 즉시
              119에 신고하거나 가까운 응급실로 가세요.
            </span>
          </AlertDescription>
        </Alert>

        {/* 탭 메뉴 */}
        <Card className="overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
          {/* 현대적인 웹 스타일 탭 네비게이션 */}
          <div className="relative border-b border-gray-200 dark:border-gray-700">
            <nav
              className="scrollbar-hide relative -mb-px flex overflow-x-auto"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative min-w-0 flex-1 overflow-hidden px-2 py-3 text-center text-xs font-medium transition-all duration-200 focus:z-10 focus:outline-none md:px-4 md:py-4 md:text-sm ${
                    activeTab === tab.id
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <div className="flex flex-col items-center justify-center gap-1 md:flex-row md:gap-2">
                    <tab.icon
                      className={`h-4 w-4 transition-colors duration-200 md:h-5 md:w-5 ${
                        activeTab === tab.id
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap text-[10px] transition-colors duration-200 md:text-sm">
                      {tab.name}
                    </span>
                  </div>
                </button>
              ))}

              {/* 슬라이딩 인디케이터 */}
              <div
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-300 ease-out"
                style={{
                  width: `${indicatorStyle.width}px`,
                  transform: `translateX(${indicatorStyle.left}px)`,
                }}
              />
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-4 md:p-6">
            {/* 긴급 상황 탭 */}
            {activeTab === 'emergency' && (
              <div className="animate-fadeIn space-y-6">
                <EmergencyFlowchart />

                <Card className="border-0 bg-white/60 shadow-md backdrop-blur-sm dark:bg-slate-800/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      24시간 상담 연락처
                    </CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="법적·의료 안내"
                            className="inline-flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                          >
                            <InfoIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm leading-relaxed">
                          <p className="mb-1 font-semibold">
                            안내(정보 제공 목적)
                          </p>
                          <ul className="list-disc space-y-1 pl-4">
                            <li>
                              본 콘텐츠는 의료·법률적 진단이나 응급 대응을{' '}
                              <b>대체하지 않아요</b>.
                            </li>
                            <li>
                              생명·신체의 급박한 위험 시 <b>즉시 119</b>, 범죄가
                              의심되면 <b>112</b>.
                            </li>
                            <li>
                              상담 중 위치/개인정보 공유는{' '}
                              <b>본인 판단 하에 최소화</b>하세요.
                            </li>
                            <li>
                              운영시간·대기시간은 기관/지역 사정으로 <b>변동</b>
                              될 수 있어요.
                            </li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {emergencyContacts.map((contact, index) => (
                      <div
                        key={index}
                        className="flex transform flex-col gap-3 rounded-lg border border-slate-200/50 bg-gradient-to-r from-slate-50 to-white p-4 transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-md dark:border-slate-700/50 dark:from-slate-800/60 dark:to-slate-800/30 md:flex-row md:items-center md:justify-between md:hover:scale-[1.02]"
                      >
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 md:text-lg">
                            {contact.name}
                          </h3>
                          <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400 md:text-base">
                            {contact.description}
                          </p>
                          <p className="font-mono text-sm text-purple-600">
                            {contact.number}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row md:ml-4">
                          <Button
                            onClick={() => handleCall(contact.number)}
                            className="transform bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-red-600 hover:to-rose-600 hover:shadow-lg"
                          >
                            {contact.type === '전화' ? (
                              <PhoneIcon
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <ExternalLinkIcon
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                            )}
                            {contact.type === '전화' ? '전화하기' : '접속하기'}
                          </Button>
                          <Button
                            onClick={() => copyNumber(contact.number)}
                            variant="outline"
                          >
                            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                            복사
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* 번호 출처 각주 */}
                    <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:underline"
                            aria-label="번호 출처 안내"
                          >
                            <InfoIcon className="h-4 w-4" aria-hidden="true" />
                            출처 보기
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm leading-relaxed">
                          <p className="mb-2 font-semibold">주요 번호(요약)</p>
                          <ul className="space-y-1">
                            <li>
                              <b>119</b> — 화재·구급·구조 긴급신고
                            </li>
                            <li>
                              <b>112</b> — 범죄 긴급신고
                            </li>
                            <li>
                              <b>1577-0199</b> — 정신건강 <b>위기상담전화</b>{' '}
                              (24시간)
                            </li>
                            <li>
                              <b>129</b> — <b>보건복지상담센터</b>{' '}
                              (긴급복지/학대/복지사각)
                            </li>
                            <li>
                              <b>1366</b> — <b>여성긴급전화</b> (24시간)
                            </li>
                            <li>
                              <b>1388</b> — <b>청소년상담전화</b> / #1388 문자
                            </li>
                          </ul>
                          <p className="mt-2 text-[11px] text-slate-500">
                            안내는 요약이며, 상세 기준·운영은 기관 공지에
                            따릅니다.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 전문 상담 탭 */}
            {activeTab === 'professional' && (
              <div className="animate-fadeIn space-y-6">
                <SpecializedServices />
                <RegionalServices />
              </div>
            )}

            {/* 자가 관리 탭 */}
            {activeTab === 'selfcare' && (
              <div className="animate-fadeIn space-y-6">
                <Card className="border-0 bg-white/60 shadow-md backdrop-blur-sm dark:bg-slate-800/60">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      즉시 할 수 있는 자가 관리
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      혼자서도 할 수 있는 마음 돌봄 방법들을 안내해드립니다.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selfCareResources.map((resource, index) => (
                      <div
                        key={index}
                        className={`transform rounded-lg border border-slate-200/50 p-4 transition-all duration-300 ease-in-out hover:scale-[1.01] hover:bg-gradient-to-r hover:from-red-50/50 hover:to-rose-50/50 hover:shadow-md dark:border-slate-600/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 md:hover:scale-[1.02] ${
                          resource.type === 'breath' && breathingOpen
                            ? 'bg-gradient-to-r from-red-50/60 to-rose-50/60 ring-1 ring-rose-200/50 dark:from-slate-700/60 dark:to-slate-600/60'
                            : ''
                        }`}
                      >
                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-200 md:text-lg">
                              {resource.title}
                            </h3>
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400 md:text-base">
                              {resource.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {resource.detail}
                            </p>
                          </div>
                          {!resource.apis && (
                            <Button
                              onClick={() => {
                                if (resource.type === 'breath') {
                                  setBreathingOpen((v) => !v)
                                } else if (resource.type === 'cat') {
                                  fetchCatImage('randomcat')
                                } else if (resource.type === 'dog') {
                                  fetchDogImage('randomdog')
                                }
                              }}
                              disabled={
                                resource.type &&
                                animalStates[resource.type]?.loading
                              }
                              variant="outline"
                              className="w-full transform border-red-300 bg-transparent text-red-600 transition-all duration-300 hover:scale-105 hover:border-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 md:ml-4 md:w-auto"
                            >
                              {resource.type &&
                              animalStates[resource.type]?.loading ? (
                                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {resource.action}
                            </Button>
                          )}
                        </div>

                        {/* 호흡 운동 인라인 렌더링 */}
                        {resource.type === 'breath' && (
                          <div className="overflow-visible">
                            <BreathingExercise
                              inline
                              open={breathingOpen}
                              onOpenChange={setBreathingOpen}
                            />
                          </div>
                        )}

                        {/* 동물 이미지 표시 영역 */}
                        {resource.type &&
                          animalStates[resource.type]?.showImage &&
                          animalStates[resource.type]?.imageUrl && (
                            <div className="animate-fadeIn mt-4 text-center">
                              <div className="relative inline-block overflow-hidden rounded-lg shadow-lg">
                                <img
                                  src={
                                    animalStates[resource.type]?.imageUrl ||
                                    '/placeholder.svg'
                                  }
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg'
                                  }}
                                  alt={
                                    resource.type === 'cat'
                                      ? '귀여운 고양이'
                                      : '귀여운 강아지'
                                  }
                                  className="h-auto max-h-[80vh] w-auto max-w-full rounded-lg object-contain transition-all duration-500"
                                  crossOrigin="anonymous"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/10 to-transparent"></div>
                              </div>
                              <div className="mt-3 flex justify-center gap-2">
                                <Button
                                  onClick={() =>
                                    resource.type === 'cat'
                                      ? fetchCatImage(
                                          animalStates[resource.type]
                                            ?.selectedApi || 'cataas'
                                        )
                                      : fetchDogImage(
                                          animalStates[resource.type]
                                            ?.selectedApi || 'dogceo'
                                        )
                                  }
                                  disabled={
                                    animalStates[resource.type]?.loading ||
                                    false
                                  }
                                  size="sm"
                                  className={`$${
                                    resource.type === 'cat'
                                      ? 'bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500'
                                      : 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500'
                                  } text-white disabled:opacity-50`}
                                >
                                  {animalStates[resource.type]?.loading ? (
                                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  새로운{' '}
                                  {resource.type === 'cat'
                                    ? '고양이'
                                    : '강아지'}{' '}
                                  보기 {resource.type === 'cat' ? '🐾' : '🐕'}
                                </Button>
                                <Button
                                  onClick={() =>
                                    setAnimalStates((prev) => ({
                                      ...prev,
                                      [resource.type || '']: {
                                        ...prev[resource.type || ''],
                                        showImage: false,
                                      },
                                    }))
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                                >
                                  숨기기
                                </Button>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 도움말 탭 */}
            {activeTab === 'help' && (
              <div className="animate-fadeIn space-y-6">
                <FAQSection />
              </div>
            )}
          </div>
        </Card>

        {/* 하단 메시지 */}
        <Card className="border-0 bg-gradient-to-br from-red-100/80 via-rose-100/80 to-pink-100/80 shadow-lg backdrop-blur-sm dark:from-red-900/50 dark:via-rose-900/50 dark:to-pink-900/50">
          <CardContent className="p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
              혼자가 아닙니다
            </h3>
            <p className="mb-4 text-red-700 dark:text-red-300">
              어려운 시간을 보내고 계시지만, 도움을 받을 수 있는 방법이
              있습니다. 전문가들이 당신을 도울 준비가 되어 있습니다.
            </p>
            <Link href="/ai-chat">
              <Button className="transform bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-red-600 hover:to-pink-600 hover:shadow-lg">
                <MessageSquareIcon
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                AI와 대화하기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 하단 여백 추가 */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}

export default EmergencyPage
