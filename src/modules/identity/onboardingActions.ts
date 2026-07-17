"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function submitConsent(ageRegion: string, consentGiven: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!consentGiven) {
    throw new Error("Consent is required to use this platform.")
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ageRegion,
      consentStatus: "GRANTED"
    }
  })

  return { success: true }
}

export async function submitGoals(goals: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("Unauthorized")

  for (const title of goals) {
    await prisma.goal.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        title
      }
    })
  }

  return { success: true }
}

export async function selectSubjectAndCompleteOnboarding(conceptId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    include: { tenant: true }
  })
  if (!user) throw new Error("Unauthorized")

  const concept = await prisma.concept.findUnique({ where: { id: conceptId } })

  // 1. Create a Learning Plan for this subject
  const plan = await prisma.plan.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      title: concept ? `${concept.name} Study Plan` : "Initial Study Plan"
    }
  })

  // Add the initial concept to the plan if selected
  if (concept) {
    await prisma.planItem.create({
      data: {
        planId: plan.id,
        conceptId: concept.id,
        status: "PENDING",
        order: 1
      }
    })
  }

  // 2. Mark onboarding as completed
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true }
  })

  revalidatePath("/")
  
  if (concept) {
    redirect(`/diagnostic?conceptId=${concept.id}`)
  } else {
    redirect("/")
  }
}
