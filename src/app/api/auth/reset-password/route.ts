import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"
import { z } from "zod"

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = resetPasswordSchema.parse(body)

    const existingToken = await (prisma as any).passwordResetToken.findUnique({
      where: { token }
    })

    if (!existingToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.email }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 400 })
    }

    const hashedPassword = await argon2.hash(password)

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { hashedPassword }
    })

    await (prisma as any).passwordResetToken.delete({
      where: { id: existingToken.id }
    })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
