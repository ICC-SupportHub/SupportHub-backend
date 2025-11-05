"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import EmotionHistory from "@/components/emotion-history";
import { useAuth } from "@/contexts/AuthContext";
import { apiDiary } from "@/lib/api";

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

type DiaryRow = {
  createdAt?: string;
  created_at?: string;
  emotion?: string;
  emotions?: string[];
};

type DayAgg = { dateKey: string; label: string; score: number };

const emotionsMap = [
  { label: "화남", emoji: "😡", color: "#ef4444" }, // 0
  { label: "우울함", emoji: "😢", color: "#3b82f6" }, // 1
  { label: "중립", emoji: "😐", color: "#6b7280" }, // 2
  { label: "신남", emoji: "😄", color: "#10b981" }, // 3
];

// 다양한 감정 키를 0~3 점수로 정규화
const toScore = (raw?: string) => {
  if (!raw) return 2;
  const k = raw.toLowerCase();
  if (k === "angry") return 0;
  if (
    k === "sad" ||
    k === "depression" ||
    k === "loneliness" ||
    k === "self-criticism" ||
    k === "anxiety" ||
    k === "stress"
  )
    return 1;
  if (k === "neutral" || k === "general") return 2;
  if (k === "happy" || k === "joy") return 3;
  return 2;
};

const fmtDateLabel = (d: Date) =>
  d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }); // 예: 8/14
const dateKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

