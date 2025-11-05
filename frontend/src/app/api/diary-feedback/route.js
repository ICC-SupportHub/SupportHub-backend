export const runtime = 'nodejs' // openai SDK는 edge 런타임 미지원

import { NextResponse } from 'next/server'

// -------------------------
// 1) 규칙 기반 폴백 엔진
// -------------------------
function ruleFeedback(emotions = [], entry = '') {
  const text = (entry || '').toLowerCase()

  const hit = (words) => words.some(w => text.includes(w))

  const blocks = []

  // 감정 라벨 정규화
  const emoSet = new Set(emotions)

  if (emoSet.has('happy') || emoSet.has('joy')) {
    blocks.push('오늘의 기쁜 순간을 잘 포착하셨어요. 그 장면을 10초만 더 떠올리며 몸에서 느껴지는 편안함을 체크해 보세요.')
  }

  if (emoSet.has('sad') || emoSet.has('depression') || hit(['슬프', '우울', '눈물', '무기력'])) {
    blocks.push('지금의 무거운 마음을 적어 주셔서 고마워요. 감정을 억지로 바꾸기보다, 3분만 조용히 호흡하며 스스로에게 “지금 이런 마음이 드는 건 자연스러워”라고 말해볼까요.')
  }

  if (emoSet.has('anxiety') || emoSet.has('stress') || hit(['불안', '걱정', '초조', '압박', '스트레스'])) {
    blocks.push('불안이 올라올 땐 4-2-6 호흡(들이마시기 4·머물기 2·내쉬기 6)을 6회만 해보세요. 그 다음 오늘 처리할 일을 “가장 작은 한 걸음”으로 쪼개보면 도움이 돼요.')
  }

  if (emoSet.has('loneliness') || hit(['외롭', '혼자', '소속감'])) {
    blocks.push('외로움은 연결 욕구의 신호예요. 오늘 안부를 묻고 싶은 사람 한 명을 정해서 “짧은 메시지 1줄”을 보내보는 건 어떨까요?')
  }

  if (emoSet.has('angry') || hit(['화가', '짜증', '분노'])) {
    blocks.push('화가 났던 장면을 “사실·느낌·요구”로 분리해 적어보세요. 예: 사실(…) 때문에, 느낌(화남/서운함), 요구(다음엔 이렇게 해줬으면).')
  }

  if (hit(['불면', '잠이', '수면', '뒤척'])) {
    blocks.push('오늘 밤은 취침 1시간 전 화면 끄기와 따뜻한 샤워 같은 수면 루틴을 가볍게 시도해 보세요.')
  }

  if (hit(['두근', '심장', '호흡', '숨막'])) {
    blocks.push('신체 감각이 거칠어질 땐 발바닥 감각, 의자 촉감 등을 30초만 관찰해 현재로 앵커링 해봅시다.')
  }

  if (blocks.length === 0) {
    blocks.push('오늘의 기록 정말 잘 하셨어요. 감정은 파도처럼 변해요. “작은 자기돌봄 1가지(물 한 잔, 짧은 산책, 스트레칭)”를 지금 바로 해볼까요?')
  }

  // 2~3문장으로 묶기
  const msg = blocks.slice(0, 3).join(' ')
  return msg
}

// -------------------------
// 2) LLM 프롬프트
// -------------------------
function buildPrompt(emotions, diaryEntry) {
  return `
당신은 한국어로 공감적이고 간결한 상담 피드백을 주는 코치입니다.
원칙:
- 2~4문장, 과장/판단/진단 금지, 현실적인 미시 행동 1개 제안
- CBT/ACT/MBCT/MI 중 하나의 미니 스킬을 녹여서 제시
- 위기(자해/자살/타해/학대/응급) 암시가 있으면: 1문장 공감 후 112/119/1393 등 도움 요청을 안내
- 출력은 순수 텍스트(마크다운/이모지 선택적)

[사용자 감정]: ${JSON.stringify(emotions)}
[일기]: """${diaryEntry?.slice(0, 1200) ?? ''}"""

이 일기에 맞춘 짧은 맞춤 피드백을 작성하세요. 한국어로.
`
}

// -------------------------
// 3) POST 핸들러
// -------------------------
export async function POST(req) {
  try {
    const { emotions = [], diaryEntry = '' } = await req.json()

    // 3-1) 기본 규칙 기반 피드백
    const fallback = ruleFeedback(emotions, diaryEntry)

    // 3-2) OPENAI_API_KEY가 있으면 LLM 시도
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: true, feedback: fallback, source: 'rule' })
    }

    // 동적 import (의존성 없으면 빌드 실패 방지)
    const OpenAIModule = await import('openai').catch(() => null)
    if (!OpenAIModule?.default) {
      return NextResponse.json({ success: true, feedback: fallback, source: 'rule' })
    }

    const OpenAI = OpenAIModule.default
    const client = new OpenAI({ apiKey })

    const prompt = buildPrompt(emotions, diaryEntry)

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 220,
      messages: [
        { role: 'system', content: '당신은 공감적이고 간결한 한국어 멘탈 웰빙 코치입니다.' },
        { role: 'user', content: prompt },
      ],
    })

    const llmText =
      completion?.choices?.[0]?.message?.content?.trim() ||
      fallback

    return NextResponse.json({
      success: true,
      feedback: llmText,
      source: llmText === fallback ? 'rule' : 'llm',
    })
  } catch (e) {
    // 최종 폴백
    return NextResponse.json({
      success: true,
      feedback: '기록해 주셔서 고마워요. 지금의 마음을 존중하며, 4-2-6 호흡 1분과 “가장 작은 한 걸음”을 정해보면 좋아요.',
      source: 'error-fallback',
    })
  }
}
