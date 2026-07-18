import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Settings2, UserCircle, Bell, Shield, Flame } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { tenant: true }
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <Settings2 className="w-10 h-10 text-primary" /> Settings
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">Manage your account and learning preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Settings Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Account Details */}
          <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <UserCircle className="w-6 h-6 text-secondary" /> Account Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/50 mb-1">Email Address</label>
                <div className="bg-black/5 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground font-medium">
                  {user.email}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/50 mb-1">Role</label>
                  <div className="bg-black/5 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground font-medium capitalize">
                    {user.role.toLowerCase()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/50 mb-1">Organization</label>
                  <div className="bg-black/5 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground font-medium">
                    {user.tenant.name}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link href="/forgot-password">
                <button className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-lg font-bold transition-colors">
                  Change Password
                </button>
              </Link>
            </div>
          </section>

          {/* Learning Preferences */}
          <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <Flame className="w-6 h-6 text-primary" /> Learning Preferences
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-foreground font-medium">Daily Reminders</h4>
                  <p className="text-foreground/50 text-sm">Receive a daily notification to hit your learning goals.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="h-px bg-[var(--panel-border)] w-full"></div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-foreground font-medium">Gamification Mode</h4>
                  <p className="text-foreground/50 text-sm">Enable streaks, confetti, and mastery rings.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
          
          {/* Notifications */}
          <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-foreground/70" /> Email Notifications
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded bg-black/40 border-[var(--panel-border)] text-primary focus:ring-primary focus:ring-offset-0" defaultChecked />
                <span className="text-sm text-foreground/80">Weekly Progress Report</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded bg-black/40 border-[var(--panel-border)] text-primary focus:ring-primary focus:ring-offset-0" defaultChecked />
                <span className="text-sm text-foreground/80">New Feature Announcements</span>
              </label>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-sm text-foreground/60 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl font-bold transition-colors">
              Delete Account
            </button>
          </section>

        </div>
      </div>
    </div>
  )
}
