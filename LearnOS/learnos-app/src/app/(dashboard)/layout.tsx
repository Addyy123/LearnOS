import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/navigation/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, role: true }
  })

  if (user && !user.onboardingCompleted) {
    redirect("/onboarding")
  }

  return (
    <div className="min-h-screen flex bg-background pb-20 md:pb-0">
      {/* Sidebar */}
      <Sidebar role={user?.role || "LEARNER"} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto animate-fade-in relative">
        <header className="h-16 border-b-2 border-panel-border bg-panel flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="font-bold text-foreground text-lg hidden md:block">Learner View</h2>
          <div className="flex items-center gap-4 ml-auto">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white font-bold border-b-4 border-secondary-hover">
              JD
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 flex justify-center w-full">
          <div className="w-full max-w-[800px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
