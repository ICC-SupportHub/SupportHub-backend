'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useAuth } from '@/contexts/AuthContext'
import { apiDiary } from '@/lib/api'
import { PieChartIcon, BarChart3Icon, CalendarIcon } from 'lucide-react'

// ---------------------------------------
// 감정 정의 (2번 코드 스타일 기준)
// ---------------------------------------
const EMOTIONS = ['happy', 'sad', 'angry', 'anxious', 'neutral']

const emotionColors = {
  happy: '#10B981',   // green
  sad: '#3B82F6',     // blue
  angry: '#EF4444',   // red
  anxious: '#F59E0B', // amber
  neutral: '#6B7280', // gray
}

const emotionLabels = {
  happy: '기쁨',
  sad: '슬픔',
  angry: '화남',
  anxious: '불안',
  neutral: '평온',
}

// 감정을 점수로 수치화해서 라인 차트에 씀 (-10 ~ 10 스케일)
const emotionScoreMap = {
  happy: 10,
  joyful: 8,
  joy: 8,
  neutral: 0,
  sad: -8,
  depression: -10,
  angry: -7,
  anxious: -6,
  anxiety: -6,
  stress: -5,
  loneliness: -6,
  'self-criticism': -9,
  general: 0,
}

// 한 일기의 대표 감정 뽑기
function pickPrimaryEmotion(entry) {
  const emos =
    entry?.emotions && entry.emotions.length > 0
      ? entry.emotions
      : entry?.emotion
      ? [entry.emotion]
      : []

  if (emos.length === 0) return null

  const priorityOrder = [
    'depression',
    'self-criticism',
    'loneliness',
    'anxiety',
    'anxious',
    'stress',
    'angry',
    'sad',
    'happy',
    'joy',
    'joyful',
    'neutral',
    'general',
  ]

  for (const key of priorityOrder) {
    if (emos.includes(key)) return key
  }

  return emos[0]
}

// 하루 평균 감정 점수 구하기
function averageScoreOfDay(entriesForDay) {
  const scores = []

  entriesForDay.forEach((entry) => {
    const emo = pickPrimaryEmotion(entry)
    if (!emo) return
    const score = emotionScoreMap[emo]
    if (typeof score === 'number') {
      scores.push(score)
    }
  })

  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, v) => acc + v, 0)
  return sum / scores.length
}

