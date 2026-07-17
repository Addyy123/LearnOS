import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateToken } from "@/lib/tokens"
import { sendPasswordResetEmail } from "@/lib/email"

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!existingUser) {
      // Return success even if user doesn't exist for security (avoid enumerating emails)
      return NextResponse.json({ message: "Reset email sent" })
    }

    const token = generateToken()

    await (prisma as any).passwordResetToken.create({
      data: {
        email,
        token,
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
      }
    })

    await sendPasswordResetEmail(email, token)

    return NextResponse.json({ message: "Reset email sent" })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
