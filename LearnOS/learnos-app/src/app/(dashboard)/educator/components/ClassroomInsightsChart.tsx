"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

const MOCK_DATA = [
  { name: "Mon", avgMastery: 45, engagement: 20 },
  { name: "Tue", avgMastery: 48, engagement: 45 },
  { name: "Wed", avgMastery: 52, engagement: 60 },
  { name: "Thu", avgMastery: 55, engagement: 40 },
  { name: "Fri", avgMastery: 65, engagement: 80 },
  { name: "Sat", avgMastery: 67, engagement: 30 },
  { name: "Sun", avgMastery: 70, engagement: 50 },
]

export function ClassroomInsightsChart() {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={MOCK_DATA}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#ffffff50" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#ffffff50" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(0,0,0,0.8)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)"
            }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
          <Area 
            type="monotone" 
            name="Avg Mastery (%)"
            dataKey="avgMastery" 
            stroke="#06b6d4" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorMastery)" 
          />
          <Area 
            type="monotone" 
            name="Engagement Activity"
            dataKey="engagement" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEngagement)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
