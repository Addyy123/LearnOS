import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, Activity, CheckCircle2, XCircle, BrainCircuit } from "lucide-react"
import { MasteryChart } from "./MasteryChart"

export default async function LearnerReportPage({ params }: { params: { learnerId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  // Await params per Next.js 15+ 
  const resolvedParams = await params
  const learnerId = resolvedParams.learnerId

  const guardian = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { learners: true }
  })
  
  if (!guardian) redirect("/login")

  // Verify the guardian is actually linked to this learner
  const isLinked = guardian.learners.some(l => l.learnerId === learnerId)
  if (!isLinked && guardian.role !== "ADMIN") {
    redirect("/family")
  }

  const learner = await prisma.user.findUnique({
    where: { id: learnerId },
    include: {
      mastery: {
        include: { concept: true }
      },
      events: {
        orderBy: { occurredAt: 'desc' },
        take: 10,
        include: { concept: true }
      }
    }
  })

  if (!learner) return <div>Learner not found</div>

  const masteryData = learner.mastery.map(m => ({
    name: m.concept.name,
    proficiency: Math.round(m.probability)
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div>
        <Link href="/family" className="inline-flex items-center text-foreground/50 hover:text-foreground transition-colors mb-4 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Family Portal
        </Link>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <User className="w-10 h-10 text-blue-400" />
          {learner.email.split("@")[0]}'s Report
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">
          Detailed overview of {learner.email.split("@")[0]}'s learning progress and recent activities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <BrainCircuit className="w-5 h-5 text-blue-400" /> Overall Proficiency
            </h2>
            <MasteryChart data={masteryData} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-secondary" /> Recent Activity
            </h2>
            
            <div className="space-y-4">
              {learner.events.length === 0 ? (
                <div className="text-center text-foreground/50 py-4">
                  No activity recorded yet.
                </div>
              ) : (
                learner.events.map(event => (
                  <div key={event.id} className="bg-black/20 p-4 rounded-xl border border-[var(--panel-border)] flex items-start gap-3">
                    {event.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : event.isCorrect === false ? (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">
                        {event.eventType}
                      </p>
                      <p className="text-xs text-foreground/60 mb-2">
                        {event.concept.name}
                      </p>
                      <p className="text-xs text-foreground/40">
                        {new Date(event.occurredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
