"use client"

import React from "react"
import { User } from "lucide-react"

export const AVATAR_OPTIONS = [
  { id: "avatar-1", bg: "bg-red-500", color: "text-red-100" },
  { id: "avatar-2", bg: "bg-orange-500", color: "text-orange-100" },
  { id: "avatar-3", bg: "bg-amber-500", color: "text-amber-100" },
  { id: "avatar-4", bg: "bg-green-500", color: "text-green-100" },
  { id: "avatar-5", bg: "bg-emerald-500", color: "text-emerald-100" },
  { id: "avatar-6", bg: "bg-teal-500", color: "text-teal-100" },
  { id: "avatar-7", bg: "bg-cyan-500", color: "text-cyan-100" },
  { id: "avatar-8", bg: "bg-blue-500", color: "text-blue-100" },
  { id: "avatar-9", bg: "bg-indigo-500", color: "text-indigo-100" },
  { id: "avatar-10", bg: "bg-violet-500", color: "text-violet-100" },
  { id: "avatar-11", bg: "bg-purple-500", color: "text-purple-100" },
  { id: "avatar-12", bg: "bg-pink-500", color: "text-pink-100" },
]

interface AvatarProps {
  avatarId?: string | null
  fallback?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function Avatar({ avatarId, fallback, className = "", size = "md" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl border-4",
    xl: "w-24 h-24 text-3xl border-[6px]"
  }

  const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId)

  // Determine classes
  let containerClasses = `rounded-full flex items-center justify-center font-black shadow-sm shrink-0 border-2 border-[var(--panel-bg)] overflow-hidden relative ${sizeClasses[size]} ${className}`
  
  if (avatar) {
    containerClasses = `${containerClasses} ${avatar.bg} ${avatar.color}`
  } else {
    // Default fallback style
    containerClasses = `${containerClasses} bg-secondary/20 text-secondary`
  }

  // Determine what to render inside
  let content;
  if (avatar) {
    // If we have an avatar, show a cool stylized shape or just an icon for now, 
    // or maybe the initials but themed nicely.
    // Let's use a nice generic mascot/user icon but strongly colored by the theme.
    // To make it feel premium without images, we can use the Lucide User icon scaled nicely.
    content = <User className="w-1/2 h-1/2 opacity-80" />
  } else if (fallback) {
    content = fallback.substring(0, 2).toUpperCase()
  } else {
    content = <User className="w-1/2 h-1/2" />
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  )
}
