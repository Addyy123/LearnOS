import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function promote() {
  try {
    await prisma.user.updateMany({
      where: { email: "guest@learnos.ai" },
      data: { role: "EDUCATOR" }
    })
    console.log("Successfully promoted guest@learnos.ai to EDUCATOR.")
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

promote()
