"use client";

import { useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import EmotionHistory from "@/components/emotion-history";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function HistoryPage() {
  const [period, setPeriod] = useState(7);

  // 전체 데이터 샘플 (실제 데이터는 DB에서 받아올 수 있음)
  const allDates = [
    "8/1","8/2","8/3","8/4","8/5","8/6","8/7",
    "8/8","8/9","8/10","8/11","8/12","8/13","8/14"
  ];
  const allEmotions = [3,2,1,0,2,3,1,2,3,1,0,2,3,1]; // 인덱스 기준

  // 감정 라벨 + 이모지
  const emotionsMap = [
    { label: "화남", emoji: "😡", color: "#ef4444" },
    { label: "우울함", emoji: "😢", color: "#3b82f6" },
    { label: "중립", emoji: "😐", color: "#6b7280" },
    { label: "신남", emoji: "😄", color: "#10b981" }
  ];

  // 요일별 감정 패턴 분석
  const getDayOfWeek = (dateStr) => {
    const [month, day] = dateStr.split('/');
    const date = new Date(2024, month - 1, day);
    return date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  // 요일별 평균 감정 계산
  const weeklyPattern = dayNames.map((day, dayIndex) => {
    const dayEmotions = allDates
      .map((date, idx) => ({ date, emotion: allEmotions[idx] }))
      .filter(item => getDayOfWeek(item.date) === dayIndex)
      .map(item => item.emotion);
    
    const avgEmotion = dayEmotions.length > 0 
      ? dayEmotions.reduce((sum, emotion) => sum + emotion, 0) / dayEmotions.length 
      : 0;
    
    return { day, avgEmotion, count: dayEmotions.length };
  });

  // 최근 7일 vs 이전 7일 비교
  const recent7Days = allEmotions.slice(-7);
  const previous7Days = allEmotions.slice(-14, -7);
  
  const recentAvg = recent7Days.reduce((sum, emotion) => sum + emotion, 0) / recent7Days.length;
  const previousAvg = previous7Days.reduce((sum, emotion) => sum + emotion, 0) / previous7Days.length;
  
  const improvement = recentAvg - previousAvg;
  const improvementPercent = previousAvg !== 0 ? ((improvement / previousAvg) * 100).toFixed(1) : 0;

  // 기간 필터 적용
  const filteredDates = allDates.slice(-period);
  const filteredEmotions = allEmotions.slice(-period);

  const chartData = {
    labels: filteredDates,
    datasets: [
      {
        label: "감정 변화",
        data: filteredEmotions,
        borderColor: "rgb(75,192,192)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        ticks: {
          callback: (value) => emotionsMap[value]?.emoji + " " + emotionsMap[value]?.label
        },
        min: 0,
        max: emotionsMap.length - 1,
      },
    },
  };

  // 요일별 패턴 차트 데이터
  const weeklyPatternData = {
    labels: weeklyPattern.map(item => item.day),
    datasets: [{
      label: '평균 감정 점수',
      data: weeklyPattern.map(item => item.avgEmotion),
      backgroundColor: weeklyPattern.map(item => 
        emotionsMap[Math.round(item.avgEmotion)]?.color || '#6b7280'
      ),
      borderColor: weeklyPattern.map(item => 
        emotionsMap[Math.round(item.avgEmotion)]?.color || '#6b7280'
      ),
      borderWidth: 1,
    }],
  };

  const weeklyPatternOptions = {
    scales: {
      y: {
        ticks: {
          callback: (value) => emotionsMap[Math.round(value)]?.emoji + " " + emotionsMap[Math.round(value)]?.label
        },
        min: 0,
        max: emotionsMap.length - 1,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const day = context.label;
            const emotion = Math.round(context.parsed.y);
            const count = weeklyPattern[context.dataIndex].count;
            return `${day}요일: ${emotionsMap[emotion]?.emoji} ${emotionsMap[emotion]?.label} (${count}일 기록)`;
          }
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full p-4 space-y-6">
      {/* 기존 EmotionHistory */}
      <EmotionHistory />

      {/* 통계 정보 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 최근 7일 vs 이전 7일 비교 */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-4">📊 최근 7일 vs 이전 7일 비교</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {emotionsMap[Math.round(recentAvg)]?.emoji}
              </div>
              <div className="text-xs text-gray-600">최근 7일</div>
              <div className="text-sm font-semibold">{emotionsMap[Math.round(recentAvg)]?.label}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">
                {emotionsMap[Math.round(previousAvg)]?.emoji}
              </div>
              <div className="text-xs text-gray-600">이전 7일</div>
              <div className="text-sm font-semibold">{emotionsMap[Math.round(previousAvg)]?.label}</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${improvement >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement >= 0 ? '📈' : '📉'}
              </div>
              <div className="text-xs text-gray-600">변화</div>
              <div className={`text-sm font-semibold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement >= 0 ? '+' : ''}{improvementPercent}%
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-700">
              {improvement > 0 
                ? `🎉 최근 7일이 이전 7일보다 ${improvementPercent}% 더 긍정적이에요!`
                : improvement < 0 
                ? `😔 최근 7일이 이전 7일보다 ${Math.abs(improvementPercent)}% 더 부정적이에요.`
                : "😐 최근 7일과 이전 7일의 감정 상태가 비슷해요."
              }
            </p>
          </div>
        </div>

        {/* 감정 통계 요약 */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-4">📈 감정 통계 요약</h3>
          
          {/* 전체 기간 평균 감정 */}
          <div className="mb-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {emotionsMap[Math.round(allEmotions.reduce((sum, emotion) => sum + emotion, 0) / allEmotions.length)]?.emoji}
              </div>
              <div className="text-xs text-gray-600">전체 기간 평균</div>
              <div className="text-sm font-semibold">
                {emotionsMap[Math.round(allEmotions.reduce((sum, emotion) => sum + emotion, 0) / allEmotions.length)]?.label}
              </div>
            </div>
          </div>

          {/* 감정 분포 */}
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-2">감정 분포</div>
            <div className="space-y-1">
              {emotionsMap.map((emotion, index) => {
                const count = allEmotions.filter(e => e === index).length;
                const percentage = ((count / allEmotions.length) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span>{emotion.emoji}</span>
                      <span>{emotion.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full" 
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: emotion.color 
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-600 w-8">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 연속 기록 일수 */}
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600">연속 기록</div>
            <div className="text-sm font-semibold text-blue-600">{allDates.length}일</div>
          </div>
        </div>
      </div>

      {/* 최근 감정 기록 */}
      <div className="bg-white rounded p-4 shadow flex-1 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">최근 감정 기록</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filteredDates.map((date, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600 mb-1">{date}</div>
              <div className="text-lg">{emotionsMap[filteredEmotions[idx]].emoji}</div>
              <div className="text-xs text-gray-700">{emotionsMap[filteredEmotions[idx]].label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
