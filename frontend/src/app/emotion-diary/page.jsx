import { Suspense } from 'react'
import EmotionDiary from '@/components/emotion-diary'

export default function DiaryPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <Suspense fallback={<div>Loading...</div>}>
        <EmotionDiary />
      </Suspense>
    </div>
  )
}
