'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { apiDiary } from '@/lib/api'
import {
  TrendingUpIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon,
} from 'lucide-react'

// 5개 감정만 집계
const emotionColors: Record<string, string> = {
  happy: '#10B981',   // green
  sad: '#3B82F6',     // blue
  angry: '#EF4444',   // red
  anxious: '#F59E0B', // amber
  neutral: '#6B7280', // gray
}

const emotionLabels: Record<string, string> = {
  happy: '기쁨',
  sad: '슬픔',
  angry: '화남',
  anxious: '불안',
  neutral: '평온',
}

type DiaryEntry = {
  createdAt: string
  emotion?: string
  emotions?: string[]
}

export default function EmotionStatsPage() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])

  // 데이터 로드 (로그인: API, 비로그인: localStorage)
  useEffect(() => {
    const load = async () => {
      try {
        if (user) {
          const rows = await apiDiary.list()
          const normalized = Array.isArray(rows)
            ? rows.map((d: any) => ({
                createdAt: d.createdAt ?? d.created_at ?? new Date().toISOString(),
                emotions: d.emotions ?? (d.emotion ? [d.emotion] : []),
              }))
            : []
          setDiaries(normalized)
        } else {
          const saved = localStorage.getItem('emotion-diaries')
          setDiaries(saved ? JSON.parse(saved) : [])
        }
      } catch {
        const saved = localStorage.getItem('emotion-diaries')
        setDiaries(saved ? JSON.parse(saved) : [])
      }
    }
    load()
  }, [user])

  // 감정 키 정규화(백엔드의 다양한 키 → 5키)
  const normalizeEmotionKey = (e?: string) => {
    if (!e) return ''
    const key = e.toLowerCase()
    if (key === 'anxiety' || key === 'stress') return 'anxious'
    if (key === 'depression' || key === 'loneliness' || key === 'self-criticism' || key === 'sadness') return 'sad'
    if (key === 'joy') return 'happy'
    if (key === 'general') return 'neutral'
    // happy/sad/angry/anxious/neutral은 그대로
    return key
  }

  // 기간 필터링 (최근 1주 / 최근 1달)
  const filteredData = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (timeRange === 'week') start.setDate(now.getDate() - 7)
    else start.setMonth(now.getMonth() - 1)

    return diaries
      .filter(d => {
        const dt = new Date(d.createdAt)
        return dt >= start && dt <= now
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [diaries, timeRange])

  // 감정 통계 계산(5키만)
  const emotionStats = useMemo(() => {
    const stats: Record<string, number> = { happy: 0, sad: 0, angry: 0, anxious: 0, neutral: 0 }
    let totalEmotions = 0

    filteredData.forEach((diary) => {
      const emos = diary.emotions || (diary.emotion ? [diary.emotion] : [])
      emos.map(normalizeEmotionKey).forEach((k) => {
        if (k in stats) {
          stats[k]++
          totalEmotions++
        }
      })
    })
    return { stats, totalEmotions }
  }, [filteredData])

  // 날짜별 감정 분포 (막대 그래프)
  const chartData = useMemo(() => {
    if (filteredData.length === 0) {
      return { labels: [] as string[], datasets: [] as any[] }
    }

    const dateGroups: Record<string, string[]> = {}
    filteredData.forEach((diary) => {
      const dateLabel = new Date(diary.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      if (!dateGroups[dateLabel]) dateGroups[dateLabel] = []

      const emos = diary.emotions || (diary.emotion ? [diary.emotion] : [])
      dateGroups[dateLabel].push(...emos.map(normalizeEmotionKey).filter(k => k in emotionColors))
    })

    const labels = Object.keys(dateGroups)

    const datasets = Object.keys(emotionColors).map((emotionKey) => {
      const data = labels.map((label) => {
        const emos = dateGroups[label] || []
        return emos.filter((e) => e === emotionKey).length
      })
      return {
        label: emotionLabels[emotionKey] || emotionKey,
        data,
        backgroundColor: emotionColors[emotionKey] + '20',
        borderColor: emotionColors[emotionKey],
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }
    })

    return { labels, datasets }
  }, [filteredData])

  // 막대 차트 컴포넌트
  const BarChart = ({ data }: { data: { labels: string[], datasets: any[] } }) => {
    if (!data.labels.length) {
      return (
        <div className="flex h-64 items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3Icon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">표시할 데이터가 없습니다</p>
            <p className="text-sm">일기를 작성해보세요!</p>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...data.datasets.flatMap((dataset: any) => dataset.data))
    const chartHeight = 200

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {data.datasets.map((dataset: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: dataset.borderColor }} />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>

        <div className="relative h-64 overflow-x-auto">
          <div className="flex h-full items-end gap-2 px-4">
            {data.labels.map((label, labelIndex) => (
              <div key={labelIndex} className="flex flex-col items-center gap-1">
                <div className="flex h-48 flex-col justify-end gap-1">
                  {data.datasets.map((dataset: any, datasetIndex: number) => {
                    const value = dataset.data[labelIndex] || 0
                    const barHeightPx = maxValue > 0 ? (value / maxValue) * chartHeight : 0
                    return (
                      <div
                        key={datasetIndex}
                        className="w-8 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${barHeightPx}px`,
                          backgroundColor: dataset.borderColor,
                          minHeight: value > 0 ? '4px' : '0px',
                        }}
                        title={`${dataset.label}: ${value}개`}
                      />
                    )
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{maxValue}</span>
        </div>
      </div>
    )
  }

  // 파이 차트(커스텀 SVG)
  const PieChart = ({ stats, total }: { stats: Record<string, number>, total: number }) => {
    if (total === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-gray-500">
          <div className="text-center">
            <PieChartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">표시할 데이터가 없습니다</p>
            <p className="text-sm">일기를 작성해보세요!</p>
          </div>
        </div>
      )
    }

    const radius = 80
    const centerX = 100
    const centerY = 100
    let currentAngle = 0

    const entries = Object.entries(stats).filter(([emotion, count]) => count > 0 && emotion in emotionColors)

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <svg width="200" height="200" className="overflow-visible">
            {entries.map(([emotion, count]) => {
              const color = emotionColors[emotion] || '#6B7280'
              const angle = (count / total) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle

              const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
              const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
              const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

              const largeArcFlag = angle > 180 ? 1 : 0
              const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ')

              currentAngle += angle
              return <path key={emotion} d={pathData} fill={color} stroke="white" strokeWidth="2" className="transition-all duration-300 hover:opacity-80" />
            })}
          </svg>
        </div>

        <div className="space-y-2">
          {entries.map(([emotion, count]) => {
            const percentage = ((count / total) * 100).toFixed(1)
            return (
              <div key={emotion} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: emotionColors[emotion] }} />
                  <span className="text-sm text-gray-600">{emotionLabels[emotion] || emotion}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{count}개 ({percentage}%)</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* 헤더 + 요약 */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <TrendingUpIcon className="h-6 w-6 text-purple-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">감정 통계</h1>
            <p className="text-sm text-gray-500">나의 감정 변화를 분석해보세요</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-6 text-sm text-gray-700">
          <div>
            <div className="text-gray-500">총 일기 수</div>
            <div className="text-xl font-bold text-gray-900">{filteredData.length}</div>
          </div>

          <div>
            <div className="text-gray-500">총 감정 수</div>
            <div className="text-xl font-bold text-gray-900">{emotionStats.totalEmotions}</div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-gray-500">
              <CalendarIcon className="h-4 w-4 text-purple-600" />
              <span>분석 범위</span>
            </div>
            <div className="text-xs text-gray-600">{timeRange === 'week' ? '최근 1주' : '최근 1달'}</div>
          </div>

          <div className="ml-auto flex rounded-lg bg-gray-100 p-1 text-xs font-medium">
            <button
              onClick={() => setTimeRange('week')}
              className={`rounded-md px-3 py-1 transition ${timeRange === 'week' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              일주일
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`rounded-md px-3 py-1 transition ${timeRange === 'month' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              한달
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3Icon className="h-5 w-5 text-purple-600" />
                  감정 변화 그래프
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={chartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  감정 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart stats={emotionStats.stats} total={emotionStats.totalEmotions} />
              </CardContent>
            </Card>
          </div>

          {/* 감정별 상세 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>감정별 상세 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(emotionStats.stats).map(([emotion, count]) => {
                  if (!(emotion in emotionColors)) return null
                  const total = emotionStats.totalEmotions || 1
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
                  return (
                    <div key={emotion} className="flex items-center gap-4">
                      <div className="flex w-20 items-center gap-2">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: emotionColors[emotion] }} />
                        <span className="text-sm font-medium text-gray-800">{emotionLabels[emotion] || emotion}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-gray-200">
                            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: emotionColors[emotion] }} />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{count}개 ({percentage}%)</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 하단 요약 카드 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{filteredData.length}</div>
                  <div className="text-sm text-gray-600">총 일기 수</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{emotionStats.totalEmotions}</div>
                  <div className="text-sm text-gray-600">총 감정 수</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {filteredData.length > 0
                      ? Math.round(
                          (filteredData.filter((d) => {
                            const emos = (d.emotions || (d.emotion ? [d.emotion] : [])).map(normalizeEmotionKey)
                            return emos.includes('happy')
                          }).length /
                            filteredData.length) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">긍정 감정 비율</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
