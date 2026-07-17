import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/v1/lms/sync
// Payload: { tenantId: "uuid", users: [{ email: "student@school.edu", role: "LEARNER", name: "Alex" }] }
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.LMS_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized LMS API Key" }, { status: 401 })
    }

    const { tenantId, users } = await req.json()
    if (!tenantId || !users || !Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    let syncedCount = 0

    for (const u of users) {
      if (!u.email) continue

      // Upsert user
      await prisma.user.upsert({
        where: { email: u.email },
        create: {
          tenantId: tenantId,
          email: u.email,
          role: u.role || "LEARNER",
          isVerified: true
        },
        update: {
          role: u.role
        }
      })
      syncedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} users to tenant ${tenantId}.`,
      syncedCount
    })

  } catch (error: any) {
    console.error("LMS Sync Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
