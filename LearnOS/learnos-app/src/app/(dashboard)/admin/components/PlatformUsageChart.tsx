"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

const MOCK_DATA = [
  { month: "Jan", users: 4000, aiQueries: 2400 },
  { month: "Feb", users: 5000, aiQueries: 3800 },
  { month: "Mar", users: 5500, aiQueries: 4300 },
  { month: "Apr", users: 7000, aiQueries: 6000 },
  { month: "May", users: 8200, aiQueries: 8000 },
  { month: "Jun", users: 11000, aiQueries: 12500 },
]

export function PlatformUsageChart() {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={MOCK_DATA}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
          <XAxis 
            dataKey="month" 
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
          <Line 
            type="monotone" 
            name="Active Users"
            dataKey="users" 
            stroke="#06b6d4" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            name="AI Queries"
            dataKey="aiQueries" 
            stroke="#f43f5e" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
