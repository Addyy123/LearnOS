import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Trophy, Medal, Star, Shield } from "lucide-react"
import { Mascot } from "@/components/ui/Mascot"
import { Avatar } from "@/components/ui/Avatar"

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!currentUser) redirect("/login")

  // Fetch all users in the same tenant, ordered by XP
  const users = await prisma.user.findMany({
    where: { tenantId: currentUser.tenantId },
    orderBy: { xp: 'desc' },
    take: 50 // Limit to top 50
  })

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div className="w-full flex flex-col items-center pb-24">
      {/* Header */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-warning" />
            Global Ranks
          </h1>
          <p className="text-foreground/60">Compete with your peers and earn XP to climb the ranks!</p>
        </div>
        <Mascot state="happy" className="hidden md:flex bg-black/5" />
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="w-full max-w-3xl mb-12 flex items-end justify-center gap-2 md:gap-6 mt-8">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div className="flex flex-col items-center flex-1 z-10">
              <div className="relative mb-2">
                <Avatar avatarId={(top3[1] as any).avatarId} fallback={(top3[1] as any).displayName || top3[1].email} size="lg" className="border-gray-300 shadow-md bg-gray-200 text-gray-500" />
                <div className="absolute -bottom-2 -right-2 bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-[var(--panel-bg)]">2</div>
              </div>
              <span className="font-bold text-foreground text-sm truncate max-w-[100px]">
                {(top3[1] as any).displayName || top3[1].email.split('@')[0]}
              </span>
              <span className="text-xs font-bold text-primary">{top3[1].xp} XP</span>
              <div className="w-full h-24 md:h-32 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl mt-4 border-t-4 border-gray-300"></div>
            </div>
          )}
          
          {/* Rank 1 (Gold) */}
          {top3[0] && (
            <div className="flex flex-col items-center flex-1 z-20">
              <div className="relative mb-2">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <Medal className="w-8 h-8 text-warning animate-bounce" />
                </div>
                <Avatar avatarId={(top3[0] as any).avatarId} fallback={(top3[0] as any).displayName || top3[0].email} size="xl" className="border-warning shadow-lg bg-warning/20 text-warning" />
                <div className="absolute -bottom-2 -right-2 bg-warning text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-[var(--panel-bg)]">1</div>
              </div>
              <span className="font-bold text-foreground text-sm truncate max-w-[120px]">
                {(top3[0] as any).displayName || top3[0].email.split('@')[0]}
              </span>
              <span className="text-sm font-bold text-primary">{top3[0].xp} XP</span>
              <div className="w-full h-32 md:h-40 bg-gradient-to-t from-warning/30 to-warning/10 rounded-t-xl mt-4 border-t-4 border-warning"></div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div className="flex flex-col items-center flex-1 z-10">
              <div className="relative mb-2">
                <Avatar avatarId={(top3[2] as any).avatarId} fallback={(top3[2] as any).displayName || top3[2].email} size="lg" className="border-orange-300 shadow-md bg-orange-100/50 text-orange-500" />
                <div className="absolute -bottom-2 -right-2 bg-orange-300 text-orange-800 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-[var(--panel-bg)]">3</div>
              </div>
              <span className="font-bold text-foreground text-sm truncate max-w-[100px]">
                {(top3[2] as any).displayName || top3[2].email.split('@')[0]}
              </span>
              <span className="text-xs font-bold text-primary">{top3[2].xp} XP</span>
              <div className="w-full h-16 md:h-20 bg-gradient-to-t from-orange-100/30 to-orange-50/10 rounded-t-xl mt-4 border-t-4 border-orange-200"></div>
            </div>
          )}
        </div>
      )}

      {/* The Rest of the List */}
      <div className="w-full max-w-3xl space-y-3">
        {rest.map((user, idx) => (
          <div 
            key={user.id} 
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              user.id === currentUser.id 
                ? "bg-primary/10 border-primary shadow-sm" 
                : "bg-[var(--panel-bg)] border-[var(--panel-border)] hover:border-primary/50"
            }`}
          >
            <div className="w-8 font-bold text-foreground/50 text-center">{idx + 4}</div>
            <Avatar avatarId={(user as any).avatarId} fallback={(user as any).displayName || user.email} size="md" />
            <div className="flex-1">
              <p className="font-bold text-foreground">
                {(user as any).displayName || user.email.split('@')[0]}
                {user.id === currentUser.id && <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">You</span>}
              </p>
            </div>
            <div className="font-bold text-primary flex items-center gap-1">
              {user.xp} <span className="text-xs text-foreground/50">XP</span>
            </div>
          </div>
        ))}
        {rest.length === 0 && top3.length <= 3 && (
           <div className="text-center p-8 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl text-foreground/50 font-medium">
             No more users to show. Keep earning XP!
           </div>
        )}
      </div>
    </div>
  )
}
