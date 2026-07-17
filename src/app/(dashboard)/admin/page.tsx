import { getTenantAnalytics } from "@/modules/identity/adminActions"
import { ShieldAlert, Users, Target, BrainCircuit, Activity } from "lucide-react"
import { PlatformUsageChart } from "./components/PlatformUsageChart"
import { BulkImportUI } from "./components/BulkImportUI"

export default async function AdminPage() {
  let data
  try {
    data = await getTenantAnalytics()
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-red-400">
        <ShieldAlert className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>You do not have the necessary permissions to view this page.</p>
      </div>
    )
  }

  const { users, metrics, auditLogs } = data

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-red-400" /> Admin Panel
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">
          Organization-wide analytics and audit logs.
        </p>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/50">Total Learners</p>
            <p className="text-3xl font-bold text-foreground">{metrics.totalUsers}</p>
          </div>
        </div>
        
        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/50">Active Goals</p>
            <p className="text-3xl font-bold text-foreground">{metrics.totalGoals}</p>
          </div>
        </div>

        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/50">AI Conversations</p>
            <p className="text-3xl font-bold text-foreground">{metrics.totalConversations}</p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
        <h3 className="text-xl font-bold mb-6">Platform Usage Trends</h3>
        <PlatformUsageChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-8">
          {/* Bulk Import */}
          <BulkImportUI />

          {/* Learner Directory */}
          <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl overflow-hidden flex flex-col max-h-[500px]">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-blue-400" /> Learner Directory
            </h2>
          <div className="overflow-y-auto flex-1 pr-2">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-foreground/50 uppercase sticky top-0 bg-[var(--panel-bg)]">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 rounded-tr-lg">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[var(--panel-border)] last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground/90">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/50">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Audit Log */}
      <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl overflow-hidden flex flex-col max-h-[500px]">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-secondary" /> System Audit Log
          </h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center text-foreground/50 py-8">
                No learning events recorded yet.
              </div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="bg-black/20 border border-[var(--panel-border)] p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded text-foreground/70 uppercase">
                      {log.eventType}
                    </span>
                    <span className="text-xs text-foreground/40">
                      {new Date(log.occurredAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">
                    <span className="font-semibold text-blue-400">{log.user.email}</span> 
                    {' '}interacted with{' '}
                    <span className="font-semibold text-primary">{log.concept.name}</span>
                  </p>
                  {log.isCorrect !== null && (
                    <p className="text-xs mt-2 font-medium">
                      Outcome: <span className={log.isCorrect ? 'text-green-400' : 'text-orange-400'}>
                        {log.isCorrect ? 'Correct / Pass' : 'Incorrect / Needs Review'}
                      </span>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </div>
      
      {/* Moderation Section */}
      <ModerationSection />
    </div>
  )
}

// Extracted into a local async component for the Moderation UI
import { getFlaggedMessages, dismissFlag, suspendUser } from "@/modules/identity/moderationActions"

async function ModerationSection() {
  const flagged = await getFlaggedMessages()

  return (
    <section className="bg-[var(--panel-bg)] border border-red-500/30 rounded-3xl p-6 backdrop-blur-xl mt-8">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
        <ShieldAlert className="w-6 h-6 text-red-400" /> Moderation Queue
      </h2>
      
      <div className="space-y-4">
        {flagged.length === 0 ? (
          <div className="text-center text-foreground/50 py-8 bg-black/20 rounded-xl border border-[var(--panel-border)]">
            No safety flags! The queue is clean.
          </div>
        ) : (
          flagged.map(msg => (
            <div key={msg.id} className="bg-black/40 border border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded uppercase">
                    Flagged Prompt
                  </span>
                  <span className="text-sm text-foreground/50">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-foreground/80 mb-2 italic">"{msg.content}"</p>
                <p className="text-sm text-foreground/50">User: <span className="font-mono text-foreground/80">{msg.conversation.user.email}</span></p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <form action={async () => {
                  "use server"
                  await dismissFlag(msg.id)
                }}>
                  <button type="submit" className="w-full bg-white/5 hover:bg-white/10 border border-[var(--panel-border)] text-foreground px-4 py-2 rounded-xl text-sm transition-colors">
                    Dismiss Flag
                  </button>
                </form>
                <form action={async () => {
                  "use server"
                  await suspendUser(msg.conversation.userId)
                }}>
                  <button type="submit" className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                    Suspend User
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
