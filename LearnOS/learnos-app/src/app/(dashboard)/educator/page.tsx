import { getEducatorClassrooms, getEducatorAlerts } from "@/modules/identity/educatorActions"
import { GraduationCap, Users, PlusCircle, BookOpen, AlertTriangle } from "lucide-react"
import Link from "next/link"
import LmsSyncButtons from "./LmsSyncButtons"
import { ClassroomInsightsChart } from "./components/ClassroomInsightsChart"

export default async function EducatorPage() {
  let classrooms
  let alerts = []
  try {
    classrooms = await getEducatorClassrooms()
    alerts = await getEducatorAlerts()
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-red-400">
        <GraduationCap className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>You must have an EDUCATOR account to view this portal.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-secondary" /> Educator Portal
          </h1>
          <p className="text-foreground/60 mt-2 text-lg">
            Manage your classes, assignments, and student progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LmsSyncButtons />
          <Link href="/educator/new">
            <button className="bg-secondary hover:bg-secondary-hover text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
              <PlusCircle className="w-5 h-5" /> New Class
            </button>
          </Link>
        </div>
      </div>

      {/* Interventions Section */}
      {alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6" /> Automated Intervention Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-black/20 border border-red-500/20 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-foreground">{alert.user.email}</p>
                  <p className="text-red-400/80 text-sm mt-1">{alert.reason}</p>
                </div>
                <div className="text-xs text-foreground/50">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
        <h3 className="text-xl font-bold mb-6">Aggregate Classroom Insights</h3>
        <ClassroomInsightsChart />
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.length === 0 ? (
          <div className="col-span-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-12 text-center backdrop-blur-xl">
            <BookOpen className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Classes Yet</h3>
            <p className="text-foreground/50 max-w-sm mx-auto mb-6">
              Create your first classroom to start inviting students and assigning curriculum!
            </p>
          </div>
        ) : (
          classrooms.map(cls => (
            <div key={cls.id} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl group hover:border-secondary/50 transition-all cursor-pointer">
              <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                {cls.name}
              </h3>
              <p className="text-foreground/60 mb-6 text-sm">
                {cls.description || "No description provided."}
              </p>
              
              <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                  <Users className="w-4 h-4 text-blue-400" />
                  {cls._count.enrollments} Students
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {cls._count.assignments} Assignments
                </div>
              </div>

              <Link href={`/educator/${cls.id}`}>
                <button className="w-full bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 px-6 py-2 rounded-xl font-bold transition-colors">
                  View Analytics
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