export default function EmotionStats() {
  const { user } = useAuth()
  const [diaries, setDiaries] = useState([])

  // ----------------------------
  // 1) 데이터 로드 (apiDiary or localStorage)
  // ----------------------------
  useEffect(() => {
    async function load() {
      try {
        if (user) {
          const result = await apiDiary.list()
          const normalized = Array.isArray(result)
            ? result.map((d) => ({
                id: d.id ?? d.diaryId ?? `${Date.now()}-${Math.random()}`,
                emotions: d.emotions ?? (d.emotion ? [d.emotion] : []),
                emotion: d.emotion,
                createdAt: d.createdAt ?? d.created_at ?? new Date().toISOString(),
              }))
            : []
          setDiaries(normalized)
        } else {
          const saved = localStorage.getItem('emotion-diaries')
          if (saved) {
            const parsed = JSON.parse(saved)
            const normalized = Array.isArray(parsed)
              ? parsed.map((d) => ({
                  id: d.id ?? `${Date.now()}-${Math.random()}`,
                  emotions: d.emotions ?? (d.emotion ? [d.emotion] : []),
                  emotion: d.emotion,
                  createdAt: d.createdAt ?? d.date ?? new Date().toISOString(),
                }))
              : []
            setDiaries(normalized)
          }
        }
      } catch (e) {
        // fallback to local
        const saved = localStorage.getItem('emotion-diaries')
        if (saved) {
          const parsed = JSON.parse(saved)
          const normalized = Array.isArray(parsed)
            ? parsed.map((d) => ({
                id: d.id ?? `${Date.now()}-${Math.random()}`,
                emotions: d.emotions ?? (d.emotion ? [d.emotion] : []),
                emotion: d.emotion,
                createdAt: d.createdAt ?? d.date ?? new Date().toISOString(),
              }))
            : []
          setDiaries(normalized)
        }
      }
    }

    load()
  }, [user])

  // ----------------------------
  // 2) 최근 30일 데이터만 추리기
  // ----------------------------
  const last30DaysData = useMemo(() => {
    const now = new Date()
    const start = new Date()
    start.setDate(now.getDate() - 30)

    return diaries.filter((d) => {
      const t = new Date(d.createdAt)
      return t >= start && t <= now
    })
  }, [diaries])

  // ----------------------------
  // 3) 라인 차트 데이터 (감정 히스토리)
  //    [{ date: "10월 27일", score: -2 }, ...]
  // ----------------------------
  const lineChartData = useMemo(() => {
    // 날짜별 그룹
    const byDay = {}

    last30DaysData.forEach((d) => {
      const key = new Date(d.createdAt).toISOString().split('T')[0] // yyyy-mm-dd
      if (!byDay[key]) byDay[key] = []
      byDay[key].push(d)
    })

    // 30일 순회해서 (과거→오늘 순)
    const data = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(today)
      dt.setDate(today.getDate() - i)

      const key = dt.toISOString().split('T')[0]
      const score = byDay[key] ? averageScoreOfDay(byDay[key]) : 0

      const label = dt.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })

      data.push({
        date: label,
        score,
      })
    }

    return data
  }, [last30DaysData])

  // ----------------------------
  // 4) 감정 카운트 통계 (전체 합산)
  //    stats: { happy: n, sad: n, ... }
  // ----------------------------
  const emotionStats = useMemo(() => {
    const stats = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      neutral: 0,
    }
    let totalEmotions = 0

    last30DaysData.forEach((entry) => {
      const emos = entry.emotions && entry.emotions.length > 0
        ? entry.emotions
        : entry.emotion
        ? [entry.emotion]
        : []

      emos.forEach((emo) => {
        if (emo in stats) {
          stats[emo] += 1
          totalEmotions += 1
        }
      })
    })

    return { stats, totalEmotions }
  }, [last30DaysData])

  // ----------------------------
  // 5) 날짜별 감정 빈도 (막대 그래프용)
  //    chartData.labels = ["10월 24일", "10월 25일", ...]
  //    chartData.datasets = [{ label: '기쁨', data: [...], borderColor: '#10B981' }, ...]
  // ----------------------------
  const barChartData = useMemo(() => {
    if (last30DaysData.length === 0) {
      return { labels: [], datasets: [] }
    }

    // 날짜별로 해당날 감정 리스트 모으기
    const dateGroups = {}
    last30DaysData.forEach((entry) => {
      const label = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
      if (!dateGroups[label]) dateGroups[label] = []

      const emos = entry.emotions && entry.emotions.length > 0
        ? entry.emotions
        : entry.emotion
        ? [entry.emotion]
        : []

      dateGroups[label].push(...emos)
    })

    const labels = Object.keys(dateGroups)

    const datasets = EMOTIONS.map((emoKey) => {
      const data = labels.map((label) => {
        const emos = dateGroups[label] || []
        return emos.filter((e) => e === emoKey).length
      })

      return {
        label: emotionLabels[emoKey],
        data,
        borderColor: emotionColors[emoKey],
      }
    })

    return { labels, datasets }
  }, [last30DaysData])

  // 긍정 비율 카드용
  const positiveRatio = useMemo(() => {
    if (last30DaysData.length === 0) return 0
    const positiveDays = last30DaysData.filter((d) => {
      const emos = d.emotions && d.emotions.length > 0
        ? d.emotions
        : d.emotion
        ? [d.emotion]
        : []
      return emos.includes('happy')
    }).length

    return Math.round((positiveDays / last30DaysData.length) * 100)
  }, [last30DaysData])

  // ----------------------------------------------------------------
  // 작은 시각화 컴포넌트들
  // ----------------------------------------------------------------

  // 5-A) 라인 차트 (감정 점수 히스토리)
  function EmotionLineChart() {
    return (
      <ChartContainer
        config={{
          score: {
            label: '감정 점수',
            color: 'hsl(var(--chart-1))',
          },
        }}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={lineChartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              className="text-xs text-gray-500 dark:text-gray-400"
              tickFormatter={(value) => {
                // "10월 27일" -> "27일"만
                const parts = String(value).split(' ')
                return parts.length > 1 ? parts[1] : value
              }}
            />
            <YAxis
              domain={[-10, 10]}
              tickLine={false}
              axisLine={false}
              className="text-xs text-gray-500 dark:text-gray-400"
              tickFormatter={(value) => {
                if (value === 10) return '매우 긍정'
                if (value === 5) return '긍정'
                if (value === 0) return '중립'
                if (value === -5) return '부정'
                if (value === -10) return '매우 부정'
                return ''
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="감정 점수"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  // 5-B) 막대 그래프 (날짜별 감정 카운트)
  function EmotionBarChart() {
    if (!barChartData.labels.length) {
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

    const maxValue = Math.max(
      ...barChartData.datasets.flatMap((ds) => ds.data)
    )
    const chartHeight = 200

    return (
      <div className="space-y-4">
        {/* 범례 */}
        <div className="flex flex-wrap gap-4">
          {barChartData.datasets.map((ds, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: ds.borderColor }}
              />
              <span className="text-sm text-gray-600">
                {ds.label}
              </span>
            </div>
          ))}
        </div>

        {/* 차트 영역 */}
        <div className="relative h-64 overflow-x-auto">
          <div className="flex h-full items-end gap-2 px-4">
            {barChartData.labels.map((label, labelIdx) => (
              <div
                key={labelIdx}
                className="flex flex-col items-center gap-1"
              >
                {/* 날짜별 stack */}
                <div className="flex h-48 flex-col justify-end gap-1">
                  {barChartData.datasets.map((ds, dsIdx) => {
                    const value = ds.data[labelIdx] || 0
                    const h =
                      maxValue > 0
                        ? (value / maxValue) * chartHeight
                        : 0
                    return (
                      <div
                        key={dsIdx}
                        className="w-8 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${h}px`,
                          backgroundColor: ds.borderColor,
                          minHeight: value > 0 ? '4px' : '0px',
                        }}
                        title={`${ds.label}: ${value}개`}
                      />
                    )
                  })}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* y축 눈금 */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{maxValue}</span>
        </div>
      </div>
    )
  }

  // 5-C) 파이 차트 (감정 분포)
  // -> shadcn에 내장된 Pie는 없으니까, 여기서는 SVG로 직접 조각을 그림
  function EmotionPieChart() {
    if (emotionStats.totalEmotions === 0) {
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

    // stats를 감정 순서 EMOTIONS 기준으로 정렬해서 유지
    const slices = EMOTIONS
      .map((emo) => [emo, emotionStats.stats[emo] || 0])
      .filter(([_, count]) => count > 0)

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <svg width="200" height="200" className="overflow-visible">
            {slices.map(([emo, count]) => {
              const angle = (count / emotionStats.totalEmotions) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle

              const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
              const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
              const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

              const largeArcFlag = angle > 180 ? 1 : 0

              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
              ].join(' ')

              currentAngle += angle

              return (
                <path
                  key={emo}
                  d={pathData}
                  fill={emotionColors[emo] || '#6B7280'}
                  stroke="white"
                  strokeWidth={2}
                  className="transition-all duration-300 hover:opacity-80"
                />
              )
            })}
          </svg>
        </div>

        <div className="space-y-2">
          {slices.map(([emo, count]) => {
            const pct = ((count / emotionStats.totalEmotions) * 100).toFixed(1)
            return (
              <div
                key={emo}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: emotionColors[emo] }}
                  />
                  <span className="text-sm text-gray-600">
                    {emotionLabels[emo] || emo}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {count}개 ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ----------------------------------------------------------------
  // 렌더
  // ----------------------------------------------------------------
  return (
    <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 p-4">
      {/* 상단: 감정 히스토리 (라인 차트) */}
      <Card className="w-full max-w-5xl shadow-lg rounded-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-t-lg p-4">
          <CardTitle className="text-2xl font-bold">감정 히스토리</CardTitle>
          <CardDescription className="text-purple-100">
            지난 30일간의 감정 변화를 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex-1">
          <EmotionLineChart />
        </CardContent>
      </Card>

      {/* 중단: 감정 변화 그래프(막대) + 감정 분포(파이) */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <BarChart3Icon className="h-5 w-5 text-purple-600" />
              <span>감정 변화 그래프</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <EmotionBarChart />
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              <span>감정 분포</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3 text-purple-500" />
              최근 30일 기준
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <EmotionPieChart />
          </CardContent>
        </Card>
      </div>

      {/* 하단: 감정별 상세 통계 + 요약 카드들 */}
      <div className="w-full max-w-5xl grid grid-cols-1 gap-6">
        {/* 감정별 상세 통계 */}
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">
              감정별 상세 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {EMOTIONS.map((emo) => {
                const count = emotionStats.stats[emo] || 0
                const total = emotionStats.totalEmotions || 1
                const pctNum = (count / total) * 100
                const pctLabel = pctNum.toFixed(1)

                return (
                  <div key={emo} className="flex items-center gap-4">
                    <div className="flex w-20 items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: emotionColors[emo] }}
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {emotionLabels[emo]}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${pctNum}%`,
                              backgroundColor: emotionColors[emo],
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {count}개 ({pctLabel}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 요약 카드들 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {last30DaysData.length}
              </div>
              <div className="text-sm text-gray-600">최근 30일 일기 수</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {emotionStats.totalEmotions}
              </div>
              <div className="text-sm text-gray-600">총 감정 태그 수</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {positiveRatio}%
              </div>
              <div className="text-sm text-gray-600">긍정 감정 비율</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
