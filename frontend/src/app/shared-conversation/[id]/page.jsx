"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BotIcon, UserIcon, ShareIcon, EyeIcon } from "lucide-react"
import Link from "next/link"

export default function SharedConversationPage() {
  const params = useParams()
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch(`/api/share-conversation?id=${params.id}`)
        const data = await response.json()

        if (data.success) {
          setConversation(data.conversation)
        } else {
          setError(data.error || "대화를 불러올 수 없습니다.")
        }
      } catch (err) {
        setError("대화를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchConversation()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대화를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">대화를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/">
              <Button className="bg-purple-600 hover:bg-purple-700">홈으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{conversation.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>{new Date(conversation.createdAt).toLocaleDateString("ko-KR")}</span>
              <div className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <span>{conversation.views}회 조회</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ShareIcon className="h-4 w-4" />
              <span>공유된 대화</span>
            </div>
            <Link href="/ai-chat">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                AI와 대화하기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-6 max-w-3xl mx-auto">
          {conversation.messages.map((message, index) => (
            <div key={index} className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  className={message.role === "user" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}
                >
                  {message.role === "user" ? <UserIcon className="h-4 w-4" /> : <BotIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t bg-gray-50 dark:bg-gray-800 p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          이 대화는 SupportHub에서 AI와 나눈 감정 공감 대화입니다.
        </p>
        <Link href="/ai-chat">
          <Button className="bg-purple-600 hover:bg-purple-700">나도 AI와 대화해보기</Button>
        </Link>
      </div>
    </div>
  )
}
