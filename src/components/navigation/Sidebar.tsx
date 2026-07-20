"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Target, User, ShieldAlert, Users, Sparkles, LogOut, Bot, Trophy, Menu, X, LineChart } from "lucide-react"
import { signOut } from "next-auth/react"

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  // Primary tabs (Duolingo style)
  const navItems = [
    { name: "Learn", href: "/", icon: Home },
    { name: "Review", href: "/curriculum", icon: Dumbbell },
    { name: "Ranks", href: "/leaderboard", icon: Trophy },
    { name: "Tutor", href: "/tutor", icon: Bot },
    { name: "Quests", href: "/plan", icon: Target },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Profile", href: "/settings", icon: User },
  ]

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* MOBILE HAMBURGER BUTTON */}
      <button 
        className="md:hidden fixed top-3 left-4 z-[60] p-2 bg-[var(--panel-bg)] border-2 border-[var(--panel-border)] rounded-xl shadow-sm text-foreground active:scale-95 transition-all"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR (Desktop + Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] flex flex-col w-64 bg-[var(--panel-bg)] border-r-2 border-[var(--panel-border)] transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-24 lg:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-wide text-primary">LearnOS</span>
        </div>
        
        {/* Mobile Sidebar Header */}
        <div className="p-6 flex lg:hidden items-center gap-3 pt-20 md:pt-6 md:justify-center">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-wide text-primary md:hidden">LearnOS</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center lg:justify-start md:justify-center justify-start gap-4 px-4 py-3 rounded-2xl transition-all border-2 ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary"
                    : "text-foreground hover:bg-black/5 border-transparent"
                }`}
              >
                <item.icon className={`w-7 h-7 shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`} />
                <span className="block md:hidden lg:block font-bold text-[17px]">{item.name}</span>
              </Link>
            )
          })}
          
          { role === 'EDUCATOR' && (
            <div className="mt-8 border-t-2 border-[var(--panel-border)] pt-4">
              <Link href="/educator" className="flex items-center lg:justify-start md:justify-center justify-start gap-4 px-4 py-3 rounded-2xl hover:bg-black/5 text-foreground transition-all border-2 border-transparent">
                <Users className="w-7 h-7 text-secondary shrink-0" />
                <span className="block md:hidden lg:block font-bold text-[17px]">Classrooms</span>
              </Link>
              <Link href="/educator/builder" className="flex items-center lg:justify-start md:justify-center justify-start gap-4 px-4 py-3 rounded-2xl hover:bg-black/5 text-foreground transition-all border-2 border-transparent">
                <Sparkles className="w-7 h-7 text-secondary shrink-0" />
                <span className="block md:hidden lg:block font-bold text-[17px]">Builder</span>
              </Link>
            </div>
          )}
          { role === 'ADMIN' && (
            <Link href="/admin" className="flex items-center lg:justify-start md:justify-center justify-start gap-4 px-4 py-3 rounded-2xl hover:bg-black/5 text-foreground transition-all border-2 border-transparent mt-4">
              <ShieldAlert className="w-7 h-7 text-error shrink-0" />
              <span className="block md:hidden lg:block font-bold text-[17px]">Admin</span>
            </Link>
          )}
        </nav>
        
        <div className="p-4 mt-auto">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center lg:justify-start md:justify-center justify-start gap-4 px-4 py-3 text-foreground hover:bg-black/5 rounded-2xl transition-all border-2 border-transparent cursor-pointer"
          >
            <LogOut className="w-7 h-7 text-gray-400 shrink-0" />
            <span className="block md:hidden lg:block font-bold text-[17px]">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
