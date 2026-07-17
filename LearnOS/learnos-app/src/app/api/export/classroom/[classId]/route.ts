import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "EDUCATOR") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const resolvedParams = await params;

  // Validate the educator owns this classroom
  const classroom = await prisma.classroom.findUnique({
    where: { 
      id: resolvedParams.classId,
      educatorId: session.user.id
    },
    include: {
      enrollments: {
        include: {
          learner: {
            include: {
              mastery: {
                include: { concept: true }
              }
            }
          }
        }
      }
    }
  })

  if (!classroom) {
    return new NextResponse("Not Found", { status: 404 })
  }

  // Generate CSV Data
  const headers = ["Student Email", "Joined Date", "XP", "Streak", "Topics Mastered", "Average Mastery"]
  
  const rows = classroom.enrollments.map(enroll => {
    const learner = enroll.learner as any
    const xp = learner.xp || 0
    const streak = learner.currentStreak || 0
    const mastered = learner.mastery.filter((m: any) => m.probability >= 80).length
    
    let avg = 0
    if (learner.mastery.length > 0) {
      const sum = learner.mastery.reduce((acc: number, m: any) => acc + m.probability, 0)
      avg = Math.round(sum / learner.mastery.length)
    }

    return [
      learner.email,
      new Date(enroll.joinedAt).toISOString(),
      xp,
      streak,
      mastered,
      `${avg}%`
    ].join(",")
  })

  const csvContent = [headers.join(","), ...rows].join("\n")

  // Return as a downloadable file
  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gradebook-${classroom.name.replace(/\s+/g, "_")}.csv"`
    }
  })
}
