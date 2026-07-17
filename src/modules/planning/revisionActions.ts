"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"

export async function getDueRevisions() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("Unauthorized")

  const now = new Date()

  // Find mastery states where nextReviewDate is in the past
  const dueMastery = await prisma.masteryState.findMany({
    where: {
      userId: user.id,
      nextReviewDate: {
        lte: now
      }
    } as any, // Cast to any to bypass missing typings
    include: {
      concept: true
    },
    orderBy: {
      nextReviewDate: 'asc'
    } as any
  })

  // Format into a standard payload
  return dueMastery.map((m: any) => ({
    id: m.id,
    conceptId: m.conceptId,
    conceptName: m.concept.name,
    probability: Math.round(m.probability),
    nextReviewDate: m.nextReviewDate,
    interval: m.interval
  }))
}
