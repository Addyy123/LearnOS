import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'guest@learnos.ai' }
    });
    
    if (!user) throw new Error("User not found");
    
    const classrooms = await prisma.classroom.findMany({
      where: { educatorId: user.id }
    });
    
    if (classrooms.length === 0) throw new Error("No classrooms");
    
    const classroomId = classrooms[0].id;
    
    // THE EXACT CODE FROM educatorActions.ts
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId, educatorId: user.id } as any, // casting to any to replicate exactly if there's type issue? Wait, in educatorActions it's not casted.
      include: {
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

    console.log("Success:", averages);

  } catch (e: any) {
    console.error("Error occurred:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
