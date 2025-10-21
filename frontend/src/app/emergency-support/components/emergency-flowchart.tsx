"use client"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon, PhoneIcon, MessageSquareIcon, ArrowRightIcon, ExternalLinkIcon } from "lucide-react"

type StepType = "binary" | "recommendation"

interface FlowStep {
  id: string
  question: string
  type: StepType
  yesNext?: string
  noNext?: string
  recommendation?: {
    title: string
    description: string
    action: string
    urgent?: boolean
    icon: any
    note?: string
    contact?: {
      name: string
      type: "phone" | "web"
      value: string
    }
  }
}

const flowSteps: Record<string, FlowStep> = {
  // 1) 즉시 위험 여부 (예/아니오)
  start: {
    id: "start",
    question: "지금 생명이 즉시 위험하거나 자해 계획/시도가 있나요?",
    type: "binary",
    yesNext: "emergency",
    noNext: "age_check",
  },

  // 2) 즉시 위험 시 119
  emergency: {
    id: "emergency",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "즉시 응급대응이 필요합니다",
      description: "생명이 위험한 상황입니다. 지금 즉시 119에 신고하거나 가까운 응급실로 가세요.",
      action: "119 전화하기",
      urgent: true,
      icon: AlertTriangleIcon,
      contact: { name: "긴급 신고", type: "phone", value: "119" },
    },
  },

  // 2) 연령 확인 (예/아니오)
  age_check: {
    id: "age_check",
    question: "청소년(만 24세 이하)이신가요?",
    type: "binary",
    yesNext: "youth_suicide_check",
    noNext: "adult_suicide_check",
  },

  // 3) 청소년: 자살 관련 여부 (예/아니오)
  youth_suicide_check: {
    id: "youth_suicide_check",
    question: "자살 생각이나 자해 충동에 대한 상담이 필요하신가요?",
    type: "binary",
    yesNext: "youth_suicide",
    noNext: "youth_chat_pref",
  },

  // 5) 청소년: 사이버상담센터
  youth_chat: {
    id: "youth_chat",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "청소년 사이버상담센터를 이용해보세요",
      description: "익명 채팅 상담이 가능하며 24시간 도움을 받을 수 있습니다.",
      action: "채팅 상담 열기",
      urgent: false,
      icon: MessageSquareIcon,
      contact: { name: "사이버상담센터", type: "web", value: "https://www.cyber1388.kr" },
      note: "문자(#1388), 카카오톡(#1388)으로도 상담 가능합니다.",
    },
  },

  // 4) 청소년: 채팅 선호 여부 (예/아니오)
  youth_chat_pref: {
    id: "youth_chat_pref",
    question: "전화보다 채팅 상담이 더 편하신가요?",
    type: "binary",
    yesNext: "youth_chat",
    noNext: "youth_phone",
  },

  // 7) 청소년: 자살예방 상담(1393)
  youth_suicide: {
    id: "youth_suicide",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "자살예방 상담전화 1393",
      description: "전문 상담사가 24시간 상시 대기 중입니다.",
      action: "1393 전화하기",
      urgent: false,
      icon: PhoneIcon,
      contact: { name: "자살예방 상담전화", type: "phone", value: "1393" },
      note: "청소년전화 1388도 24시간 상담 가능하며, 문자/카카오톡 #1388을 이용할 수 있습니다.",
    },
  },

  // 8) 청소년: 1388 전화
  youth_phone: {
    id: "youth_phone",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "청소년전화 1388",
      description: "청소년 고민 전반과 위기상황에 대해 24시간 상담이 가능합니다.",
      action: "1388 전화하기",
      urgent: false,
      icon: PhoneIcon,
      contact: { name: "청소년전화", type: "phone", value: "1388" },
      note: "문자(#1388), 카카오톡(#1388)도 가능합니다.",
    },
  },

  // 5) 성인: 자살 관련 여부 (예/아니오)
  adult_suicide_check: {
    id: "adult_suicide_check",
    question: "자살 생각이나 자해 충동에 대한 상담이 필요하신가요?",
    type: "binary",
    yesNext: "adult_suicide",
    noNext: "adult_crisis_check",
  },

  // 6) 성인: 정신건강 위기 여부 (예/아니오)
  adult_crisis_check: {
    id: "adult_crisis_check",
    question: "심한 불안/공황, 환청·환시 등 정신건강 위기에 해당하나요?",
    type: "binary",
    yesNext: "adult_mental",
    noNext: "adult_welfare_check",
  },

  // 7) 성인: 복지/학대/긴급복지 여부 (예/아니오)
  adult_welfare_check: {
    id: "adult_welfare_check",
    question: "긴급복지, 복지사각지대, 아동·노인 학대 등 복지 관련 상담이신가요?",
    type: "binary",
    yesNext: "adult_welfare",
    noNext: "adult_general",
  },

  // 8) 성인: 정신건강 위기 상담전화
  adult_mental: {
    id: "adult_mental",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "정신건강 위기 상담전화 1577-0199",
      description: "전문 상담사와 24시간 상담이 가능합니다.",
      action: "1577-0199 전화하기",
      urgent: false,
      icon: PhoneIcon,
      contact: { name: "정신건강 위기상담", type: "phone", value: "1577-0199" },
      note: "지역 번호 없이 전국 어디서나 연결됩니다.",
    },
  },

  // (성인 자살 여부 확인 단계는 adult_issue_choice에서 직접 선택)

  // 10) 성인: 자살예방 상담(1393)
  adult_suicide: {
    id: "adult_suicide",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "자살예방 상담전화 1393",
      description: "자살 관련 전문 상담을 24시간 제공합니다.",
      action: "1393 전화하기",
      urgent: false,
      icon: PhoneIcon,
      contact: { name: "자살예방 상담전화", type: "phone", value: "1393" },
      note: "추가로 1588-9191(생명의전화), 109(자살예방)도 이용할 수 있습니다.",
    },
  },

  // (복지 여부 확인 단계는 adult_issue_choice에서 직접 선택)

  // 12) 성인: 보건복지상담센터(129)
  adult_welfare: {
    id: "adult_welfare",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "보건복지상담센터 129",
      description: "긴급복지 지원, 복지사각지대 및 학대 관련 상담을 24시간 제공합니다.",
      action: "129 전화하기",
      urgent: false,
      icon: PhoneIcon,
      contact: { name: "보건복지상담센터", type: "phone", value: "129" },
    },
  },

  // (서울시 민원 여부 확인 단계는 adult_issue_choice에서 직접 선택)

  // (서울시 생활/민원 분기는 제외)

  // 15) 성인: 일반 정서적 지원
  adult_general: {
    id: "adult_general",
    question: "",
    type: "recommendation",
    recommendation: {
      title: "생명의전화 1588-9191",
      description: "정서적 위기, 고민에 대한 24시간 상담을 제공합니다.",
      action: "1588-9191 전화하기",
      urgent: false,
      icon: PhoneIcon,
      contact: { name: "생명의전화", type: "phone", value: "1588-9191" },
    },
  },
}

