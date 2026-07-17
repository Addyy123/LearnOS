import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar, Target, CheckCircle2, Circle, Play } from "lucide-react"
import Link from "next/link"

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      plans: {
        include: {
          items: {
            include: { concept: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!user) redirect("/login")

  const activePlan = user.plans[0] // For MVP, assume the latest plan is active

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Learning Plan</h1>
          <p className="text-foreground/60 text-lg">Structured path to mastery based on your diagnostic results.</p>
        </div>
      </div>

      {!activePlan ? (
        <div className="text-center py-20 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl">
          <Target className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Active Plan</h2>
          <p className="text-foreground/50 mb-6 max-w-md mx-auto">
            You don't have a learning plan yet. Browse the curriculum to select a topic and generate a plan.
          </p>
          <Link href="/curriculum">
            <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              Browse Curriculum
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              {activePlan.title}
            </h2>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {activePlan.items.map((item, index) => (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Marker */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-[var(--panel-bg)] text-foreground/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                    {item.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    ) : item.status === 'IN_PROGRESS' ? (
                      <Target className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-3 h-3 text-foreground/20" />
                    )}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-black/20 border border-[var(--panel-border)] p-6 rounded-2xl shadow-xl transition-all hover:border-primary/50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        Step {index + 1}: {item.concept.name}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        item.status === 'COMPLETED' ? 'bg-secondary/20 text-secondary' :
                        item.status === 'IN_PROGRESS' ? 'bg-primary/20 text-primary' :
                        'bg-foreground/10 text-foreground/50'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-foreground/60 text-sm mb-4 line-clamp-2">
                      {item.concept.description}
                    </p>
                    
                    {item.status !== 'COMPLETED' && (
                      <Link href={`/curriculum/${item.concept.id}`}>
                        <button className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                          <Play className="w-4 h-4" /> 
                          {item.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              
              {activePlan.items.length === 0 && (
                <p className="text-foreground/50">This plan has no steps yet.</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link href="/">
              <button className="bg-secondary hover:bg-secondary-hover text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-secondary/20">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
