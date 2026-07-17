import React from "react"

interface ProgressRingProps {
  progress: number // 0 to 100
  size?: number
  strokeWidth?: number
  color?: string
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "var(--primary)",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Ring */}
        <circle
          className="text-white/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Ring */}
        <circle
          className="transition-all duration-1000 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center Text */}
      <div className="absolute text-center flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  )
}
