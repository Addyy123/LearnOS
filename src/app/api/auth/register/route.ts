import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"
import { z } from "zod"
import { generateToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/email"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      )
    }

    const hashedPassword = await argon2.hash(password)

    // Ensure a default tenant exists for MVP
    let defaultTenant = await prisma.tenant.findFirst()
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: { name: "Default Tenant" },
      })
    }

    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role: "LEARNER",
        tenantId: defaultTenant.id,
        isVerified: false,
      },
    })

    // Generate and store verification token
    const token = generateToken()
    await (prisma as any).verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    })

    // Send verification email
    await sendVerificationEmail(email, token)

    return NextResponse.json({ message: "User registered successfully, please verify your email." }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid registration data" },
      { status: 400 }
    )
  }
}
