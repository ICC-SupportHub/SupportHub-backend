"use client"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Dummy data for emotion history (e.g., sentiment score over 30 days)
// A higher value could represent more positive emotion, lower for negative.
const generateEmotionData = () => {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const formattedDate = date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    // Simulate a fluctuating emotion score between -10 and 10
    const emotionScore = Math.floor(Math.random() * 21) - 10
    data.push({ date: formattedDate, score: emotionScore })
  }
  return data
}

const emotionData = generateEmotionData()

export default function EmotionHistory() {
  return (
    <div className="flex justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg rounded-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-t-lg p-4">
          <CardTitle className="text-2xl font-bold">감정 히스토리</CardTitle>
          <CardDescription className="text-purple-100">지난 30일간의 감정 변화를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex-1">
          <ChartContainer
            config={{
              score: {
                label: "감정 점수",
                color: "hsl(var(--chart-1))", // Using shadcn's chart color variable
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={emotionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => value.split(" ")[1]} // Show only day for brevity
                  tickLine={false}
                  axisLine={false}
                  className="text-xs text-gray-500 dark:text-gray-400"
                />
                <YAxis
                  domain={[-10, 10]} // Set fixed domain for emotion score
                  tickFormatter={(value) => {
                    if (value === 10) return "매우 긍정"
                    if (value === 5) return "긍정"
                    if (value === 0) return "중립"
                    if (value === -5) return "부정"
                    if (value === -10) return "매우 부정"
                    return ""
                  }}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs text-gray-500 dark:text-gray-400"
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
        </CardContent>
      </Card>
    </div>
  )
}
