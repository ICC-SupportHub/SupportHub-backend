import { sharedConversations } from "../sharedConversations"

export async function POST(req) {
  try {
    const { messages, title } = await req.json()

    const shareId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    const cleanedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const sharedConversation = {
      id: shareId,
      title: title || "AI와의 대화",
      messages: cleanedMessages,
      createdAt: new Date().toISOString(),
      views: 0,
    }

    sharedConversations.set(shareId, sharedConversation)

    return Response.json({
      success: true,
      shareId,
      shareUrl: `/shared-conversation/${shareId}`,
    })
  } catch (error) {
    return Response.json({ success: false, error: "공유 링크 생성에 실패했습니다." }, { status: 500 })
  }
}

export async function GET(req) {
  const url = new URL(req.url)
  const shareId = url.searchParams.get("id")

  if (!shareId) {
    return Response.json({ success: false, error: "공유 ID가 필요합니다." }, { status: 400 })
  }

  const conversation = sharedConversations.get(shareId)

  if (!conversation) {
    return Response.json({ success: false, error: "공유된 대화를 찾을 수 없습니다." }, { status: 404 })
  }

  conversation.views += 1
  sharedConversations.set(shareId, conversation)

  return Response.json({ success: true, conversation })
}
