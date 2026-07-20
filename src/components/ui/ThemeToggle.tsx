"use client"

import { useTheme } from "./ThemeProvider"
import { Sun, Moon, Monitor } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const options: { label: string; value: "light" | "dark" | "system"; icon: React.ElementType }[] = [
    { label: "Light",  value: "light",  icon: Sun     },
    { label: "Dark",   value: "dark",   icon: Moon    },
    { label: "System", value: "system", icon: Monitor },
  ]

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <div className="relative" ref={ref}>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle theme"
        className="
          w-10 h-10 rounded-xl flex items-center justify-center
          bg-[var(--panel-bg)] border-2 border-[var(--panel-border)]
          text-foreground hover:border-primary/50 hover:text-primary
          transition-all duration-200 active:scale-95
        "
      >
        <CurrentIcon className="w-5 h-5 transition-transform duration-300" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 top-12 z-50 w-36 py-1.5
            bg-[var(--panel-bg)] border-2 border-[var(--panel-border)]
            rounded-2xl shadow-xl backdrop-blur-xl
            animate-fade-in
          "
        >
          {options.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors
                ${theme === value
                  ? "text-primary bg-primary/10"
                  : "text-foreground/70 hover:text-foreground hover:bg-black/5"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {theme === value && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
