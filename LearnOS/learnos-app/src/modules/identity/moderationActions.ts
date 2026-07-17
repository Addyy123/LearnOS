"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getFlaggedMessages() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  // Ensure the user is an admin
  if (admin?.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  const flaggedMessages = await prisma.aiMessage.findMany({
    where: {
      safetyFlag: true
    },
    include: {
      conversation: {
        include: {
          user: {
            select: { email: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return flaggedMessages
}

export async function dismissFlag(messageId: string) {
  const session = await auth()
  const admin = await prisma.user.findUnique({ where: { id: session?.user?.id || "" } })
  if (admin?.role !== "ADMIN") throw new Error("Forbidden")

  await prisma.aiMessage.update({
    where: { id: messageId },
    data: { safetyFlag: false }
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function suspendUser(userId: string) {
  const session = await auth()
  const admin = await prisma.user.findUnique({ where: { id: session?.user?.id || "" } })
  if (admin?.role !== "ADMIN") throw new Error("Forbidden")

  // For MVP, we can "suspend" a user by changing their role or deleting them. 
  // Let's just append " (SUSPENDED)" to their role.
  await prisma.user.update({
    where: { id: userId },
    data: { role: "LEARNER_SUSPENDED" }
  })

  revalidatePath("/admin")
  return { success: true }
}
