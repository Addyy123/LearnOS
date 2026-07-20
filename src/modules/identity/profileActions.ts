"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateUserProfile(data: { displayName?: string, avatarId?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Ensure they only update valid fields
  const updateData: any = {}
  if (data.displayName !== undefined) updateData.displayName = data.displayName
  if (data.avatarId !== undefined) updateData.avatarId = data.avatarId

  if (Object.keys(updateData).length === 0) return { success: true }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData
  })

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath("/leaderboard")
  
  return { success: true }
}
