import { getClassroomAnalytics } from "@/modules/identity/educatorActions"
import { ArrowLeft, BookOpen, Users, TrendingUp, Download } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ClassroomAnalyticsPage({ params }: { params: Promise<{ classId: string }> }) {
  let data
  try {
    const resolvedParams = await params;
    data = await getClassroomAnalytics(resolvedParams.classId)
  } catch (err: any) {
    if (err.message === "Classroom not found") notFound()
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        Failed to load classroom analytics. Ensure you have the proper permissions.
      </div>
    )
  }

  const { classroom, averages } = data

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <Link href="/educator" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Portal
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {classroom.name}
        </h1>
        <p className="text-foreground/60 text-lg">
          {classroom.description || "No description provided."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Roster */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Student Roster
              </h2>
              <div className="flex gap-3">
                <a href={`/api/export/classroom/${classroom.id}`} download>
                  <button className="bg-black/20 text-foreground/80 hover:text-foreground hover:bg-black/40 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </a>
                <button className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  + Invite Student
                </button>
              </div>
            </div>
            
            {classroom.enrollments.length === 0 ? (
              <div className="text-center py-12 text-foreground/50 border-2 border-dashed border-[var(--panel-border)] rounded-2xl">
                No students enrolled yet. Invite students to see their progress!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-foreground/50 uppercase">
                    <tr>
                      <th className="py-3 px-4">Student Email</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Topics Mastered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classroom.enrollments.map((enroll) => {
                      const masteredTopics = enroll.learner.mastery.filter(m => m.probability >= 80).length
                      return (
                        <tr key={enroll.id} className="border-b border-[var(--panel-border)] last:border-0 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground/90">{enroll.learner.email}</td>
                          <td className="py-3 px-4 text-foreground/50">{new Date(enroll.joinedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full font-bold">
                              {masteredTopics}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-6">
          <section className="bg-gradient-to-b from-secondary/10 to-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-secondary" /> Class Averages
            </h2>

            {averages.length === 0 ? (
              <div className="text-center text-foreground/50 text-sm py-4">
                No mastery data available yet.
              </div>
            ) : (
              <div className="space-y-6">
                {averages.map((avg, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-foreground/80">{avg.name}</span>
                      <span className="text-secondary">{avg.averageMastery}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full" 
                        style={{ width: `${avg.averageMastery}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" /> Recent Assignments
            </h2>
            
            {classroom.assignments && classroom.assignments.length > 0 ? (
              <div className="space-y-3 mb-4">
                {classroom.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="font-bold text-sm text-foreground">{assignment.title}</h4>
                    <p className="text-xs text-foreground/60">{assignment.concept?.name}</p>
                    {assignment.dueDate && (
                      <p className="text-xs text-secondary mt-1">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-foreground/50 text-sm py-4 border-2 border-dashed border-[var(--panel-border)] rounded-2xl mb-4">
                No assignments created.
              </div>
            )}

            <Link href={`/educator/${classroom.id}/assignments/new`}>
              <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-2 rounded-xl font-bold transition-colors">
                Create Assignment
              </button>
            </Link>
          </section>
        </div>

      </div>
    </div>
  )
}
