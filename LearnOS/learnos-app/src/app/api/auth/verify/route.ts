import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  try {
    const existingToken = await (prisma as any).verificationToken.findUnique({
      where: { token }
    })

    if (!existingToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: existingToken.identifier }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    })

    await (prisma as any).verificationToken.delete({
      where: { token }
    })

    return NextResponse.redirect(new URL("/login?verified=true", req.url))
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