export default function EmergencyFlowchart() {
  const [currentStep, setCurrentStep] = useState("start")
  const [history, setHistory] = useState<string[]>([])

  const handleAnswer = (answer: "yes" | "no") => {
    const step = flowSteps[currentStep]
    const nextStep = answer === "yes" ? step.yesNext : step.noNext

    if (nextStep) {
      setHistory([...history, currentStep])
      setCurrentStep(nextStep)
    }
  }

  const handleRestart = () => {
    setCurrentStep("start")
    setHistory([])
  }

  const handleBack = () => {
    if (history.length > 0) {
      const previousStep = history[history.length - 1]
      setCurrentStep(previousStep)
      setHistory(history.slice(0, -1))
    }
  }

  const handleContactAction = () => {
    const step = flowSteps[currentStep]
    const contact = step.recommendation?.contact
    if (!contact) return
    if (contact.type === "phone") {
      window.open(`tel:${contact.value}`)
    } else if (contact.type === "web") {
      const url = contact.value.startsWith("http") ? contact.value : `https://${contact.value}`
      window.open(url, "_blank")
    }
  }

  const currentStepData = flowSteps[currentStep]

  return (
    <Card className="shadow-lg backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <ArrowRightIcon className="h-5 w-5 text-red-500" />
          상황별 긴급 가이드
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          몇 가지 질문에 답하시면 상황에 맞는 도움을 안내해드립니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStepData.type === "binary" ? (
          <div className="text-center space-y-6">
            <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                {currentStepData.question}
              </h3>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => handleAnswer("yes")}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-8 py-2"
                >
                  예
                </Button>
                <Button
                  onClick={() => handleAnswer("no")}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-2"
                >
                  아니오
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div
              className={`p-6 rounded-lg ${
                currentStepData.recommendation?.urgent
                  ? "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-300"
                  : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20"
              }`}
            >
              <div className="flex justify-center mb-4">
                {currentStepData.recommendation?.icon && (
                  <currentStepData.recommendation.icon
                    className={`h-12 w-12 ${currentStepData.recommendation.urgent ? "text-red-600" : "text-red-500"}`}
                  />
                )}
              </div>
              <h3
                className={`text-lg font-semibold mb-3 ${
                  currentStepData.recommendation?.urgent
                    ? "text-red-800 dark:text-red-200"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {currentStepData.recommendation?.title}
              </h3>
              <p
                className={`mb-4 ${
                  currentStepData.recommendation?.urgent
                    ? "text-red-700 dark:text-red-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {currentStepData.recommendation?.description}
              </p>
              <div className="space-y-3">
                {currentStepData.recommendation?.contact && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">추천 연락처:</span>
                    <span className="ml-2">
                      {currentStepData.recommendation.contact.name}
                      {": "}
                      {currentStepData.recommendation.contact.type === "phone"
                        ? currentStepData.recommendation.contact.value
                        : currentStepData.recommendation.contact.value}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleContactAction}
                  className="mb-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  {currentStepData.recommendation?.contact?.type === "web" ? (
                    <ExternalLinkIcon className="h-4 w-4" />
                  ) : (
                    <PhoneIcon className="h-4 w-4" />
                  )}
                  {currentStepData.recommendation?.action}
                </Button>

                {currentStepData.recommendation?.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentStepData.recommendation.note}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={history.length === 0}
            className="border-gray-300 text-gray-600 bg-transparent"
          >
            이전
          </Button>
          <Button
            onClick={handleRestart}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
          >
            다시 시작
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
