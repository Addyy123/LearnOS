"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/modules/identity/auth"

export async function getConcepts() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("User not found")

  const concepts = await prisma.concept.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: {
        select: { assets: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return concepts
}

export async function getConceptById(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const concept = await prisma.concept.findUnique({
    where: { id },
    include: {
      assets: {
        where: { isApproved: true },
        select: {
          id: true,
          type: true,
          body: true,
          createdAt: true
        }
      }
    }
  })

  return concept
}

export async function startConceptLearning(conceptId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("User not found")

  // Check if mastery state exists, if not create one with 0 probability
  let mastery = await prisma.masteryState.findUnique({
    where: {
      userId_conceptId: {
        userId: user.id,
        conceptId: conceptId
      }
    }
  })

  if (!mastery) {
    mastery = await prisma.masteryState.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        conceptId: conceptId,
        probability: 0.0,
      }
    })
  }

  return mastery
}
