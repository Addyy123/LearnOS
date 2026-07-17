import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function promote() {
  try {
    await prisma.user.updateMany({
      data: { role: "ADMIN" }
    })
    console.log("Successfully promoted all users to ADMIN.")
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

promote()
