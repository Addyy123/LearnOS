"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

import { calculateSpacedRepetition } from "@/lib/algorithms/spacedRepetition"

export async function submitPracticeResults(conceptId: string, scorePercentage: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  // 1. Record the LearningEvent
  await prisma.learningEvent.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      conceptId: conceptId,
      eventType: "PRACTICE_QUIZ",
      isCorrect: scorePercentage >= 70, // Basic passing threshold
      confidenceScore: scorePercentage // We store percentage as confidence score
    }
  })

  // 2. Update MasteryState
  const existingMastery = await prisma.masteryState.findUnique({
    where: {
      userId_conceptId: {
        userId: user.id,
        conceptId: conceptId
      }
    }
  })

  if (!existingMastery) {
    const srOutput = calculateSpacedRepetition({
      currentProbability: 0,
      evidenceCount: 0,
      easeFactor: 2.5,
      interval: 0,
      consecutiveCorrect: 0,
      scorePercentage
    })

    await prisma.masteryState.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        conceptId: conceptId,
        probability: srOutput.probability,
        evidenceCount: srOutput.evidenceCount,
        nextReviewDate: srOutput.nextReviewDate,
        easeFactor: srOutput.easeFactor,
        interval: srOutput.interval,
        consecutiveCorrect: srOutput.consecutiveCorrect,
      } as any // cast to any to bypass TS error due to failed prisma generate
    })
  } else {
    // Cast existingMastery to any since generated types might be missing new fields
    const m = existingMastery as any
    const srOutput = calculateSpacedRepetition({
      currentProbability: m.probability,
      evidenceCount: m.evidenceCount,
      easeFactor: m.easeFactor ?? 2.5,
      interval: m.interval ?? 0,
      consecutiveCorrect: m.consecutiveCorrect ?? 0,
      scorePercentage
    })

    await prisma.masteryState.update({
      where: {
        userId_conceptId: {
          userId: user.id,
          conceptId: conceptId
        }
      },
      data: {
        probability: srOutput.probability,
        evidenceCount: srOutput.evidenceCount,
        nextReviewDate: srOutput.nextReviewDate,
        easeFactor: srOutput.easeFactor,
        interval: srOutput.interval,
        consecutiveCorrect: srOutput.consecutiveCorrect,
      } as any // cast to any to bypass TS error
    })
  }

  // 3. Trigger Gamification XP & Streaks
  await triggerGamification(user.id, scorePercentage)

  // 4. Revalidate the dashboard and curriculum pages so rings update immediately!
  revalidatePath("/")
  revalidatePath("/curriculum")
  revalidatePath(`/curriculum/${conceptId}`)
  
  return { success: true }
}

async function triggerGamification(userId: string, scorePercentage: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, currentStreak: true, lastActiveDate: true }
  }) as any // cast for missing types if not generated

  if (!user) return

  const now = new Date()
  let newStreak = user.currentStreak || 0
  let newXp = (user.xp || 0) + (scorePercentage > 0 ? Math.round(scorePercentage) : 10) // Base 10 XP minimum

  if (user.lastActiveDate) {
    const lastActive = new Date(user.lastActiveDate)
    const diffTime = Math.abs(now.getTime() - lastActive.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Active yesterday, increment streak
      newStreak += 1
    } else if (diffDays > 1) {
      // Missed a day, reset streak
      newStreak = 1
    }
    // If diffDays === 0, they were active today, streak remains the same
  } else {
    // First time activity
    newStreak = 1
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      currentStreak: newStreak,
      lastActiveDate: now
    } as any
  })
}

export async function getEarnedCertificates() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  // Find all mastery states where probability >= 80
  const masteryStates = await prisma.masteryState.findMany({
    where: {
      userId: user.id,
      probability: { gte: 80 }
    },
    include: {
      concept: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  })

  // Format into a certificate payload
  return masteryStates.map(m => ({
    id: m.id,
    conceptName: m.concept.name,
    learnerName: user.email.split("@")[0], // Fallback name based on email since we lack a name field
    dateEarned: m.updatedAt.toISOString(),
    score: Math.round(m.probability)
  }))
}
