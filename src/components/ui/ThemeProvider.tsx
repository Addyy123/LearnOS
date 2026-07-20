"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")

  // Runs once on mount: read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("learnos-theme") as Theme | null
    const initial = stored ?? "system"
    applyTheme(initial)
    setThemeState(initial)
  }, [])

  // Watch system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") applyTheme("system")
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  function applyTheme(t: Theme) {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const resolved = t === "system" ? (systemDark ? "dark" : "light") : t

    const root = document.documentElement
    root.setAttribute("data-theme", resolved)
    setResolvedTheme(resolved)
  }

  function setTheme(t: Theme) {
    localStorage.setItem("learnos-theme", t)
    applyTheme(t)
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
