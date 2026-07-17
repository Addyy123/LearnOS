"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getDiagnosticQuestions() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  // Fetch some questions from the tenant's curriculum
  const assets = await prisma.contentAsset.findMany({
    where: { 
      tenantId: user.tenantId,
      type: "QUESTION"
    },
    take: 5 // Get 5 random questions for diagnostic
  })

  // Parse JSON bodies
  return assets.map(a => {
    const data = JSON.parse(a.body)
    return {
      id: a.id,
      text: data.question,
      options: data.options,
      correctAnswerIndex: data.options.indexOf(data.answer)
    }
  })
}

export async function submitDiagnostic(score: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { tenant: { include: { concepts: true } } }
  })
  if (!user) throw new Error("Unauthorized")

  // For MVP, we apply the baseline score equally across all tenant concepts.
  // E.g., if they got 60% on the diagnostic, we set 60% probability for all core concepts.
  const baseProbability = score

  for (const concept of user.tenant.concepts) {
    await prisma.masteryState.upsert({
      where: {
        userId_conceptId: {
          userId: user.id,
          conceptId: concept.id
        }
      },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        conceptId: concept.id,
        probability: baseProbability,
        evidenceCount: 1
      },
      update: {
        probability: baseProbability,
        evidenceCount: { increment: 1 }
      }
    })

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        conceptId: concept.id,
        eventType: "DIAGNOSTIC",
        isCorrect: score > 50,
        confidenceScore: 3 // Baseline confidence
      }
    })
  }

  revalidatePath("/")
  return { success: true }
}
