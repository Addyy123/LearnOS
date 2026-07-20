import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/navigation/Sidebar"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Avatar } from "@/components/ui/Avatar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, role: true, email: true, displayName: true, avatarId: true }
  })

  if (user && !user.onboardingCompleted) {
    redirect("/onboarding")
  }

  let displayName = user?.displayName;
  if (!displayName) {
    const emailStr = user?.email as string | null;
    if (emailStr?.startsWith("guest_")) {
      displayName = "Learner";
    } else {
      displayName = emailStr ? emailStr.split('@')[0] : "Learner";
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Sidebar */}
      <Sidebar role={user?.role || "LEARNER"} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-y-auto animate-fade-in relative">
        <header className="h-16 border-b-2 border-[var(--panel-border)] bg-[var(--panel-bg)] flex items-center justify-between pl-16 pr-4 md:px-8 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex-1">
            <span className="text-[10px] md:text-xs font-black text-foreground/30 uppercase tracking-widest">
              Powered by Addyy
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <span className="hidden md:block font-bold text-foreground">
              {displayName}
            </span>
            <Avatar 
              avatarId={user?.avatarId} 
              fallback={displayName || user?.email} 
              size="md" 
            />
          </div>
        </header>
        <div className="p-4 md:p-8 flex justify-center w-full flex-1 min-h-0">
          <div className="w-full max-w-5xl flex flex-col flex-1 min-h-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
