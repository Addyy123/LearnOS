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
