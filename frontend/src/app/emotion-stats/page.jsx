'use client'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUpIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon,
} from 'lucide-react'

// 감정별 색상 매핑
const emotionColors = {
  happy: '#10B981', // green-500
  sad: '#3B82F6', // blue-500
  angry: '#EF4444', // red-500
  anxious: '#F59E0B', // amber-500
  neutral: '#6B7280', // gray-500
}

// 감정별 라벨
const emotionLabels = {
  happy: '기쁨',
  sad: '슬픔',
  angry: '화남',
  anxious: '불안',
  neutral: '평온',
}

export default function EmotionStatsPage() {
  const [timeRange, setTimeRange] = useState('week') // 'week' 또는 'month'
  const [diaries, setDiaries] = useState([])

  // 저장된 일기 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('emotion-diaries')
    if (saved) {
      setDiaries(JSON.parse(saved))
    }
  }, [])

  // 날짜 범위에 따른 데이터 필터링
  const filteredData = useMemo(() => {
    const now = new Date()
    const startDate = new Date()

    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate.setMonth(now.getMonth() - 1)
    }

    return diaries
      .filter((diary) => {
        const diaryDate = new Date(diary.createdAt)
        return diaryDate >= startDate && diaryDate <= now
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }, [diaries, timeRange])

  // 감정 통계 계산
  const emotionStats = useMemo(() => {
    const stats = {}
    let totalEmotions = 0

    filteredData.forEach((diary) => {
      const emotions = diary.emotions || (diary.emotion ? [diary.emotion] : [])
      emotions.forEach((emotion) => {
        stats[emotion] = (stats[emotion] || 0) + 1
        totalEmotions++
      })
    })

    return { stats, totalEmotions }
  }, [filteredData])

  // 그래프 데이터 생성
  const chartData = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // 날짜별로 그룹화
    const dateGroups = {}
    filteredData.forEach((diary) => {
      const date = new Date(diary.createdAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })

      if (!dateGroups[date]) {
        dateGroups[date] = []
      }

      // 다중 감정 처리
      const emotions = diary.emotions || (diary.emotion ? [diary.emotion] : [])
      dateGroups[date].push(...emotions)
    })

    const labels = Object.keys(dateGroups)

    // 각 감정별 데이터셋 생성
    const datasets = Object.keys(emotionColors).map((emotion) => {
      const data = labels.map((date) => {
        const emotions = dateGroups[date] || []
        return emotions.filter((e) => e === emotion).length
      })

      return {
        label: emotionLabels[emotion],
        data: data,
        backgroundColor: emotionColors[emotion] + '20',
        borderColor: emotionColors[emotion],
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }
    })

    return { labels, datasets }
  }, [filteredData])

  // 막대 그래프 컴포넌트
  const BarChart = ({ data }) => {
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

    const maxValue = Math.max(
      ...data.datasets.flatMap((dataset) => dataset.data)
    )
    const chartHeight = 200

    return (
      <div className="space-y-4">
        {/* 범례 */}
        <div className="flex flex-wrap gap-4">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: dataset.borderColor }}
              />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>

        {/* 그래프 */}
        <div className="relative h-64 overflow-x-auto">
          <div className="flex h-full items-end gap-2 px-4">
            {data.labels.map((label, labelIndex) => (
              <div
                key={labelIndex}
                className="flex flex-col items-center gap-1"
              >
                {/* 막대들 */}
                <div className="flex h-48 flex-col justify-end gap-1">
                  {data.datasets.map((dataset, datasetIndex) => {
                    const value = dataset.data[labelIndex] || 0
                    const height =
                      maxValue > 0 ? (value / maxValue) * chartHeight : 0

                    return (
                      <div
                        key={datasetIndex}
                        className="w-8 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${height}px`,
                          backgroundColor: dataset.borderColor,
                          minHeight: value > 0 ? '4px' : '0px',
                        }}
                        title={`${dataset.label}: ${value}개`}
                      />
                    )
                  })}
                </div>

                {/* x축 라벨 */}
                <div className="mt-2 text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* y축 라벨 */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{maxValue}</span>
        </div>
      </div>
    )
  }

  // 파이 차트 컴포넌트
  const PieChart = ({ stats, total }) => {
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

    let currentAngle = 0
    const radius = 80
    const centerX = 100
    const centerY = 100

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <svg width="200" height="200" className="overflow-visible">
            {Object.entries(stats).map(([emotion, count]) => {
              const percentage = (count / total) * 100
              const angle = (count / total) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle

              const x1 =
                centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 =
                centerY + radius * Math.sin((startAngle * Math.PI) / 180)
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
                  key={emotion}
                  d={pathData}
                  fill={emotionColors[emotion]}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:opacity-80"
                />
              )
            })}
          </svg>
        </div>

        {/* 범례 */}
        <div className="space-y-2">
          {Object.entries(stats).map(([emotion, count]) => {
            const percentage = ((count / total) * 100).toFixed(1)
            return (
              <div key={emotion} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: emotionColors[emotion] }}
                  />
                  <span className="text-sm text-gray-600">
                    {emotionLabels[emotion]}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {count}개 ({percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <TrendingUpIcon className="h-6 w-6 text-purple-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              감정 통계
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              나의 감정 변화를 분석해보세요
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* 시간 범위 선택 */}
          <div className="flex justify-center">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setTimeRange('week')}
                className={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
                  timeRange === 'week'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                일주일
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
                  timeRange === 'month'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                한달
              </button>
            </div>
          </div>

          {/* 그래프 섹션 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 막대 그래프 */}
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

            {/* 파이 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  감정 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  stats={emotionStats.stats}
                  total={emotionStats.totalEmotions}
                />
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
                  const percentage =
                    emotionStats.totalEmotions > 0
                      ? ((count / emotionStats.totalEmotions) * 100).toFixed(1)
                      : 0

                  return (
                    <div key={emotion} className="flex items-center gap-4">
                      <div className="flex w-20 items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: emotionColors[emotion] }}
                        />
                        <span className="text-sm font-medium">
                          {emotionLabels[emotion]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: emotionColors[emotion],
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {count}개 ({percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {filteredData.length}
                  </div>
                  <div className="text-sm text-gray-600">총 일기 수</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {emotionStats.totalEmotions}
                  </div>
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
                          (filteredData.filter((diary) =>
                            (diary.emotions || [diary.emotion]).includes(
                              'happy'
                            )
                          ).length /
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
