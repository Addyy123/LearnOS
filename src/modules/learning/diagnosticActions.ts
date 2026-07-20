"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getDiagnosticQuestions(conceptId?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  // Fetch quizzes from the tenant's curriculum
  const assets = await prisma.contentAsset.findMany({
    where: { 
      tenantId: user.tenantId,
      type: "QUIZ",
      ...(conceptId ? { conceptId } : {})
    }
  })

  // Parse JSON bodies (which are arrays of questions)
  const allQuestions: any[] = []
  
  for (const a of assets) {
    try {
      const dataArray = JSON.parse(a.body)
      if (Array.isArray(dataArray)) {
        for (const data of dataArray) {
          allQuestions.push({
            id: a.id + "-" + allQuestions.length,
            text: data.question,
            options: data.options,
            correctAnswerIndex: data.answerIndex !== undefined ? data.answerIndex : data.options.indexOf(data.answer)
          })
        }
      } else {
        // Fallback if it's a single object
        allQuestions.push({
          id: a.id,
          text: dataArray.question,
          options: dataArray.options,
          correctAnswerIndex: dataArray.answerIndex !== undefined ? dataArray.answerIndex : dataArray.options.indexOf(dataArray.answer)
        })
      }
    } catch (e) {
      console.error("Failed to parse quiz asset", a.id)
    }
  }

  // Shuffle and take up to 5 questions
  return allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5)
}

export async function submitDiagnostic(score: number, conceptId?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { tenant: { include: { concepts: true } } }
  })
  if (!user) throw new Error("Unauthorized")

  const baseProbability = score

  // If a specific concept was selected, only calibrate that one. Otherwise calibrate all.
  const conceptsToUpdate = conceptId 
    ? user.tenant.concepts.filter(c => c.id === conceptId) 
    : user.tenant.concepts

  for (const concept of conceptsToUpdate) {
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
