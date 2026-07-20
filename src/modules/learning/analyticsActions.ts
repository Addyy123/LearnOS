"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"

export async function getLearnerAnalytics() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      xp: true,
      currentStreak: true,
      tenantId: true
    }
  })

  if (!user) throw new Error("User not found")

  // Fetch Mastery States
  const masteryStates = await prisma.masteryState.findMany({
    where: { userId: session.user.id },
    include: {
      concept: {
        select: { name: true }
      }
    }
  })

  // Format Mastery for Chart (BarChart)
  const masteryData = masteryStates.map(m => ({
    subject: m.concept.name,
    probability: Math.round(m.probability),
    fullMark: 100,
  }))

  const masteredCount = masteryStates.filter(m => m.probability >= 80).length

  // Fetch recent Learning Events (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // Include today, so go back 6 days
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const learningEvents = await prisma.learningEvent.findMany({
    where: {
      userId: session.user.id,
      occurredAt: {
        gte: sevenDaysAgo
      },
      eventType: "PRACTICE_ATTEMPT"
    },
    orderBy: { occurredAt: "asc" }
  })

  // Format Activity for Chart (LineChart)
  // We want an array of the last 7 days: [{ date: 'Mon', attempts: 5, correct: 3 }, ...]
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const activityDataMap = new Map<string, { date: string, attempts: number, correct: number, fullDate: Date }>()

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const dayStr = daysOfWeek[d.getDay()]
    const dateKey = d.toISOString().split('T')[0]
    
    activityDataMap.set(dateKey, {
      date: dayStr,
      fullDate: d,
      attempts: 0,
      correct: 0
    })
  }

  let totalAttempts = 0
  let correctAttempts = 0

  for (const event of learningEvents) {
    const dateKey = event.occurredAt.toISOString().split('T')[0]
    if (activityDataMap.has(dateKey)) {
      const data = activityDataMap.get(dateKey)!
      data.attempts += 1
      if (event.isCorrect) data.correct += 1
      
      totalAttempts += 1
      if (event.isCorrect) correctAttempts += 1
    }
  }

  const activityData = Array.from(activityDataMap.values()).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime()).map(({ date, attempts, correct }) => ({
    date, attempts, correct
  }))

  const recentAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  return {
    xp: user.xp,
    streak: user.currentStreak,
    masteredCount,
    totalConcepts: masteryStates.length,
    recentAccuracy,
    totalRecentAttempts: totalAttempts,
    masteryData,
    activityData
  }
}
