import { Flame, Trophy, Play, CheckCircle2, Lock, Target, Rocket, BookOpen, Zap } from "lucide-react"
import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      xp: true,
      currentStreak: true,
      displayName: true,
      avatarId: true,
      mastery: true,
      plans: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      tenant: {
        include: {
          concepts: { orderBy: { createdAt: 'asc' } }
        }
      }
    }
  } as any)

  if (!user) redirect("/login")

  const streak = (user as any).currentStreak || 0
  const xp = (user as any).xp || 0
  const email = (user as any).email as string | null
  const rawDisplayName = (user as any).displayName as string | null

  // Smart name: use displayName if set, else extract from email, but never show UUID guest IDs
  let displayName: string
  if (rawDisplayName) {
    displayName = rawDisplayName
  } else if (email && !email.startsWith("guest_")) {
    displayName = email.split('@')[0]
  } else {
    displayName = "Learner"
  }

  // Personalize path based on active plan
  let concepts = (user as any).tenant.concepts as any[]
  const mastery = (user as any).mastery as any[]

  if ((user as any).plans && (user as any).plans.length > 0) {
    const activePlan = (user as any).plans[0]
    const planConceptIds = activePlan.items.map((item: any) => item.conceptId)
    concepts = [...concepts].sort((a, b) => {
      const aIn = planConceptIds.includes(a.id)
      const bIn = planConceptIds.includes(b.id)
      if (aIn && !bIn) return -1
      if (!aIn && bIn) return 1
      return 0
    })
  }

  // Find next active concept
  const masteredIds = mastery.filter((m: any) => m.probability >= 80).map((m: any) => m.conceptId)
  const activeConcept = concepts.find((c: any) => !masteredIds.includes(c.id))
  const masteredCount = masteredIds.length

  // Winding path offset pattern
  const getOffsetClass = (index: number) => {
    const pattern = [
      "ml-0", "ml-8 md:ml-16", "ml-16 md:ml-32", "ml-8 md:ml-16",
      "ml-0", "-ml-8 md:-ml-16", "-ml-16 md:-ml-32", "-ml-8 md:-ml-16"
    ]
    return pattern[index % pattern.length]
  }

  let firstUnmasteredFound = false

  return (
    <div className="w-full flex flex-col items-center pb-24">

      {/* ── HERO SECTION ── */}
      <div className="w-full max-w-2xl mb-8">
        {/* Top bar: greeting + stats */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              Hey, {displayName}! 👋
            </h1>
            <p className="text-sm text-foreground/50 font-medium mt-0.5">
              {activeConcept ? `Up next: ${activeConcept.name}` : "All concepts mastered! 🎉"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 font-bold text-sm px-4 py-2 rounded-xl border border-orange-500/20">
              <Flame className="w-4 h-4" />
              <span>{streak} day streak</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 font-bold text-sm px-4 py-2 rounded-xl border border-yellow-500/20">
              <Trophy className="w-4 h-4" />
              <span>{xp} XP</span>
            </div>
          </div>
        </div>

        {/* Big CTA Start Button */}
        {activeConcept ? (
          <Link href={`/curriculum/${activeConcept.id}/practice`}>
            <div className="w-full group bg-primary hover:brightness-110 transition-all rounded-2xl p-6 flex items-center justify-between cursor-pointer shadow-xl shadow-primary/25 active:scale-[0.99]">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Continue Learning</p>
                  <p className="text-white font-black text-xl leading-tight">{activeConcept.name}</p>
                  <p className="text-white/50 text-sm font-medium mt-0.5">{masteredCount} of {concepts.length} concepts mastered</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors shrink-0">
                <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
              </div>
            </div>
          </Link>
        ) : (
          <div className="w-full bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-secondary" />
            </div>
            <div>
              <p className="text-secondary font-black text-xl">All caught up!</p>
              <p className="text-foreground/50 text-sm mt-0.5">Check back for new content from your educator.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── PROGRESS ROW ── */}
      <div className="w-full max-w-2xl mb-8 grid grid-cols-3 gap-4">
        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 flex flex-col items-center text-center">
          <BookOpen className="w-6 h-6 text-primary mb-2" />
          <span className="font-black text-2xl text-foreground">{masteredCount}</span>
          <span className="text-xs text-foreground/50 font-bold uppercase tracking-wider mt-0.5">Mastered</span>
        </div>
        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 flex flex-col items-center text-center">
          <Zap className="w-6 h-6 text-yellow-500 mb-2" />
          <span className="font-black text-2xl text-foreground">{xp}</span>
          <span className="text-xs text-foreground/50 font-bold uppercase tracking-wider mt-0.5">Total XP</span>
        </div>
        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 flex flex-col items-center text-center">
          <Flame className={`w-6 h-6 mb-2 ${streak > 0 ? "text-orange-500" : "text-foreground/20"}`} />
          <span className={`font-black text-2xl ${streak > 0 ? "text-orange-500" : "text-foreground"}`}>{streak}</span>
          <span className="text-xs text-foreground/50 font-bold uppercase tracking-wider mt-0.5">Day Streak</span>
        </div>
      </div>

      {/* ── DAILY QUESTS ── */}
      <div className="w-full max-w-2xl mb-12 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5">
        <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Daily Quests
        </h2>
        <div className="space-y-4">
          {/* Quest 1 */}
          <div>
            <div className="flex items-center justify-between text-sm font-bold mb-2">
              <span className="text-foreground/80">Earn 50 XP today</span>
              <span className={xp >= 50 ? "text-secondary flex items-center gap-1" : "text-foreground/40"}>
                {Math.min(xp, 50)} / 50 {xp >= 50 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${xp >= 50 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${Math.min((xp / 50) * 100, 100)}%` }} />
            </div>
          </div>
          {/* Quest 2 */}
          <div>
            <div className="flex items-center justify-between text-sm font-bold mb-2">
              <span className="text-foreground/80">Build a 2-day streak</span>
              <span className={streak >= 2 ? "text-secondary flex items-center gap-1" : "text-foreground/40"}>
                {Math.min(streak, 2)} / 2 {streak >= 2 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${streak >= 2 ? 'bg-secondary' : 'bg-orange-500'}`} style={{ width: `${Math.min((streak / 2) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── LEARNING PATH ── */}
      {concepts.length > 0 && (
        <div className="w-full max-w-2xl mb-6">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Your Learning Path
            <span className="ml-auto text-xs font-bold text-foreground/40 normal-case tracking-normal">
              {masteredCount} / {concepts.length} complete
            </span>
          </h2>
        </div>
      )}

      <div className="flex flex-col items-center w-full relative">
        {concepts.length === 0 && (
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl text-center p-8 w-full max-w-2xl">
            <h3 className="text-lg font-bold text-foreground mb-2">No Content Yet</h3>
            <p className="text-sm text-foreground/50">Ask your educator to add concepts to the curriculum.</p>
          </div>
        )}

        {concepts.map((concept: any, index: number) => {
          const m = mastery.find((m: any) => m.conceptId === concept.id)
          const isMastered = m && m.probability >= 80
          let status: "MASTERED" | "ACTIVE" | "LOCKED" = "LOCKED"
          if (isMastered) {
            status = "MASTERED"
          } else if (!firstUnmasteredFound) {
            status = "ACTIVE"
            firstUnmasteredFound = true
          }

          const offsetClass = getOffsetClass(index)
          const isLast = index === concepts.length - 1

          return (
            <div key={concept.id} className={`flex flex-col items-center relative ${offsetClass}`}>
              {!isLast && (
                <div className="w-1 h-12 bg-[var(--panel-border)] absolute top-16 left-1/2 -translate-x-1/2 rounded-full" />
              )}

              {status === "ACTIVE" ? (
                <div className="relative my-3 group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-lg font-bold text-xs shadow-sm animate-bounce whitespace-nowrap z-20">
                    START
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
                  </div>
                  <Link href={`/curriculum/${concept.id}/practice`}>
                    <button className="w-16 h-16 bg-primary border-b-4 border-primary/60 rounded-full flex items-center justify-center text-white shadow-md active:translate-y-1 active:border-b-0 transition-all hover:brightness-110 relative z-10">
                      <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                    </button>
                  </Link>
                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 -z-10" />
                </div>
              ) : status === "MASTERED" ? (
                <div className="relative my-3">
                  <Link href={`/curriculum/${concept.id}/practice`}>
                    <button className="w-14 h-14 bg-secondary border-b-4 border-secondary/60 rounded-full flex items-center justify-center text-white shadow-sm active:translate-y-1 active:border-b-0 transition-all hover:brightness-110 relative z-10">
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="relative my-3">
                  <button disabled className="w-14 h-14 bg-[var(--panel-bg)] border-2 border-[var(--panel-border)] rounded-full flex items-center justify-center text-foreground/30 cursor-not-allowed relative z-10">
                    <Lock className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="text-center w-40 mb-6">
                <p className={`font-bold text-sm ${status === "LOCKED" ? "text-foreground/40" : "text-foreground"}`}>
                  {concept.name}
                </p>
                {status === "MASTERED" && (
                  <p className="text-xs font-bold text-secondary">✓ Mastered</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
