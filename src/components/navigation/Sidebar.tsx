"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Target, User, ShieldAlert, Users, Sparkles, LogOut, Bot } from "lucide-react"
import { signOut } from "next-auth/react"

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  // Primary tabs (Duolingo style)
  const navItems = [
    { name: "Learn", href: "/", icon: Home },
    { name: "Review", href: "/curriculum", icon: Dumbbell },
    { name: "Tutor", href: "/tutor", icon: Bot },
    { name: "Quests", href: "/plan", icon: Target },
    { name: "Profile", href: "/settings", icon: User },
  ]

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="w-20 lg:w-64 border-r-2 border-panel-border bg-panel hidden md:flex flex-col z-20">
        <div className="p-6 hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
            <Home className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-wide text-primary">LearnOS</span>
        </div>
        <div className="p-6 lg:hidden flex items-center justify-center">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-3">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center lg:justify-start justify-center gap-4 px-4 py-3 rounded-2xl transition-all border-2 ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary bg-sky-50"
                    : "text-foreground hover:bg-black/5 border-transparent"
                }`}
              >
                <item.icon className={`w-7 h-7 ${isActive ? "text-primary" : "text-gray-400"}`} />
                <span className="hidden lg:block font-bold text-[17px]">{item.name}</span>
              </Link>
            )
          })}
          
          { role === 'EDUCATOR' && (
            <div className="mt-8 border-t-2 border-panel-border pt-4">
              <Link href="/educator" className="flex items-center lg:justify-start justify-center gap-4 px-4 py-3 rounded-2xl hover:bg-black/5 text-foreground transition-all border-2 border-transparent">
                <Users className="w-7 h-7 text-secondary" />
                <span className="hidden lg:block font-bold text-[17px]">Classrooms</span>
              </Link>
              <Link href="/educator/builder" className="flex items-center lg:justify-start justify-center gap-4 px-4 py-3 rounded-2xl hover:bg-black/5 text-foreground transition-all border-2 border-transparent">
                <Sparkles className="w-7 h-7 text-secondary" />
                <span className="hidden lg:block font-bold text-[17px]">Builder</span>
              </Link>
            </div>
          )}
          { role === 'ADMIN' && (
            <Link href="/admin" className="flex items-center lg:justify-start justify-center gap-4 px-4 py-3 rounded-2xl hover:bg-black/5 text-foreground transition-all border-2 border-transparent mt-4">
              <ShieldAlert className="w-7 h-7 text-error" />
              <span className="hidden lg:block font-bold text-[17px]">Admin</span>
            </Link>
          )}
        </nav>
        
        <div className="p-4 mt-auto">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center lg:justify-start justify-center gap-4 px-4 py-3 text-foreground hover:bg-black/5 rounded-2xl transition-all border-2 border-transparent cursor-pointer"
          >
            <LogOut className="w-7 h-7 text-gray-400" />
            <span className="hidden lg:block font-bold text-[17px]">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-panel border-t-2 border-panel-border flex items-center justify-around px-2 py-3 pb-6 z-50">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-gray-400"
              }`}
            >
              <item.icon className={`w-7 h-7 ${isActive ? "text-primary" : "text-gray-400"}`} />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
