'use client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  PhoneIcon,
  ExternalLinkIcon,
  UsersIcon,
  HeartIcon,
  ShieldIcon,
  BabyIcon,
  Copy,
  InfoIcon,
} from 'lucide-react'
import { toast } from 'sonner'

const specializedServices = [
  {
    category: '자살 예방/정신건강',
    icon: HeartIcon,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    services: [
      {
        name: '자살예방 상담전화',
        number: '109',
        description: '자살 관련 상담 24시간',
        features: ['24시간 운영', '전문 상담사'],
      },
      {
        name: '생명의전화',
        number: '1588-9191',
        description: '자살 예방 전문 상담 24시간',
        features: ['24시간 운영', '익명 보장', '위기 개입'],
      },
      {
        name: '정신건강 상담전화',
        number: '1577-0199',
        description: '정신 건강 및 위기 상담 24시간 (전국, 지역번호 없이)',
        features: ['24시간 운영', '의료진 연계', '응급 개입'],
      },
    ],
  },
  {
    category: '청소년 위기',
    icon: BabyIcon,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    services: [
      {
        name: '청소년전화',
        number: '1388',
        description:
          '청소년 관련 고민/도움 365일 24시간. 문자(#1388)\n카카오톡(#1388)도 가능',
        features: [
          '24시간 운영',
          '청소년 전문',
          '문자 #1388',
          '카카오톡 #1388',
        ],
      },
      {
        name: '청소년 사이버상담센터',
        number: 'www.cyber1388.kr',
        description: '익명 채팅 상담 (24시간)',
        features: ['온라인 상담', '익명 채팅', '청소년 특화'],
        isWebsite: true,
      },
    ],
  },
  {
    category: '복지/학대/긴급복지',
    icon: ShieldIcon,
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    services: [
      {
        name: '보건복지상담센터',
        number: '129',
        description: '긴급복지, 복지사각지대, 학대 관련 상담 24시간',
        features: ['24시간 운영', '복지 지원', '학대 신고'],
      },
    ],
  },
  {
    category: '성폭력/가정폭력',
    icon: ShieldIcon,
    color:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    services: [
      {
        name: '성폭력상담소',
        number: '1366',
        description: '성폭력 피해자 전문 상담',
        features: ['24시간 운영', '법률 지원', '의료 연계'],
      },
      {
        name: '가정폭력상담소',
        number: '1366',
        description: '가정폭력 피해자 보호 및 상담',
        features: ['24시간 운영', '쉼터 연계', '법률 지원'],
      },
    ],
  },
]

export default function SpecializedServices() {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('번호가 복사됐어요')
    } catch {
      toast.error('복사에 실패했어요')
    }
  }

  const handleCall = (number: string, isWebsite?: boolean) => {
    if (isWebsite || number.startsWith('www')) {
      window.open(`https://${number}`, '_blank')
    } else {
      window.open(`tel:${number}`)
    }
  }

  return (
    <Card className="border-0 bg-white/60 shadow-md backdrop-blur-sm dark:bg-slate-800/60">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
          전문 상담/지원 기관
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="법적·의료 안내"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                <InfoIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm leading-relaxed">
              <p className="mb-1 font-semibold">안내(정보 제공 목적)</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  본 콘텐츠는 <b>의료·법률 자문을 대체하지 않아요</b>.
                </li>
                <li>
                  급박한 위험은 <b>119/112</b>를 먼저 이용하세요.
                </li>
                <li>개인정보·위치 공유는 최소화하고, 기관 안내를 따르세요.</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-6">
        {specializedServices.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {category.category}
              </h3>
            </div>
            <div className="space-y-4">
              {category.services.map((service, serviceIndex) => (
                <div
                  key={serviceIndex}
                  className="flex transform flex-col gap-3 rounded-lg border border-slate-200/50 bg-gradient-to-r from-slate-50 to-white p-4 transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-md dark:border-slate-700/50 dark:from-slate-800/60 dark:to-slate-800/30 md:flex-row md:items-center md:justify-between md:hover:scale-[1.02]"
                >
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 md:text-lg">
                      {service.name}
                    </h4>
                    <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400 md:text-base">
                      {service.description}
                    </p>
                    <p className="font-mono text-sm text-purple-600">
                      {service.number}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row md:ml-4">
                    <Button
                      onClick={() =>
                        handleCall(service.number, service.isWebsite)
                      }
                      className="transform bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-red-600 hover:to-rose-600 hover:shadow-lg"
                    >
                      {service.isWebsite ? (
                        <ExternalLinkIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <PhoneIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      )}
                      {service.isWebsite ? '접속하기' : '전화하기'}
                    </Button>
                    <Button
                      onClick={() => copy(service.number)}
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                      복사
                    </Button>
                  </div>
                </div>
              ))}
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
              <ul className="space-y-1">
                <li>
                  <b>1577-0199</b> — 정신건강 <b>위기상담전화</b> (24시간)
                </li>
                <li>
                  <b>129</b> — <b>보건복지상담센터</b> (긴급복지/학대/복지사각)
                </li>
                <li>
                  <b>1366</b> — <b>여성긴급전화</b> (24시간)
                </li>
                <li>
                  <b>1388</b> — <b>청소년상담전화</b> / #1388 문자
                </li>
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">
                상세 기준·운영은 기관 공지를 따릅니다.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  )
}
