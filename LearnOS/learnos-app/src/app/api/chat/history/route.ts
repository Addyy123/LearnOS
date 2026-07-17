import { NextResponse } from "next/server"
import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const sessionUserId = session?.user?.id
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (conversationId) {
      const messages = await prisma.aiMessage.findMany({
        where: {
          conversationId,
          conversation: { userId: session.user.id }
        },
        orderBy: { createdAt: "asc" }
      })
      return NextResponse.json({ messages })
    }

    // Default to latest conversation
    const latestConv = await prisma.aiConversation.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!latestConv) {
      return NextResponse.json({ messages: [], conversationId: null })
    }

    return NextResponse.json({ 
      messages: latestConv.messages, 
      conversationId: latestConv.id 
    })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })
  }
}
