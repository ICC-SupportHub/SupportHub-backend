'use client'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MapPinIcon,
  SearchIcon,
  PhoneIcon,
  ClockIcon,
  Copy,
  InfoIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { RegionalGroup } from '@/app/emergency-support/data/regional-centers'
import { regionalCenters } from '@/app/emergency-support/data/regional-centers'

// 데이터는 분리된 파일에서 import (전국 17개 시·도 커버)
// 필요 시 해당 파일만 수정하면 됨

export default function RegionalServices() {
  const [searchTerm, setSearchTerm] = useState('')
  const listTopRef = useRef<HTMLDivElement | null>(null)
  const MAX_VISIBLE = 4
  const [expanded, setExpanded] = useState(false)

  const flat = useMemo(() => {
    // region 정보를 각 center에 주입해 평탄화
    return regionalCenters.flatMap((g) =>
      g.centers.map((c) => ({ ...c, region: g.region }))
    )
  }, [])

  const filteredCenters = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return flat
    return flat.filter((c) => {
      const hay = [
        c.region,
        c.name,
        c.phone,
        c.address,
        ...(c.features || []),
        ...(c.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [flat, searchTerm])

  // 검색어가 바뀌면 접은 상태로 초기화
  useEffect(() => {
    setExpanded(false)
  }, [searchTerm])

  const visibleCenters = useMemo(
    () => (expanded ? filteredCenters : filteredCenters.slice(0, MAX_VISIBLE)),
    [filteredCenters, expanded]
  )
  const hiddenCount = Math.max(0, filteredCenters.length - MAX_VISIBLE)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('번호가 복사됐어요')
    } catch {
      toast.error('복사에 실패했어요')
    }
  }

  const handleCall = (phone: string) => {
    if (!phone) return
    window.location.href = `tel:${phone.replaceAll(/[^0-9]/g, '')}`
  }

  return (
    <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
          거주 지역 전문 상담센터
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="안내"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                <InfoIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm leading-relaxed">
              지역별 세부 정보는 기관·지자체 공지에 따라 <b>변동</b>될 수
              있어요. 대표번호(1577-0199/129 등)로 연결해 드립니다.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="지역명, 센터명, 키워드로 검색(예: 서울, 위기, 긴급복지)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="flex-1"
          />
          <Button
            onClick={() => {
              /* 입력 블러만으로도 필터 반영됨 */
            }}
            variant="outline"
          >
            <SearchIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            검색
          </Button>
        </div>

        <div ref={listTopRef} className="grid gap-4 md:grid-cols-2">
          {visibleCenters.map((center, idx) => (
            <div
              key={`${center.region}-${center.name}-${idx}`}
              className="rounded-lg border border-slate-200/50 bg-white/60 p-4 transition-all hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60"
            >
              <div className="mb-2 flex items-center gap-2">
                <MapPinIcon
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  {center.region}
                </h3>
                {center.isNational && (
                  <Badge variant="secondary" className="ml-2">
                    전국대표
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {center.name}
                  </p>
                  <p className="break-all font-mono text-sm text-purple-600">
                    {center.phone}
                  </p>
                  {center.hours && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon
                        className="mr-1 inline h-3 w-3"
                        aria-hidden="true"
                      />
                      {center.hours}
                    </p>
                  )}
                  {center.features?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {center.features.map((f, i) => (
                        <Badge key={i} variant="outline">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
                  <Button size="sm" onClick={() => handleCall(center.phone)}>
                    <PhoneIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    전화하기
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(center.phone)}
                  >
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    복사
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 더보기 / 접기 */}
        {hiddenCount > 0 && !expanded && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setExpanded(true)}
              aria-expanded={expanded}
            >
              더보기 (+{hiddenCount})
            </Button>
          </div>
        )}
        {expanded && filteredCenters.length > MAX_VISIBLE && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setExpanded(false)
                // 접을 때 리스트 상단으로 부드럽게 복귀
                listTopRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
              aria-expanded={expanded}
            >
              접기
            </Button>
          </div>
        )}

        {filteredCenters.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다. 키워드(예: 위기, 긴급복지, 상담) 또는
            지역명(예: 서울/경기/부산…)으로 다시 검색해보세요.
            <div className="mt-3 text-sm">
              또는 대표번호: <span className="font-mono">119</span> /{' '}
              <span className="font-mono">112</span> /{' '}
              <span className="font-mono">1577-0199</span> /{' '}
              <span className="font-mono">129</span> /{' '}
              <span className="font-mono">1366</span> /{' '}
              <span className="font-mono">1388</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
