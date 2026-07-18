import { Flame, Trophy, Play, CheckCircle2, Lock } from "lucide-react"
import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Mascot } from "@/components/ui/Mascot"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      mastery: true,
      tenant: {
        include: {
          concepts: {
            orderBy: { createdAt: 'asc' } // Ensure consistent order for path
          }
        }
      }
    }
  })

  if (!user) {
    redirect("/login")
  }

  const streak = user.currentStreak || 0;
  const xp = user.xp || 0;
  
  // Winding offset pattern for the path (0, 1, 2, 1, 0, -1, -2, -1)
  const getOffsetClass = (index: number) => {
    const pattern = [
      "ml-0", "ml-8 md:ml-16", "ml-16 md:ml-32", "ml-8 md:ml-16",
      "ml-0", "-ml-8 md:-ml-16", "-ml-16 md:-ml-32", "-ml-8 md:-ml-16"
    ];
    return pattern[index % pattern.length];
  }

  // Determine active node (first concept not fully mastered)
  // For MVP, we assume mastered if probability > 80, else it's active or locked.
  let firstUnmasteredFound = false;

  return (
    <div className="w-full flex flex-col items-center pb-24">
      {/* Welcome & Stats Row */}
      <div className="w-full max-w-2xl mb-12 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Mascot state="idle" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center md:text-left">
              {user.email ? `Welcome back, ${user.email.split('@')[0]}!` : "Welcome back!"}
            </h1>
            <p className="text-foreground/60 text-center md:text-left">Ready to continue your learning journey?</p>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-black/5 p-4 rounded-2xl w-full md:w-auto justify-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-warning" />
              <span className="font-bold text-warning text-xl">{xp}</span>
            </div>
            <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Total XP</span>
          </div>
          <div className="w-px h-10 bg-black/10"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Flame className={`w-5 h-5 ${streak > 0 ? "text-orange-500" : "text-gray-300"}`} />
              <span className={`font-bold text-xl ${streak > 0 ? "text-orange-500" : "text-gray-400"}`}>{streak}</span>
            </div>
            <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Day Streak</span>
          </div>
        </div>
      </div>

      {/* The Learning Path */}
      <div className="flex flex-col items-center w-full relative">
        {user.tenant.concepts.length > 0 && (
          <div className="mb-10 bg-secondary/10 text-secondary px-5 py-2.5 rounded-full font-bold text-sm border-2 border-secondary/20 flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
            {user.mastery.filter(m => m.probability >= 80).length} of {user.tenant.concepts.length} Concepts Mastered
          </div>
        )}
        {user.tenant.concepts.length === 0 && (
          <div className="card-tactile text-center p-8">
            <h3 className="text-xl font-bold text-foreground mb-4">No Content Found</h3>
            <p className="text-gray-500 mb-6">Ask your educator or admin to add concepts to the curriculum.</p>
          </div>
        )}
        
        {user.tenant.concepts.map((concept, index) => {
          const mastery = user.mastery.find(m => m.conceptId === concept.id);
          const isMastered = mastery && mastery.probability >= 80;
          
          let status: "MASTERED" | "ACTIVE" | "LOCKED" = "LOCKED";
          
          if (isMastered) {
            status = "MASTERED";
          } else if (!firstUnmasteredFound) {
            status = "ACTIVE";
            firstUnmasteredFound = true;
          }

          const offsetClass = getOffsetClass(index);
          const isLast = index === user.tenant.concepts.length - 1;

          return (
            <div key={concept.id} className={`flex flex-col items-center relative ${offsetClass}`}>
              
              {/* Path Connector Line (except for last item) */}
              {!isLast && (
                <div className="w-4 h-16 bg-panel-border -z-10 absolute top-16 left-1/2 -translate-x-1/2"></div>
              )}

              {/* Node Button */}
              {status === "ACTIVE" ? (
                <div className="relative my-4 group">
                  {/* Floating Start Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-panel-border px-4 py-2 rounded-xl font-bold text-primary shadow-sm animate-bounce whitespace-nowrap z-20">
                    START
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-panel-border rotate-45"></div>
                  </div>
                  
                  <Link href={`/curriculum/${concept.id}/practice`}>
                    <button className="w-20 h-20 bg-primary border-b-8 border-primary-hover rounded-full flex items-center justify-center text-white shadow-md active:translate-y-2 active:border-b-0 transition-all hover:brightness-110 z-10 relative">
                      <Play className="w-8 h-8 ml-1" fill="currentColor" />
                    </button>
                  </Link>
                  {/* Glowing ring for active node */}
                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 -z-10"></div>
                </div>
              ) : status === "MASTERED" ? (
                <div className="relative my-4">
                  <Link href={`/curriculum/${concept.id}/practice`}>
                    <button className="w-16 h-16 bg-secondary border-b-6 border-secondary-hover rounded-full flex items-center justify-center text-white shadow-sm active:translate-y-1 active:border-b-0 transition-all hover:brightness-110 z-10 relative">
                      <CheckCircle2 className="w-8 h-8" />
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="relative my-4">
                  <button className="w-16 h-16 bg-gray-200 border-b-6 border-gray-300 rounded-full flex items-center justify-center text-gray-400 shadow-sm cursor-not-allowed z-10 relative">
                    <Lock className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* Concept Title */}
              <div className="text-center w-48 mb-8">
                <p className="font-bold text-foreground">{concept.name}</p>
                {status === "MASTERED" && (
                  <p className="text-sm font-bold text-secondary">Level {Math.floor((mastery?.probability || 0) / 20)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
