import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BrainCircuit, FileText } from "lucide-react"

export default async function ConceptPage({ params }: { params: Promise<{ conceptId: string }> }) {
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
      assets: true
    }
  })

  if (!concept || concept.tenantId !== user.tenantId) {
    redirect("/curriculum")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button & Header */}
      <div>
        <Link href="/curriculum" className="inline-flex items-center text-foreground/50 hover:text-primary transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Curriculum
        </Link>
        <h1 className="text-4xl font-bold text-foreground">{concept.name}</h1>
        {concept.description && (
          <p className="text-foreground/60 mt-2 text-lg">{concept.description}</p>
        )}
      </div>

      {/* Discuss with AI Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Discuss with AI Tutor</h3>
            <p className="text-foreground/70 text-sm">Got questions about this topic? Our AI is ready to help.</p>
          </div>
        </div>
        <Link href="/tutor">
          <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap">
            Open Chat
          </button>
        </Link>
      </div>

      {/* Lesson Content */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-secondary" /> Lesson Materials
        </h2>
        
        {concept.assets.length === 0 ? (
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-8 text-center text-foreground/50">
            No lesson materials available for this concept.
          </div>
        ) : (
          <div className="space-y-6">
            {concept.assets.map((asset, index) => (
              <div key={asset.id} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-8 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-secondary mb-4 uppercase tracking-wider">
                  Part {index + 1}
                </h3>
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-foreground/80">
                  {(() => {
                    try {
                      const data = JSON.parse(asset.body);
                      if (asset.type === 'QUESTION' || data.question) {
                        return (
                          <div className="bg-black/20 p-4 rounded-xl border border-[var(--panel-border)]">
                            <p className="font-bold text-foreground mb-4">{data.question}</p>
                            <ul className="space-y-2 mb-4 list-none pl-0">
                              {data.options?.map((opt: string, i: number) => (
                                <li key={i} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] px-4 py-2 rounded-lg text-sm">{opt}</li>
                              ))}
                            </ul>
                            <p className="text-sm text-green-400 font-bold">Answer: {data.answer}</p>
                          </div>
                        );
                      } else {
                        return (
                          <div>
                            {data.title && <h4 className="text-xl font-bold text-foreground mb-2">{data.title}</h4>}
                            <p>{data.content || data.body}</p>
                          </div>
                        );
                      }
                    } catch (e) {
                      // Fallback for plain text
                      return asset.body.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-4">{paragraph}</p>
                      ));
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Take Practice Quiz CTA */}
      <div className="bg-gradient-to-r from-secondary/20 via-secondary/5 to-transparent border border-secondary/20 rounded-2xl p-8 text-center mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Ready to test your knowledge?</h2>
        <p className="text-foreground/70 mb-6 max-w-md mx-auto">
          Take a quick quiz to prove your mastery. Passing this quiz will level up your Mastery Ring on the dashboard!
        </p>
        <Link href={`/curriculum/${conceptId}/practice`}>
          <button className="bg-secondary hover:bg-secondary-hover text-white px-8 py-3 rounded-xl font-bold transition-all inline-flex items-center">
            Take Practice Quiz
          </button>
        </Link>
      </div>
    </div>
  )
}
