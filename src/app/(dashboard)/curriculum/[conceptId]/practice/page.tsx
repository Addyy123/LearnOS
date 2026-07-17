import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PracticeUI } from "@/components/learning/PracticeUI"
import { GenerateQuizButton } from "@/components/learning/GenerateQuizButton"

export default async function PracticePage({ params }: { params: Promise<{ conceptId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  
  if (!user) redirect("/login")
  
  const { conceptId } = await params;

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    include: {
      assets: {
        where: { type: "QUIZ" }
      }
    }
  })

  if (!concept || concept.tenantId !== user.tenantId) {
    redirect("/curriculum")
  }

  // Get quiz data
  const quizAsset = concept.assets[0]
  if (!quizAsset || !quizAsset.body) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href={`/curriculum/${conceptId}`} className="inline-flex items-center text-foreground/50 hover:text-primary transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lesson
        </Link>
        <GenerateQuizButton conceptId={conceptId} />
      </div>
    )
  }

  const quizData = JSON.parse(quizAsset.body)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link href={`/curriculum/${conceptId}`} className="inline-flex items-center text-foreground/50 hover:text-primary transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lesson
      </Link>
      
      <PracticeUI conceptId={conceptId} conceptName={concept.name} quizData={quizData} />
    </div>
  )
}
