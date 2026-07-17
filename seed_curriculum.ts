import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find or create a tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Default Tenant' }
    });
    console.log('Created Default Tenant');
  }

  const tenantId = tenant.id;

  const curriculumData = [
    {
      name: 'Algebra Basics',
      description: 'Foundational concepts of Algebra including variables, expressions, and linear equations.',
      assets: [
        { type: 'ARTICLE', body: JSON.stringify({ title: 'Introduction to Variables', content: 'A variable is a letter used to represent an unknown number...' }) },
        { type: 'QUESTION', body: JSON.stringify({ question: 'Solve for x: 2x = 10', options: ['3', '4', '5', '6'], answer: '5' }) },
        { type: 'QUESTION', body: JSON.stringify({ question: 'Evaluate: 3a + 2 when a = 4', options: ['12', '14', '10', '16'], answer: '14' }) },
        { type: 'QUESTION', body: JSON.stringify({ question: 'Simplify: 2x + 3x', options: ['5x', '6x', '5x^2', 'x'], answer: '5x' }) },
      ]
    },
    {
      name: 'Biology: Cell Structure',
      description: 'Learn about the basic building blocks of life, cell organelles, and their functions.',
      assets: [
        { type: 'ARTICLE', body: JSON.stringify({ title: 'The Mighty Mitochondria', content: 'The mitochondria is known as the powerhouse of the cell...' }) },
        { type: 'QUESTION', body: JSON.stringify({ question: 'Which organelle is responsible for cellular respiration?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], answer: 'Mitochondria' }) },
        { type: 'QUESTION', body: JSON.stringify({ question: 'What contains the genetic material in a eukaryotic cell?', options: ['Cytoplasm', 'Nucleus', 'Cell membrane', 'Vacuole'], answer: 'Nucleus' }) },
      ]
    }
  ];

  console.log('Seeding Curriculum...');

  for (const course of curriculumData) {
    // Check if concept exists
    let concept = await prisma.concept.findFirst({
      where: { tenantId, name: course.name }
    });

    if (!concept) {
      concept = await prisma.concept.create({
        data: {
          tenantId,
          name: course.name,
          description: course.description
        }
      });
      console.log(`Created Concept: ${concept.name}`);
    } else {
      console.log(`Concept ${concept.name} already exists.`);
    }

    // Seed assets
    for (const assetData of course.assets) {
      const existingAsset = await prisma.contentAsset.findFirst({
        where: { conceptId: concept.id, body: assetData.body }
      });

      if (!existingAsset) {
        await prisma.contentAsset.create({
          data: {
            tenantId,
            conceptId: concept.id,
            type: assetData.type,
            body: assetData.body,
            isApproved: true
          }
        });
        console.log(`  Created ${assetData.type} asset for ${concept.name}`);
      }
    }
  }

  console.log('Curriculum Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
