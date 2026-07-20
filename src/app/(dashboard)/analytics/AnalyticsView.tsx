"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Trophy, Flame, CheckCircle2, Target } from "lucide-react"

type AnalyticsData = {
  xp: number;
  streak: number;
  masteredCount: number;
  totalConcepts: number;
  recentAccuracy: number;
  totalRecentAttempts: number;
  masteryData: { subject: string, probability: number, fullMark: number }[];
  activityData: { date: string, attempts: number, correct: number }[];
}

export default function AnalyticsView({ initialData }: { initialData: AnalyticsData }) {
  const { xp, streak, masteredCount, totalConcepts, recentAccuracy, totalRecentAttempts, masteryData, activityData } = initialData;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-tactile p-6 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 text-warning" />
          </div>
          <p className="text-sm font-bold text-foreground/50 uppercase tracking-widest">Total XP</p>
          <p className="text-3xl font-black text-warning">{xp}</p>
        </div>

        <div className="card-tactile p-6 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-2">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-sm font-bold text-foreground/50 uppercase tracking-widest">Day Streak</p>
          <p className="text-3xl font-black text-orange-500">{streak}</p>
        </div>

        <div className="card-tactile p-6 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-sm font-bold text-foreground/50 uppercase tracking-widest">Mastered</p>
          <p className="text-3xl font-black text-secondary">{masteredCount} <span className="text-xl text-foreground/30">/ {totalConcepts}</span></p>
        </div>

        <div className="card-tactile p-6 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground/50 uppercase tracking-widest">7d Accuracy</p>
          <p className="text-3xl font-black text-primary">{recentAccuracy}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Mastery Chart */}
        <div className="card-tactile p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Concept Mastery (%)</h2>
          {masteryData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masteryData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--panel-border)" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" width={100} tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--panel-border)', opacity: 0.2}}
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--secondary)' }}
                  />
                  <Bar dataKey="probability" fill="var(--secondary)" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-foreground/50 font-medium">No mastery data yet. Take a diagnostic!</div>
          )}
        </div>

        {/* Activity Chart */}
        <div className="card-tactile p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Activity (Last 7 Days)</h2>
          {totalRecentAttempts > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--panel-border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Line type="monotone" dataKey="attempts" stroke="var(--primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--panel-bg)' }} activeDot={{ r: 8 }} name="Attempts" />
                  <Line type="monotone" dataKey="correct" stroke="var(--secondary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--secondary)', strokeWidth: 2, stroke: 'var(--panel-bg)' }} activeDot={{ r: 8 }} name="Correct" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-foreground/50 font-medium text-center">
              <p>No activity in the last 7 days.</p>
              <p className="text-sm mt-2">Complete some practice questions to see your trends!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
