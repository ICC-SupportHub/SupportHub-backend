// 간단한 감정 일기 저장 API
export async function POST(req) {
  const { emotions, diaryEntry } = await req.json()

  // 감정별 피드백 생성
  const getEmotionFeedback = (emotion) => {
    const feedbacks = {
      happy: "기쁜 마음을 기록해주셔서 좋아요! 😊 그런 긍정적인 에너지를 계속 간직하세요.",
      sad: "힘든 감정을 표현해주셔서 고마워요. 😢 그런 마음이 이해돼요. 조금씩 나아질 거예요.",
      angry: "화가 나는 감정을 기록해주셨네요. 😌 그런 감정을 느끼는 것은 자연스러워요.",
      anxious: "불안한 마음을 나눠주셔서 고마워요. 😟 함께 차분히 정리해보아요.",
      neutral: "오늘의 감정을 기록해주셨네요. 🙂 꾸준히 감정을 기록하는 것이 좋아요."
    }
    return feedbacks[emotion] || feedbacks.neutral
  }

  // 다중 감정에 대한 피드백 생성
  const getMultiEmotionFeedback = (emotions) => {
    if (!emotions || emotions.length === 0) {
      return "감정을 기록해주셔서 고마워요. 🙂 꾸준히 감정을 기록하는 것이 좋아요."
    }
    
    if (emotions.length === 1) {
      return getEmotionFeedback(emotions[0])
    }
    
    // 여러 감정이 섞여있을 때의 피드백
    const hasPositive = emotions.includes('happy')
    const hasNegative = emotions.some(e => ['sad', 'angry', 'anxious'].includes(e))
    
    if (hasPositive && hasNegative) {
      return "복잡한 감정들을 기록해주셨네요. 😊😢 기쁨과 슬픔이 함께하는 것도 자연스러운 일이에요. 모든 감정을 받아들이고 스스로를 돌봐주세요."
    } else if (hasPositive) {
      return "여러 긍정적인 감정들을 느끼고 계시네요! 😊✨ 그런 좋은 에너지를 계속 간직하세요."
    } else if (hasNegative) {
      return "여러 어려운 감정들을 겪고 계시는군요. 😢💪 그런 마음들을 표현해주셔서 고마워요. 조금씩 나아질 거예요."
    } else {
      return "다양한 감정들을 기록해주셨네요. 🙂 감정의 변화를 인식하고 기록하는 것이 중요해요."
    }
  }

  // 실제로는 여기서 데이터베이스에 저장하겠지만, 테스트용으로 간단하게 처리
  const feedback = getMultiEmotionFeedback(emotions)
  
  // 로컬 스토리지에 저장할 데이터 (실제로는 서버 DB에 저장)
  const diaryData = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    emotions: emotions,
    content: diaryEntry,
    feedback: feedback
  }

  // 개발용: 콘솔에 저장된 데이터 출력
  console.log("저장된 일기 데이터:", diaryData)

  return Response.json({ 
    success: true, 
    feedback: feedback,
    data: diaryData
  })
}
