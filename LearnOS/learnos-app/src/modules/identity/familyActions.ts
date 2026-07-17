"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getLinkedLearners() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // For V1 expansion, we allow any authenticated user to act as a guardian
  const guardianLinks = await prisma.guardianLink.findMany({
    where: { guardianId: session.user.id },
    include: {
      learner: {
        include: {
          mastery: {
            include: { concept: true }
          },
          goals: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return guardianLinks.map(link => link.learner)
}

export async function linkLearner(learnerEmail: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const learner = await prisma.user.findUnique({
    where: { email: learnerEmail }
  })

  if (!learner || learner.role !== "LEARNER") {
    throw new Error("Learner not found")
  }

  try {
    await prisma.guardianLink.create({
      data: {
        guardianId: session.user.id,
        learnerId: learner.id
      }
    })
    
    revalidatePath("/family")
    return { success: true }
  } catch (error) {
    // If it's a unique constraint violation, they are already linked
    return { success: false, error: "Learner is already linked or an error occurred." }
  }
}
