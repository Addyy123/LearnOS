import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This would typically be secured by a CRON secret in a real environment
export async function GET(req: Request) {
  try {
    // 1. Find all active users
    const users = await prisma.user.findMany({
      where: { role: "LEARNER" },
      include: {
        mastery: true,
        conversations: {
          include: {
            messages: {
              where: { safetyFlag: true }
            }
          }
        }
      }
    })

    let createdAlerts = 0

    for (const user of users) {
      const activeAlerts = await prisma.interventionAlert.count({
        where: { userId: user.id, status: "OPEN" }
      })

      // Skip if they already have an open alert
      if (activeAlerts > 0) continue

      let reason = null

      // Check 1: Safety flags (e.g. frustration, prompt injection)
      const safetyFlagsCount = user.conversations.reduce((acc, conv) => acc + conv.messages.length, 0)
      if (safetyFlagsCount >= 3) {
        reason = `Multiple safety flags triggered (${safetyFlagsCount} incidents)`
      }

      // Check 2: Low mastery probability on core concepts
      const strugglingConcepts = user.mastery.filter(m => m.evidenceCount > 5 && m.probability < 0.4)
      if (strugglingConcepts.length > 2 && !reason) {
        reason = `Struggling with ${strugglingConcepts.length} core concepts (low mastery despite practice)`
      }

      // If at risk, generate an alert
      if (reason) {
        await prisma.interventionAlert.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            reason: reason,
          }
        })
        createdAlerts++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Evaluated ${users.length} learners. Generated ${createdAlerts} new intervention alerts.`,
      alertsCreated: createdAlerts
    })

  } catch (error: any) {
    console.error("Cron Evaluation Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
