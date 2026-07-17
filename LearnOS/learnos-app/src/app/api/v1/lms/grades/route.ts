import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/v1/lms/grades?tenantId=uuid
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.LMS_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized LMS API Key" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId parameter" }, { status: 400 })
    }

    const learners = await prisma.user.findMany({
      where: { tenantId, role: "LEARNER" },
      include: {
        mastery: {
          include: { concept: true }
        }
      }
    })

    const grades = learners.map(user => {
      const avgMastery = user.mastery.length > 0 
        ? user.mastery.reduce((acc, m) => acc + m.probability, 0) / user.mastery.length 
        : 0;

      return {
        userId: user.id,
        email: user.email,
        xp: user.xp,
        streak: user.currentStreak,
        averageMastery: Math.round(avgMastery * 100),
        detailedMastery: user.mastery.map(m => ({
          conceptName: m.concept.name,
          probability: m.probability,
          evidenceCount: m.evidenceCount
        }))
      }
    })

    return NextResponse.json({
      success: true,
      tenantId,
      timestamp: new Date().toISOString(),
      data: grades
    })

  } catch (error: any) {
    console.error("LMS Grades Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
