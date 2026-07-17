"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"

export async function getTenantAnalytics() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required")
  }

  const tenantId = currentUser.tenantId

  // Fetch all users in the tenant
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch high level metrics
  const totalUsers = users.length
  
  const totalGoals = await prisma.goal.count({
    where: { tenantId }
  })

  const totalConversations = await prisma.aiConversation.count({
    where: { tenantId }
  })

  // Fetch recent audit logs (Learning Events)
  const auditLogs = await prisma.learningEvent.findMany({
    where: { tenantId },
    include: {
      user: { select: { email: true } },
      concept: { select: { name: true } }
    },
    orderBy: { occurredAt: 'desc' },
    take: 50
  })

  return {
    users,
    metrics: {
      totalUsers,
      totalGoals,
      totalConversations
    },
    auditLogs
  }
}

export async function bulkImportUsers(csvText: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const lines = csvText.split('\n').filter(l => l.trim())
  
  // Skip header if it exists
  const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0
  let successCount = 0

  for (let i = startIndex; i < lines.length; i++) {
    const columns = lines[i].split(',')
    const email = columns[0]?.trim()
    let role = columns[1]?.trim().toUpperCase() || 'LEARNER'
    
    if (!['LEARNER', 'EDUCATOR', 'ADMIN'].includes(role)) {
      role = 'LEARNER'
    }

    if (email && email.includes('@')) {
      try {
        await prisma.user.create({
          data: {
            email,
            role,
            tenantId,
            isVerified: true, // Pre-verified since admin uploaded them
            hashedPassword: "TEMP_PASSWORD_NEEDS_RESET",
            onboardingCompleted: false
          }
        })
        successCount++
      } catch (e) {
        // Skip duplicates (email must be unique)
      }
    }
  }

  return { success: true, count: successCount }
}
