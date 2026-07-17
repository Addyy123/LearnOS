import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

    const { learnerId } = await params;

    const guardianLink = await prisma.guardianLink.findUnique({
      where: {
        guardianId_learnerId: {
          guardianId: session.user.id,
          learnerId: learnerId
        }
      },
      include: {
        learner: {
          include: {
            mastery: {
              include: { concept: true }
            },
            goals: true
          }
        }
      }
    })

    if (!guardianLink) return new Response("Forbidden or Learner not found", { status: 403 })

    const learner = guardianLink.learner;

    // Generate CSV
    let csv = "Learner Email,Concept,Mastery Level (%),Evidence Count,Last Updated\n"

    if (learner.mastery.length === 0) {
      csv += `"${learner.email}","No data",0,0,""\n`
    } else {
      learner.mastery.forEach(m => {
        const conceptName = m.concept.name
        const masteryLevel = Math.round(m.probability * 100)
        const date = new Date(m.updatedAt).toLocaleDateString()
        csv += `"${learner.email}","${conceptName}",${masteryLevel},${m.evidenceCount},"${date}"\n`
      })
    }

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="learner_${learner.email.split('@')[0]}_report.csv"`
      }
    })
  } catch (error) {
    console.error("CSV Export Error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
