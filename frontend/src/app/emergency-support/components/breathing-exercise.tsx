'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ArrowUpIcon,
  PauseCircleIcon,
  ArrowDownIcon,
  WindIcon,
  RefreshCwIcon,
} from 'lucide-react'

type Stage = 'inhale' | 'hold' | 'exhale' | 'finished'

interface BreathingExerciseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inhaleSeconds?: number
  holdSeconds?: number
  exhaleSeconds?: number
  cycles?: number
  inline?: boolean
}

export default function BreathingExercise({
  open,
  onOpenChange,
  inhaleSeconds = 4,
  holdSeconds = 7,
  exhaleSeconds = 8,
  cycles = 4,
  inline = false,
}: BreathingExerciseProps) {
  const [stage, setStage] = useState<Stage>('inhale')
  const [remaining, setRemaining] = useState<number>(inhaleSeconds)
  const [currentCycle, setCurrentCycle] = useState<number>(1)
  const [isRunning, setIsRunning] = useState<boolean>(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const totalPerCycle = inhaleSeconds + holdSeconds + exhaleSeconds
  const totalSeconds = totalPerCycle * cycles
  const elapsedSeconds = useMemo(() => {
    const cycleElapsed =
      (stage === 'inhale' ? inhaleSeconds - remaining : 0) +
      (stage === 'hold' ? inhaleSeconds + (holdSeconds - remaining) : 0) +
      (stage === 'exhale'
        ? inhaleSeconds + holdSeconds + (exhaleSeconds - remaining)
        : 0) +
      (stage === 'finished' ? inhaleSeconds + holdSeconds + exhaleSeconds : 0)
    return (currentCycle - 1) * totalPerCycle + cycleElapsed
  }, [
    stage,
    remaining,
    currentCycle,
    inhaleSeconds,
    holdSeconds,
    exhaleSeconds,
    totalPerCycle,
  ])

  const progress = Math.min(
    100,
    Math.round((elapsedSeconds / totalSeconds) * 100)
  )

  const resetAll = () => {
    setStage('inhale')
    setRemaining(inhaleSeconds)
    setCurrentCycle(1)
    setIsRunning(true)
  }

  useEffect(() => {
    if (!open) return
    setStage('inhale')
    setRemaining(inhaleSeconds)
    setCurrentCycle(1)
    setIsRunning(true)
  }, [open, inhaleSeconds])

  useEffect(() => {
    if (!open || !isRunning || stage === 'finished') return

    timerRef.current && clearTimeout(timerRef.current)
    if (remaining > 0) {
      timerRef.current = setTimeout(() => setRemaining((r) => r - 1), 1000)
      return
    }

    // 단계 전환
    if (stage === 'inhale') {
      setStage('hold')
      setRemaining(holdSeconds)
    } else if (stage === 'hold') {
      setStage('exhale')
      setRemaining(exhaleSeconds)
    } else if (stage === 'exhale') {
      if (currentCycle < cycles) {
        setCurrentCycle((c) => c + 1)
        setStage('inhale')
        setRemaining(inhaleSeconds)
      } else {
        setStage('finished')
      }
    }
  }, [
    open,
    isRunning,
    remaining,
    stage,
    inhaleSeconds,
    holdSeconds,
    exhaleSeconds,
    currentCycle,
    cycles,
  ])

  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current)
    }
  }, [])

  const currentConfig = useMemo(() => {
    switch (stage) {
      case 'inhale':
        return {
          label: '들숨',
          sub: `${inhaleSeconds}초 동안 천천히 들이마셔요`,
          color: 'from-emerald-400 to-cyan-500',
          icon: ArrowUpIcon,
        }
      case 'hold':
        return {
          label: '숨 참기',
          sub: `${holdSeconds}초 동안 편안히 유지해요`,
          color: 'from-amber-400 to-yellow-500',
          icon: PauseCircleIcon,
        }
      case 'exhale':
        return {
          label: '날숨',
          sub: `${exhaleSeconds}초 동안 길게 내쉬어요`,
          color: 'from-rose-400 to-pink-500',
          icon: ArrowDownIcon,
        }
      default:
        return {
          label: '완료',
          sub: '수고하셨어요. 몸의 감각을 느껴보세요',
          color: 'from-sky-400 to-indigo-500',
          icon: WindIcon,
        }
    }
  }, [stage, inhaleSeconds, holdSeconds, exhaleSeconds])

  const CurrentIcon = currentConfig.icon
  // 단계 진행률(0→1) 기반 동기 애니메이션 값 복원
  const stageTotalSeconds = useMemo(() => {
    switch (stage) {
      case 'inhale':
        return inhaleSeconds
      case 'hold':
        return holdSeconds
      case 'exhale':
        return exhaleSeconds
      default:
        return 1
    }
  }, [stage, inhaleSeconds, holdSeconds, exhaleSeconds])

  const stageProgress = useMemo(() => {
    const total = Math.max(1, stageTotalSeconds)
    return Math.min(1, Math.max(0, (total - remaining) / total))
  }, [stageTotalSeconds, remaining])

  const currentScale = useMemo(() => {
    if (stage === 'inhale') return 1 + 0.12 * stageProgress
    if (stage === 'exhale') return 1 - 0.08 * stageProgress
    return 1
  }, [stage, stageProgress])

  const offsetY = useMemo(() => {
    if (stage === 'inhale') return -24 * stageProgress
    if (stage === 'exhale') return 24 * stageProgress
    return 0
  }, [stage, stageProgress])
  const iconColorClass = useMemo(() => {
    switch (stage) {
      case 'inhale':
        return 'text-emerald-600'
      case 'hold':
        return 'text-amber-500'
      case 'exhale':
        return 'text-rose-500'
      default:
        return 'text-sky-500'
    }
  }, [stage])

  const Core = (
    <>
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative h-80 w-64 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-[5px] shadow-[0_20px_45px_-12px_rgba(244,63,94,0.35)] shadow-xl dark:shadow-[0_20px_45px_-12px_rgba(225,29,72,0.25)]"
          style={{
            transform: `translateY(${offsetY}px) scale(${currentScale})`,
            transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-rose-300/40 opacity-30 blur-xl dark:bg-rose-800/40" />
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl bg-white/95 dark:bg-slate-900/70">
            <CurrentIcon className={`h-12 w-12 ${iconColorClass}`} />
            <div className="text-5xl font-bold tabular-nums text-slate-900 dark:text-white">
              {remaining}s
            </div>
            <div className="text-base text-gray-700 dark:text-gray-200">
              {currentConfig.label} · {currentCycle}/{cycles}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          {currentConfig.sub}
        </p>

        <div className="flex items-center gap-1">
          {Array.from({ length: cycles }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full transition-all ${
                i + 1 <= currentCycle
                  ? 'bg-rose-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/70">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          총 {totalSeconds}초 · 진행 {progress}%
        </div>
        <div className="flex gap-2">
          {stage !== 'finished' ? (
            <Button
              onClick={() => setIsRunning((r) => !r)}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50"
            >
              {isRunning ? '일시정지' : '다시 시작'}
            </Button>
          ) : null}

          <Button
            onClick={resetAll}
            variant="outline"
            className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50"
          >
            <RefreshCwIcon className="h-4 w-4" /> 다시 시작
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="transform bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            닫기
          </Button>
        </div>
      </div>
    </>
  )

  if (inline) {
    if (!open) return null
    return (
      <div className="animate-fadeIn mt-4 text-center">
        <div className="relative mx-auto inline-block w-full max-w-2xl overflow-hidden rounded-lg border-0 bg-white/80 shadow-md backdrop-blur-sm dark:bg-slate-800/70">
          <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 px-6 py-4 text-white">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <WindIcon className="h-5 w-5" /> 4-7-8 호흡법 가이드
            </div>
            <div className="text-xs/relaxed opacity-90">
              4초 들숨, 7초 유지, 8초 날숨을 {cycles}회 반복합니다.
            </div>
          </div>
          <div className="bg-[#e5e5e5] p-6 dark:bg-slate-800/60">{Core}</div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-0 bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-slate-900/70 dark:via-slate-900/65 dark:to-slate-900/60 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WindIcon className="h-5 w-5 text-red-500" /> 4-7-8 호흡법 가이드
          </DialogTitle>
          <DialogDescription>
            4초 들숨, 7초 유지, 8초 날숨을 {cycles}회 반복합니다.
          </DialogDescription>
        </DialogHeader>
        {Core}
      </DialogContent>
    </Dialog>
  )
}
