import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, ChevronRight, Library } from "lucide-react"

export default async function CurriculumPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { mastery: true }
  })

  if (!user) redirect("/login")

  // Fetch all concepts for this tenant
  const concepts = await prisma.concept.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: {
        select: { assets: true }
      }
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
          <Library className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Curriculum Library</h1>
          <p className="text-foreground/60 text-lg">Browse available subjects and start learning.</p>
        </div>
      </div>

      {/* Concept Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concepts.map((concept) => {
          const mastery = user.mastery.find((m: any) => m.conceptId === concept.id);
          const progress = mastery ? mastery.probability : 0;
          
          return (
            <Link href={`/curriculum/${concept.id}`} key={concept.id}>
              <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-6 backdrop-blur-xl group hover:border-primary/50 hover:bg-black/5 transition-all h-full flex flex-col cursor-pointer relative overflow-hidden">
                {/* Mastery Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-black/5">
                  <div className="h-full bg-secondary transition-all" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-black/5 rounded-full text-foreground/70">
                    {concept._count.assets} Lessons
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {concept.name}
                </h3>
                <p className="text-foreground/60 text-sm flex-1 mb-6">
                  {concept.description || "Explore this topic in detail."}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-primary font-medium text-sm flex items-center">
                    View Curriculum <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-xs font-bold text-foreground/50">{Math.floor(progress)}% Mastery</span>
                </div>
              </div>
            </Link>
          )
        })}

        {concepts.length === 0 && (
          <div className="col-span-full text-center py-20 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl">
            <p className="text-foreground/50 text-lg">No curriculum found. Please run the seed script.</p>
          </div>
        )}
      </div>
    </div>
  )
}
