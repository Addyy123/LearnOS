"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createGoal(title: string, targetDateStr?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  let targetDate = null
  if (targetDateStr) {
    targetDate = new Date(targetDateStr)
  }

  await prisma.goal.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      title: title,
      targetDate: targetDate,
      status: "ACTIVE"
    }
  })

  revalidatePath("/")
  return { success: true }
}

export async function completeGoal(goalId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const goal = await prisma.goal.findUnique({
    where: { id: goalId }
  })

  if (!goal || goal.userId !== session.user.id) {
    throw new Error("Unauthorized or Goal Not Found")
  }

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "COMPLETED" }
  })

  revalidatePath("/")
  return { success: true }
}

export async function generateDynamicQuests() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  // Find lowest mastery concepts (up to 3)
  const weakMastery = await prisma.masteryState.findMany({
    where: { userId: user.id },
    orderBy: { probability: 'asc' },
    take: 3,
    include: { concept: true }
  })

  if (weakMastery.length === 0) {
    throw new Error("No concepts being learned yet.")
  }

  const conceptNames = weakMastery.map((m) => m.concept.name).join(", ")

  const prompt = `You are a gamified AI tutor. A student is struggling with or needs to review the following concepts: ${conceptNames}.
Generate exactly 3 short, exciting, action-oriented daily quest titles for them (e.g., "Conquer your weakness in Polynomials", "Defeat the Spelling monster").
Return ONLY a JSON array of strings, like ["Quest 1", "Quest 2", "Quest 3"].`

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate quests.")
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  let parsed: { quests?: string[] } = {}
  try {
    parsed = JSON.parse(content)
    // fallback if AI didn't nest it in "quests" property but returned an array directly
    if (Array.isArray(parsed)) parsed = { quests: parsed }
  } catch (e) {
    // fallback
  }

  const quests = parsed.quests || parsed.items || parsed.titles || []
  
  if (!Array.isArray(quests) || quests.length === 0) {
     // Fallback if AI fails to return proper JSON
     await prisma.goal.create({
       data: { userId: user.id, tenantId: user.tenantId, title: `Master: ${weakMastery[0].concept.name}`, status: "ACTIVE", targetDate: new Date() }
     })
  } else {
    for (const title of quests.slice(0, 3)) {
      await prisma.goal.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          title: String(title).substring(0, 80),
          status: "ACTIVE",
          targetDate: new Date()
        }
      })
    }
  }

  revalidatePath("/")
  return { success: true }
}
