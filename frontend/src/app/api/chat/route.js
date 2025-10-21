import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 30

// 감정 분석 함수
function analyzeEmotion(text) {
  const emotions = {
    happy: ["기쁘", "행복", "좋", "즐거", "신나", "웃", "😊", "😄", "😃", "만족", "감사"],
    sad: ["슬프", "우울", "힘들", "지치", "외로", "😢", "😭", "😔", "절망", "허전"],
    angry: ["화나", "짜증", "분노", "열받", "😠", "😡", "🤬", "열받", "분통"],
    anxious: ["불안", "걱정", "긴장", "스트레스", "😟", "😰", "😨", "초조", "두려움"],
    neutral: ["그냥", "보통", "평범", "괜찮", "😐", "😑", "일반"]
  }

  let detectedEmotion = "neutral"
  let maxScore = 0

  Object.entries(emotions).forEach(([emotion, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (text.toLowerCase().includes(keyword) ? 1 : 0)
    }, 0)
    
    if (score > maxScore) {
      maxScore = score
      detectedEmotion = emotion
    }
  })

  return detectedEmotion
}

// 임시 응답 생성 함수
function generateTemporaryResponse(userMessage, detectedEmotion) {
  const responses = {
    happy: [
      "정말 기쁜 일이 있으신 것 같아요! 😊 그런 기쁜 마음을 함께 나눠주셔서 감사해요. 더 많은 좋은 일들이 찾아올 거예요!",
      "와, 정말 기쁘시겠어요! 😄 그런 긍정적인 에너지가 느껴져요. 기쁜 일을 더 오래 기억하고 간직하세요."
    ],
    sad: [
      "마음이 많이 아프시겠어요. 😢 그런 감정을 느끼는 것은 당연해요. 제가 함께 있어드릴게요. 천천히 말씀해 주세요.",
      "힘든 시간을 보내고 계시는군요. 🤗 외로우지 않아요, 제가 들어드릴게요. 언제든 말씀해 주세요."
    ],
    angry: [
      "화가 나실 만한 일이 있었군요. 😌 그런 감정을 느끼는 것은 자연스러워요. 천천히 말씀해 주세요.",
      "짜증나시는 일이 있으셨나요? 😌 화가 날 때는 깊은 숨을 쉬어보세요. 제가 들어드릴게요."
    ],
    anxious: [
      "불안하신 마음을 이해해요. 🧘‍♀️ 함께 차분히 정리해보아요. 어떤 것이 가장 걱정되시나요?",
      "긴장되시는군요. 😌 불안할 때는 천천히 호흡을 해보세요. 제가 함께 있어드릴게요."
    ],
    neutral: [
      "편하게 말씀해 주세요. 🙂 제가 들어드릴게요. 어떤 일이든 괜찮아요.",
      "무슨 생각을 하고 계시나요? 😊 편하게 나누어 주세요. 제가 함께 있어드릴게요."
    ]
  }

  const emotionResponses = responses[detectedEmotion] || responses.neutral
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)]
}

export async function POST(req) {
  const { messages } = await req.json()
  
  // 마지막 사용자 메시지의 감정 분석
  const lastUserMessage = messages.filter(m => m.role === "user").pop()
  const detectedEmotion = lastUserMessage ? analyzeEmotion(lastUserMessage.content) : "neutral"
  
  // API 키가 없을 때 임시 응답 사용
  if (!process.env.OPENAI_API_KEY && !process.env.AI_SDK_OPENAI_API_KEY) {
    const response = generateTemporaryResponse(lastUserMessage?.content || "", detectedEmotion)
    
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: response,
        createdAt: new Date().toISOString()
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  const emotionResponses = {
    happy: "사용자가 기쁜 감정을 표현하고 있습니다. 함께 기뻐하고 격려해주세요. 😊",
    sad: "사용자가 슬픈 감정을 표현하고 있습니다. 따뜻하게 위로하고 공감해주세요. 🤗",
    angry: "사용자가 화난 감정을 표현하고 있습니다. 진정시키고 이해해주세요. 😌",
    anxious: "사용자가 불안한 감정을 표현하고 있습니다. 안심시키고 차분히 정리해주세요. 🧘‍♀️",
    neutral: "사용자가 중립적인 감정을 표현하고 있습니다. 관심을 기울이고 들어주세요. 🙂"
  }

  const emotionContext = emotionResponses[detectedEmotion] || emotionResponses.neutral

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `당신은 감정 공감 전문 AI 상담사입니다. 다음 원칙을 따라 대화하세요:

1. 항상 따뜻하고 공감적인 톤으로 대화하세요
2. 사용자의 감정을 먼저 인정하고 공감해주세요
3. 판단하지 말고 들어주는 자세를 유지하세요
4. 필요시 구체적이고 실용적인 조언을 제공하세요
5. 위기 상황이 감지되면 전문가 도움을 권하세요
6. 한국어로 자연스럽게 대화하세요
7. 너무 길지 않게, 2-3문장으로 답변하세요

현재 감정 분석: ${emotionContext}

사용자가 힘든 감정을 표현할 때는 특히 더 세심하게 공감해주세요.`,
    messages,
  })

  return result.toDataStreamResponse()
}
