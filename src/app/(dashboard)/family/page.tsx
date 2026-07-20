import { getLinkedLearners } from "@/modules/identity/familyActions"
import { Users, PlusCircle, BrainCircuit, Target, Download } from "lucide-react"
import Link from "next/link"
import { Avatar } from "@/components/ui/Avatar"

export default async function FamilyPage() {
  let learners = []
  try {
    learners = await getLinkedLearners()
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-red-400">
        <Users className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>Please log in to view the Family Portal.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" /> Family Portal
          </h1>
          <p className="text-foreground/60 mt-2 text-lg">
            Track your learners' progress, mastery, and goals.
          </p>
        </div>
        <Link href="/family/link">
          <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <PlusCircle className="w-5 h-5" /> Link Learner
          </button>
        </Link>
      </div>

      {/* Learners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learners.length === 0 ? (
          <div className="col-span-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-12 text-center backdrop-blur-xl">
            <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Learners Linked</h3>
            <p className="text-foreground/50 max-w-sm mx-auto mb-6">
              Link your learner's account to start monitoring their progress and mastery.
            </p>
            <Link href="/family/link">
              <button className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 px-6 py-2 rounded-xl font-bold transition-colors">
                Link a Learner Now
              </button>
            </Link>
          </div>
        ) : (
          learners.map(learner => {
            const masteryCount = learner.mastery?.length || 0;
            const avgMastery = masteryCount > 0 
              ? Math.round((learner.mastery.reduce((acc, m) => acc + m.probability, 0) / masteryCount) * 100)
              : 0;
            const activeGoals = learner.goals?.filter(g => g.status === 'ACTIVE').length || 0;

            return (
              <div key={learner.id} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl group hover:border-primary/50 transition-all">
                <Avatar avatarId={(learner as any).avatarId} fallback={(learner as any).displayName || learner.email} size="lg" className="mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {(learner as any).displayName || learner.email.split('@')[0]}
                </h3>
                <p className="text-foreground/60 mb-6 text-sm">
                  {learner.email}
                </p>
                
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                    <BrainCircuit className="w-4 h-4 text-secondary" />
                    {avgMastery}% Avg Mastery
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                    <Target className="w-4 h-4 text-blue-400" />
                    {activeGoals} Active Goals
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="w-full bg-primary/10 text-primary border border-primary/30 px-3 py-2 rounded-xl font-bold text-center text-sm cursor-not-allowed opacity-50" title="Coming soon">
                    Detailed Progress
                  </div>
                  <a href={`/api/export/learner/${learner.id}`} download className="w-full bg-black/20 text-foreground/80 hover:text-foreground hover:bg-black/40 border border-[var(--panel-border)] px-3 py-2 rounded-xl font-bold text-center flex items-center justify-center gap-2 text-sm transition-colors">
                    <Download className="w-4 h-4" /> Export CSV
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
