// app/api/diary-feedback/route.js
import { NextResponse } from 'next/server'

// 프론트에서 사용하는 감정 키(최대 3개까지 받음)
const EMOTIONS = [
  'happy', 'joy', 'sad', 'depression', 'loneliness',
  'angry', 'stress', 'anxiety', 'self-criticism', 'neutral', 'general',
]

// 한국어 라벨 → 내부 키 (혹시 한글이 들어와도 처리)
const ko2key = {
  '외로움': 'loneliness',
  '불안': 'anxiety',
  '우울': 'depression',
  '스트레스': 'stress',
  '자기비난': 'self-criticism',
  '분노': 'angry',
  '슬픔': 'sad',
  '기쁨': 'happy',
  '즐거움': 'joy',
  '평온': 'neutral',
  '일반': 'general',
}

function normalizeEmotions(input) {
  if (!Array.isArray(input)) return []
  const mapped = input.map(e => (ko2key[e] || e)).filter(e => EMOTIONS.includes(e))
  // 유니크 + 최대 3개
  return Array.from(new Set(mapped)).slice(0, 3)
}

// 아주 간단한 위기 신호 감지(서버 1차 룰)
const CRISIS_RE = /(자살|자해|끝내버리|죽고|해치|과다복용|뛰어내리|유서|kill myself|suicide)/i
function detectSafetyLevel(text, emotions) {
  if (CRISIS_RE.test(text || '')) return 'crisis'
  if ((emotions || []).some(e => ['depression','loneliness','anxiety'].includes(e))) return 'check-in'
  return 'ok'
}

function feedbackForEmotion(e) {
  const f = {
    happy: '기쁜 마음을 기록해줘서 좋아요! 😊 이런 에너지를 작은 행동으로 이어가봐요.',
    joy: '즐거웠던 순간을 잘 붙잡았네요 😆 그 장면을 1~2문장 더 구체화해보면 기억에 오래 남아요.',
    sad: '슬픈 마음을 표현해줘서 고마워요. 😢 지금은 스스로를 조금 더 다정하게 대할 시간이에요.',
    depression: '우울감이 느껴질 때는 아주 작은 행동 1개만 정해봐요. (예: 4-2-6 호흡 1분) 😔',
    loneliness: '외로움이 올라왔군요. 💙 오늘은 안부 메시지 1줄만 보내보는 건 어때요?',
    angry: '화가 난 자신을 알아차렸어요. 😠 짧은 호흡 후 ‘사실-느낌-요구’로 문장 1개를 써보세요.',
    stress: '스트레스가 높군요. 😤 15분 타이머로 가장 쉬운 할 일 1개부터 시작해요.',
    anxiety: '불안이 올라왔네요. 😟 4-2-6 호흡 3세트 후 몸 감각을 한 단어로 적어보세요.',
    'self-criticism': '스스로에게 엄격했군요. 😞 친한 친구에게 하듯 자신에게 2문장만 다정하게 써봐요.',
    neutral: '오늘의 감정을 관찰해주셨네요. 🙂 이 꾸준함이 큰 힘이 됩니다.',
    general: '기록을 남겨줘서 고마워요. 💭 오늘 배운 점 1가지를 적어두면 좋겠어요.',
  }
  return f[e] ?? '기록 고마워요. 오늘의 작은 한 걸음을 정해볼까요?'
}

function feedbackForMulti(emotions) {
  if (!emotions || emotions.length === 0) {
    return '감정을 기록해줘서 고마워요. 🙂 꾸준히 적는 것만으로도 도움돼요.'
  }
  if (emotions.length === 1) return feedbackForEmotion(emotions[0])

  const hasPos = emotions.some(e => ['happy','joy','neutral'].includes(e))
  const hasNeg = emotions.some(e =>
    ['sad','angry','anxiety','depression','loneliness','stress','self-criticism'].includes(e)
  )

  if (hasPos && hasNeg) {
    return '기쁨과 어려운 감정이 함께 있네요. 😊😢 복잡함은 자연스러워요. 각각을 한 문장씩 적어 분리해보면 도움이 돼요.'
  }
  if (hasPos) {
    return '긍정 감정이 여러 개 보이네요! 😊 작은 감사 리스트 3개를 적어보면 좋아요.'
  }
  if (hasNeg) {
    return '여러 어려운 감정이 겹쳐 있군요. 😔 지금은 가장 부담이 적은 한 걸음부터 시작해요(호흡 1분, 물 한 잔).'
  }
  return '다양한 감정을 잘 포착했어요. 🙂 감정마다 한 단어 라벨을 붙여 두면 다음에 도움이 돼요.'
}

// 일기 본문에 붙일 수 있는 짧은 제안문(칩)
function makeSuggestions(emotions, safetyLevel) {
  if (safetyLevel === 'crisis') {
    return ['지금은 안전이 최우선이에요. 112/119/1393에 즉시 연락을 고려해요.']
  }
  const base = []
  if (emotions.includes('stress')) base.push('15분 타이머로 가장 쉬운 일 1개 시작')
  if (emotions.includes('anxiety')) base.push('4-2-6 호흡 3세트 후 몸 감각 한 단어 쓰기')
  if (emotions.includes('loneliness')) base.push('안부 메시지 1줄 보내기')
  if (emotions.includes('depression')) base.push('씻기/물 마시기 같은 2분짜리 행동 1개')
  if (emotions.includes('self-criticism')) base.push('친구에게 하듯 내게 2문장 다정하게 쓰기')
  if (base.length === 0) base.push('오늘 배운 점 1가지를 한 줄로 적기')
  return base.slice(0, 4)
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const emotions = normalizeEmotions(body?.emotions)
    const diaryEntry = typeof body?.diaryEntry === 'string' ? body.diaryEntry.trim() : ''

    // (선택) 간단 검증: 프론트에서 이미 체크하지만 방어적으로
    if (emotions.length === 0 || !diaryEntry) {
      return NextResponse.json(
        { success: false, message: '감정 1개 이상과 일기 내용을 보내주세요.' },
        { status: 400 }
      )
    }

    const safetyLevel = detectSafetyLevel(diaryEntry, emotions)
    const feedback = feedbackForMulti(emotions)
    const suggestions = makeSuggestions(emotions, safetyLevel)

    return NextResponse.json({
      success: true,
      feedback,
      suggestions,   // ← 네 컴포넌트가 칩으로 붙여 쓸 수 있음
      safetyLevel,   // ← 원하면 배너/토스트로 활용
    })
  } catch (e) {
    console.error('diary-feedback error:', e)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
