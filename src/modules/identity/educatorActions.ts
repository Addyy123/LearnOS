"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createClassroom(name: string, description?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden: Educator access required")
  }

  const classroom = await prisma.classroom.create({
    data: {
      name,
      description,
      tenantId: user.tenantId,
      educatorId: user.id
    }
  })

  revalidatePath("/educator")
  return classroom
}

export async function getEducatorClassrooms() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden: Educator access required")
  }

  const classrooms = await prisma.classroom.findMany({
    where: { educatorId: user.id },
    include: {
      _count: {
        select: { enrollments: true, assignments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return classrooms
}

export async function getClassroomAnalytics(classroomId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden: Educator access required")
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId, educatorId: user.id },
    include: {
      assignments: {
        include: { concept: true },
        orderBy: { createdAt: 'desc' }
      },
      enrollments: {
        include: {
          learner: {
            include: {
              mastery: {
                include: { concept: true }
              }
            }
          }
        }
      }
    }
  })

  if (!classroom) throw new Error("Classroom not found")

  // Calculate average mastery per concept across all students
  const conceptAverages: Record<string, { name: string, total: number, count: number }> = {}

  classroom.enrollments.forEach(enroll => {
    enroll.learner.mastery.forEach(m => {
      if (!conceptAverages[m.conceptId]) {
        conceptAverages[m.conceptId] = { name: m.concept.name, total: 0, count: 0 }
      }
      conceptAverages[m.conceptId].total += m.probability
      conceptAverages[m.conceptId].count += 1
    })
  })

  const averages = Object.values(conceptAverages).map(c => ({
    name: c.name,
    averageMastery: Math.round(c.total / c.count)
  }))

  return {
    classroom,
    averages
  }
}

export async function getConcepts() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user) throw new Error("User not found")

  const concepts = await prisma.concept.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { name: 'asc' }
  })

  return concepts
}

export async function createAssignment(classroomId: string, conceptId: string, title: string, dueDateStr?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden: Educator access required")
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId, educatorId: user.id }
  })

  if (!classroom) throw new Error("Classroom not found")

  const assignment = await prisma.assignment.create({
    data: {
      title,
      dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
      tenantId: user.tenantId,
      classroomId: classroom.id,
      conceptId
    }
  })

  revalidatePath(`/educator/${classroomId}`)
  return { success: true, assignment }
}

export async function syncFromLms(platform: "canvas" | "google") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden: Educator access required")
  }

  const platformName = platform === "canvas" ? "Canvas" : "Google Classroom"
  
  // 1. Create a mock classroom
  const classroom = await prisma.classroom.create({
    data: {
      name: `Synced from ${platformName}`,
      description: `Automatically imported roster from ${platformName}.`,
      tenantId: user.tenantId,
      educatorId: user.id
    }
  })

  // 2. Create 3 mock learners
  const mockEmails = [
    `student1.${Date.now()}@mock.learnos.ai`,
    `student2.${Date.now()}@mock.learnos.ai`,
    `student3.${Date.now()}@mock.learnos.ai`
  ]

  for (const email of mockEmails) {
    const learner = await prisma.user.create({
      data: {
        email,
        role: "LEARNER",
        tenantId: user.tenantId,
        isVerified: true
      }
    })

    // 3. Enroll them in the new classroom
    await prisma.classroomEnrollment.create({
      data: {
        classroomId: classroom.id,
        learnerId: learner.id
      }
    })
  }

  revalidatePath("/educator")
  return { success: true, classroomId: classroom.id }
}

export async function importCsvRoster(csvContent: string, classroomName: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden: Educator access required")
  }

  // Parse CSV (expecting simple list of emails separated by commas or newlines)
  const emails = csvContent
    .split(/[\n,]/)
    .map(e => e.trim())
    .filter(e => e.includes("@"))

  if (emails.length === 0) {
    throw new Error("No valid emails found in CSV")
  }

  // 1. Create classroom
  const classroom = await prisma.classroom.create({
    data: {
      name: classroomName || "Imported Classroom",
      tenantId: user.tenantId,
      educatorId: user.id
    }
  })

  // 2. Provision learners and enroll them
  for (const email of emails) {
    // Check if user already exists
    let learner = await prisma.user.findUnique({ where: { email } })
    
    if (!learner) {
      learner = await prisma.user.create({
        data: {
          email,
          role: "LEARNER",
          tenantId: user.tenantId,
          isVerified: true
        }
      })
    }

    // Enroll
    await prisma.classroomEnrollment.upsert({
      where: {
        classroomId_learnerId: {
          classroomId: classroom.id,
          learnerId: learner.id
        }
      },
      create: {
        classroomId: classroom.id,
        learnerId: learner.id
      },
      update: {}
    })
  }

  revalidatePath("/educator")
  return { success: true, classroomId: classroom.id, importedCount: emails.length }
}

export async function getEducatorAlerts() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user || user.role !== "EDUCATOR") {
    throw new Error("Forbidden")
  }

  // Get all classrooms for this educator
  const classrooms = await prisma.classroom.findMany({
    where: { educatorId: user.id },
    include: {
      enrollments: true
    }
  })

  // Get all unique learner IDs
  const learnerIds = Array.from(new Set(classrooms.flatMap(c => c.enrollments.map(e => e.learnerId))))

  // Get open alerts for these learners
  const alerts = await prisma.interventionAlert.findMany({
    where: {
      userId: { in: learnerIds },
      status: "OPEN"
    },
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" }
  })

  return alerts
}
