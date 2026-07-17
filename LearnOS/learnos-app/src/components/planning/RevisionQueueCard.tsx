import { BrainCircuit, Clock } from "lucide-react"
import Link from "next/link"
import { getDueRevisions } from "@/modules/planning/revisionActions"

export async function RevisionQueueCard() {
  const revisions = await getDueRevisions()

  if (revisions.length === 0) {
    return null; // Don't show if nothing to review
  }

  return (
    <div className="bg-gradient-to-br from-secondary/10 to-[var(--panel-bg)] border border-secondary/20 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit className="w-24 h-24 text-secondary" />
      </div>
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" /> Due for Review
        </h3>
        
        <p className="text-foreground/70 mb-4">
          Keep your streak going and lock in your knowledge. You have {revisions.length} concepts to review today.
        </p>
        
        <div className="space-y-3">
          {revisions.slice(0, 3).map((rev: any) => (
            <div key={rev.id} className="flex items-center justify-between bg-[var(--panel-bg)] border border-[var(--panel-border)] p-3 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">{rev.conceptName}</p>
                <p className="text-xs text-foreground/50">Current Mastery: {rev.probability}%</p>
              </div>
              <Link href={`/curriculum/${rev.conceptId}`}>
                <button className="bg-secondary/20 hover:bg-secondary/30 text-secondary text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                  Review
                </button>
              </Link>
            </div>
          ))}
          {revisions.length > 3 && (
            <div className="text-center text-sm text-foreground/50 pt-2">
              + {revisions.length - 3} more
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
