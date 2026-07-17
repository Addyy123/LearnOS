"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateSpacedRepetition } from "@/lib/algorithms/spacedRepetition"

/**
 * Issuing a versioned attempt requires finding an appropriate question
 * for the selected plan item / concept, and returning it without the answer.
 */
export async function issuePracticeAttempt(planItemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const planItem = await prisma.planItem.findUnique({
    where: { id: planItemId },
    include: { concept: true }
  })

  if (!planItem) throw new Error("Plan item not found")

  // Fetch a question for this concept
  const questionAssets = await prisma.contentAsset.findMany({
    where: { 
      conceptId: planItem.conceptId,
      type: "QUESTION",
      isApproved: true
    }
  })

  if (questionAssets.length === 0) {
    throw new Error("No approved questions available for this concept yet.")
  }

  // Randomly select a question for the attempt
  const selectedAsset = questionAssets[Math.floor(Math.random() * questionAssets.length)]
  const questionBody = JSON.parse(selectedAsset.body)

  // Return versioned attempt (stripping correct answer for client)
  return {
    attemptId: `att_${Date.now()}_${selectedAsset.id}`,
    conceptId: planItem.conceptId,
    assetId: selectedAsset.id,
    questionText: questionBody.question,
    options: questionBody.options
  }
}

/**
 * Submits the response, scores it, records evidence, and updates mastery.
 */
export async function submitPracticeResponse(
  attemptId: string, 
  assetId: string, 
  conceptId: string, 
  planItemId: string,
  selectedAnswerIndex: number, 
  confidenceScore: number
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("Unauthorized")

  // 1. Score deterministically
  const asset = await prisma.contentAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error("Asset not found")
  
  const questionBody = JSON.parse(asset.body)
  const isCorrect = selectedAnswerIndex === questionBody.correctIndex

  // 2. Record evidence
  await prisma.learningEvent.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      conceptId: conceptId,
      eventType: "PRACTICE_ATTEMPT",
      isCorrect,
      confidenceScore // Learner self-reported
    }
  })

  // 3. Update mastery (synchronously for MVP, ideally async later)
  const existingMastery = await prisma.masteryState.findUnique({
    where: {
      userId_conceptId: { userId: user.id, conceptId: conceptId }
    }
  })

  const scorePercentage = isCorrect ? (confidenceScore > 80 ? 100 : 80) : (confidenceScore > 50 ? 20 : 0)

  if (!existingMastery) {
    const sr = calculateSpacedRepetition({
      currentProbability: 0, evidenceCount: 0, easeFactor: 2.5, interval: 0, consecutiveCorrect: 0, scorePercentage
    })
    
    await prisma.masteryState.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        conceptId: conceptId,
        probability: sr.probability,
        evidenceCount: sr.evidenceCount,
        nextReviewDate: sr.nextReviewDate,
        easeFactor: sr.easeFactor,
        interval: sr.interval,
        consecutiveCorrect: sr.consecutiveCorrect,
      }
    })
  } else {
    const m = existingMastery
    const sr = calculateSpacedRepetition({
      currentProbability: m.probability, evidenceCount: m.evidenceCount, easeFactor: m.easeFactor, interval: m.interval, consecutiveCorrect: m.consecutiveCorrect, scorePercentage
    })

    await prisma.masteryState.update({
      where: { userId_conceptId: { userId: user.id, conceptId: conceptId } },
      data: {
        probability: sr.probability, evidenceCount: sr.evidenceCount, nextReviewDate: sr.nextReviewDate, easeFactor: sr.easeFactor, interval: sr.interval, consecutiveCorrect: sr.consecutiveCorrect,
      }
    })
  }

  // 4. If correct and probability is high, update the plan item status
  if (isCorrect) {
    await prisma.planItem.update({
      where: { id: planItemId },
      data: { status: "COMPLETED" }
    })
  } else {
    await prisma.planItem.update({
      where: { id: planItemId },
      data: { status: "IN_PROGRESS" }
    })
    
    // Trigger the background Study Planner Agent asynchronously
    // We don't await this so it doesn't block the UI response
    import("@/modules/learning/agents/StudyPlanner").then(agent => {
      agent.runStudyPlannerAgent(user.id, conceptId)
    }).catch(console.error)
  }

  revalidatePath("/plan")
  revalidatePath("/")

  return { isCorrect, correctAnswerIndex: questionBody.correctIndex, explanation: questionBody.explanation }
}
