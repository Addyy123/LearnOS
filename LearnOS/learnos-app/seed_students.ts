import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const educatorEmail = 'guest@learnos.ai';
  
  // 1. Find the educator
  const educator = await prisma.user.findUnique({
    where: { email: educatorEmail },
    include: { classrooms: true }
  });

  if (!educator) {
    console.error(`Educator not found with email: ${educatorEmail}`);
    return;
  }

  if (educator.classrooms.length === 0) {
    console.error(`Educator ${educatorEmail} has no classrooms. Please create one in the UI first.`);
    return;
  }

  const classroom = educator.classrooms[0];
  const tenantId = educator.tenantId;

  console.log(`Found educator: ${educator.email}`);
  console.log(`Found classroom: ${classroom.name} (${classroom.id})`);

  // 2. Ensure at least a couple of concepts exist in this tenant
  let concepts = await prisma.concept.findMany({
    where: { tenantId }
  });

  if (concepts.length === 0) {
    console.log('No concepts found. Creating dummy concepts...');
    await prisma.concept.createMany({
      data: [
        { tenantId, name: 'Introduction to Algebra', description: 'Basic algebra principles' },
        { tenantId, name: 'Photosynthesis', description: 'Biology fundamentals' },
        { tenantId, name: 'World War II', description: 'History basics' }
      ]
    });
    concepts = await prisma.concept.findMany({ where: { tenantId } });
  }

  // 3. Create 5 dummy learners
  const dummyLearners = [
    { email: 'alex@student.learnos.ai', name: 'Alex' },
    { email: 'bella@student.learnos.ai', name: 'Bella' },
    { email: 'charlie@student.learnos.ai', name: 'Charlie' },
    { email: 'diana@student.learnos.ai', name: 'Diana' },
    { email: 'ethan@student.learnos.ai', name: 'Ethan' }
  ];

  console.log('Creating dummy learners and enrollments...');

  for (const student of dummyLearners) {
    // Upsert the user
    let user = await prisma.user.findUnique({ where: { email: student.email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: student.email,
          role: 'LEARNER',
          tenantId: tenantId,
          isVerified: true
        }
      });
      console.log(`Created learner: ${student.email}`);
    } else {
      console.log(`Learner already exists: ${student.email}`);
    }

    // Upsert the classroom enrollment
    const existingEnrollment = await prisma.classroomEnrollment.findUnique({
      where: {
        classroomId_learnerId: {
          classroomId: classroom.id,
          learnerId: user.id
        }
      }
    });

    if (!existingEnrollment) {
      await prisma.classroomEnrollment.create({
        data: {
          classroomId: classroom.id,
          learnerId: user.id
        }
      });
      console.log(`Enrolled ${student.name} in classroom ${classroom.name}`);
    }

    // Upsert some fake mastery data
    for (const concept of concepts) {
      const probability = Math.random(); // Random mastery between 0 and 1
      const evidenceCount = Math.floor(Math.random() * 20) + 1; // 1 to 20 evidence
      
      const existingMastery = await prisma.masteryState.findUnique({
        where: {
          userId_conceptId: {
            userId: user.id,
            conceptId: concept.id
          }
        }
      });

      if (!existingMastery) {
        await prisma.masteryState.create({
          data: {
            tenantId,
            userId: user.id,
            conceptId: concept.id,
            probability,
            evidenceCount
          }
        });
      } else {
        await prisma.masteryState.update({
          where: { id: existingMastery.id },
          data: {
            probability,
            evidenceCount
          }
        });
      }
    }
    console.log(`Generated fake mastery data for ${student.name}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
