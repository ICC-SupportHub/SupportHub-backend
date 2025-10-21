'use client'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDownIcon, ChevronUpIcon, HelpCircleIcon } from 'lucide-react'

const faqData = [
  {
    question: '상담은 익명으로 가능한가요?',
    answer:
      '네, 모든 상담은 완전히 익명으로 진행됩니다. 개인정보를 요구하지 않으며, 원하시면 가명을 사용하셔도 됩니다. 상담 내용은 철저히 비밀이 보장됩니다.',
  },
  {
    question: '상담 비용은 어떻게 되나요?',
    answer:
      '24시간 위기상담 전화는 모두 무료입니다. 생명의전화(1588-9191), 청소년전화(1388), 정신건강위기상담전화(1577-0199) 모두 무료로 이용하실 수 있습니다.',
  },
  {
    question: '주변 사람이 힘들어할 때 어떻게 도와줄 수 있나요?',
    answer:
      "먼저 진심으로 들어주세요. 판단하지 말고 공감해주는 것이 중요합니다. '혼자가 아니다'는 것을 알려주시고, 전문가의 도움을 받도록 격려해주세요. 응급상황이라면 즉시 119에 신고하세요.",
  },
  {
    question: '응급실에 가면 어떤 도움을 받을 수 있나요?',
    answer:
      '응급실에서는 즉시 의료진의 평가를 받을 수 있습니다. 필요시 정신건강의학과 전문의 상담, 약물 치료, 입원 치료 등을 받을 수 있으며, 사회복지사를 통한 지원 서비스도 연결됩니다.',
  },
  {
    question: '상담 전화를 걸기가 두려워요. 어떻게 해야 하나요?',
    answer:
      "두려움을 느끼는 것은 자연스러운 일입니다. 처음에는 '안녕하세요, 힘든 일이 있어서 전화했어요'라고 간단히 말씀하시면 됩니다. 상담사가 친절하게 안내해드릴 것입니다.",
  },
  {
    question: '가족이나 친구에게 알려지지 않을까요?',
    answer:
      '상담 내용은 절대 외부에 공개되지 않습니다. 상담사는 법적으로 비밀유지 의무가 있으며, 본인의 동의 없이는 어떤 정보도 공유하지 않습니다.',
  },
]

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-200">
          <HelpCircleIcon className="h-5 w-5 text-red-500" />
          자주 묻는 질문
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          많은 분들이 궁금해하시는 질문들을 정리했습니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-slate-200/50 dark:border-slate-600/50"
          >
            <Button
              onClick={() => toggleItem(index)}
              variant="ghost"
              className="w-full justify-between p-4 text-left transition-colors hover:bg-red-50/50 dark:hover:bg-slate-700/50"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {faq.question}
              </span>
              {openItems.includes(index) ? (
                <ChevronUpIcon className="h-4 w-4 text-red-500" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-red-500" />
              )}
            </Button>
            {openItems.includes(index) && (
              <div className="bg-red-50/30 px-4 pb-4 text-gray-600 dark:bg-slate-700/30 dark:text-gray-400">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