export default function HistoryPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(7);
  const [days, setDays] = useState<DayAgg[]>([]); // 날짜별 점수

  // 데이터 로드 (로그인: DB, 비로그인: localStorage)
  useEffect(() => {
    const load = async () => {
      try {
        let rows: DiaryRow[] = [];
        if (user) {
          const r = await apiDiary.list();
          rows = Array.isArray(r) ? r : [];
        } else {
          const saved = localStorage.getItem("emotion-diaries");
          rows = saved ? JSON.parse(saved) : [];
        }

        // 날짜별 그룹 → 점수 평균(반올림)
        const byDate = new Map<string, { sum: number; cnt: number; firstDate: Date }>();

        for (const row of rows) {
          const ts = row.createdAt || row.created_at || new Date().toISOString();
          const dt = new Date(ts);
          const key = dateKey(dt);

          const emos = row.emotions ?? (row.emotion ? [row.emotion] : []);
          // 감정 없으면 중립 한 개로 간주
          const scores = (emos.length ? emos : ["neutral"]).map(toScore);

          const sum = scores.reduce((a, b) => a + b, 0);
          const cnt = scores.length;

          const prev = byDate.get(key);
          if (prev) {
            byDate.set(key, { sum: prev.sum + sum / cnt, cnt: prev.cnt + 1, firstDate: prev.firstDate });
          } else {
            byDate.set(key, { sum: sum / cnt, cnt: 1, firstDate: dt });
          }
        }

        const list: DayAgg[] = Array.from(byDate.entries())
          .map(([k, v]) => {
            const avg = v.sum / v.cnt;
            const score = Math.max(0, Math.min(3, Math.round(avg)));
            return { dateKey: k, label: fmtDateLabel(v.firstDate), score };
          })
          .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));

        setDays(list);
      } catch {
        setDays([]);
      }
    };
    load();
  }, [user]);

  // 기간 필터
  const filtered = useMemo(() => {
    if (!days.length) return [];
    return days.slice(-period);
  }, [days, period]);

  // 요일별 패턴
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const weeklyPattern = useMemo(() => {
    const buckets = Array.from({ length: 7 }, () => [] as number[]);
    for (const d of filtered) {
      const [y, m, dd] = d.dateKey.split("-").map(Number);
      const dow = new Date(y, m - 1, dd).getDay();
      buckets[dow].push(d.score);
    }
    return dayNames.map((day, i) => {
      const arr = buckets[i];
      const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      return { day, avgEmotion: avg, count: arr.length };
    });
  }, [filtered]);

  // 최근 7일 vs 이전 7일 비교
  const recent = days.slice(-7);
  const prev = days.slice(-14, -7);
  const recentAvg = recent.length ? recent.reduce((s, d) => s + d.score, 0) / recent.length : 0;
  const previousAvg = prev.length ? prev.reduce((s, d) => s + d.score, 0) / prev.length : 0;
  const improvement = recentAvg - previousAvg;
  const improvementPercent =
    previousAvg !== 0 ? ((improvement / previousAvg) * 100).toFixed(1) : (improvement * 100).toFixed(1);

  // 차트 데이터
  const allDates = filtered.map((d) => d.label);
  const allEmotions = filtered.map((d) => d.score);

  const chartData = {
    labels: allDates,
    datasets: [
      {
        label: "감정 변화",
        data: allEmotions,
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
          callback: (value: any) =>
            emotionsMap[value] ? `${emotionsMap[value].emoji} ${emotionsMap[value].label}` : value,
        },
        min: 0,
        max: emotionsMap.length - 1,
      },
    },
  };

  const weeklyPatternData = {
    labels: weeklyPattern.map((x) => x.day),
    datasets: [
      {
        label: "평균 감정 점수",
        data: weeklyPattern.map((x) => x.avgEmotion),
        backgroundColor: weeklyPattern.map((x) => emotionsMap[Math.round(x.avgEmotion)]?.color || "#6b7280"),
        borderColor: weeklyPattern.map((x) => emotionsMap[Math.round(x.avgEmotion)]?.color || "#6b7280"),
        borderWidth: 1,
      },
    ],
  };

  const weeklyPatternOptions = {
    scales: {
      y: {
        ticks: {
          callback: (value: any) =>
            emotionsMap[Math.round(value)]
              ? `${emotionsMap[Math.round(value)].emoji} ${emotionsMap[Math.round(value)].label}`
              : value,
        },
        min: 0,
        max: emotionsMap.length - 1,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const day = ctx.label;
            const emotion = Math.round(ctx.parsed.y);
            const count = weeklyPattern[ctx.dataIndex]?.count ?? 0;
            const label =
              emotionsMap[emotion] ? `${emotionsMap[emotion].emoji} ${emotionsMap[emotion].label}` : `${emotion}`;
            return `${day}요일: ${label} (${count}일 기록)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex-1 flex flex-col h-full p-4 space-y-6">
      {/* 기존 EmotionHistory */}
      <EmotionHistory />

      {/* 기간 선택 */}
      <div className="flex justify-end gap-2">
        {[7, 14, 30].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1 text-sm ${
              period === p ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            최근 {p}일
          </button>
        ))}
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 최근 7일 vs 이전 7일 */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-4">📊 최근 7일 vs 이전 7일 비교</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {emotionsMap[Math.round(recentAvg)]?.emoji ?? "—"}
              </div>
              <div className="text-xs text-gray-600">최근 7일</div>
              <div className="text-sm font-semibold">{emotionsMap[Math.round(recentAvg)]?.label ?? "-"}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">
                {emotionsMap[Math.round(previousAvg)]?.emoji ?? "—"}
              </div>
              <div className="text-xs text-gray-600">이전 7일</div>
              <div className="text-sm font-semibold">{emotionsMap[Math.round(previousAvg)]?.label ?? "-"}</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${improvement >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <div className={`text-xl font-bold ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}>
                {improvement >= 0 ? "📈" : "📉"}
              </div>
              <div className="text-xs text-gray-600">변화</div>
              <div className={`text-sm font-semibold ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}>
                {improvement >= 0 ? "+" : ""}
                {improvementPercent}%
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-700">
              {recent.length === 0 && prev.length === 0
                ? "기록이 아직 부족해요. 오늘 감정을 기록해 보세요!"
                : improvement > 0
                ? `🎉 최근 7일이 이전 7일보다 ${improvementPercent}% 더 긍정적이에요!`
                : improvement < 0
                ? `😔 최근 7일이 이전 7일보다 ${String(Math.abs(Number(improvementPercent)).toFixed(1))}% 더 부정적이에요.`
                : "😐 최근 7일과 이전 7일의 감정 상태가 비슷해요."}
            </p>
          </div>
        </div>

        {/* 감정 통계 요약 + 파생 카운트 */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-4">📈 감정 통계 요약</h3>

          {/* 전체 기간 평균 감정 */}
          <div className="mb-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {emotionsMap[Math.round((days.reduce((s, d) => s + d.score, 0) / (days.length || 1)))]?.emoji ?? "—"}
              </div>
              <div className="text-xs text-gray-600">전체 기간 평균</div>
              <div className="text-sm font-semibold">
                {emotionsMap[
                  Math.round((days.reduce((s, d) => s + d.score, 0) / (days.length || 1)))
                ]?.label ?? "-"}
              </div>
            </div>
          </div>

          {/* 감정 분포 바 */}
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-2">감정 분포</div>
            <div className="space-y-1">
              {emotionsMap.map((emotion, idx) => {
                const count = days.filter((d) => d.score === idx).length;
                const percentage = ((count / (days.length || 1)) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span>{emotion.emoji}</span>
                      <span>{emotion.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: emotion.color }}
                        />
                      </div>
                      <span className="text-gray-600 w-8">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 연속 기록 일수(간단히 총 일수 표시) */}
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600">연속 기록</div>
            <div className="text-sm font-semibold text-blue-600">{days.length}일</div>
          </div>
        </div>
      </div>

      {/* 라인 차트: 감정 변화 */}
      <div className="bg-white rounded p-4 shadow">
        <h3 className="text-lg font-semibold mb-3">감정 변화</h3>
        <Line data={chartData} options={chartOptions as any} />
      </div>

      {/* 바 차트: 요일별 패턴 */}
      <div className="bg-white rounded p-4 shadow">
        <h3 className="text-lg font-semibold mb-3">요일별 패턴</h3>
        <Bar data={weeklyPatternData as any} options={weeklyPatternOptions as any} />
      </div>

      {/* 최근 감정 카드 목록 */}
      <div className="bg-white rounded p-4 shadow flex-1 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">최근 감정 기록</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((d) => (
            <div key={d.dateKey} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600 mb-1">{d.label}</div>
              <div className="text-lg">{emotionsMap[d.score]?.emoji}</div>
              <div className="text-xs text-gray-700">{emotionsMap[d.score]?.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
