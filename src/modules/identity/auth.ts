import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { type: "text" },
        password: { type: "password" },
        isGuest: { type: "text" },
      },
      authorize: async (credentials) => {
        try {
          if (credentials?.isGuest === "true") {
            let tenant = await prisma.tenant.findFirst()
            if (!tenant) {
              tenant = await prisma.tenant.create({ data: { name: "Guest Tenant" } })
            }
            const guestId = crypto.randomUUID()
            const guest = await prisma.user.create({
              data: {
                email: `guest_${guestId}@learnos.ai`,
                role: "LEARNER",
                tenantId: tenant.id
              }
            })
            return {
              id: guest.id,
              email: guest.email,
              role: guest.role,
              tenantId: guest.tenantId,
            }
          }

          const { email, password } = await z.object({
            email: z.string().email(),
            password: z.string().min(1),
          }).parseAsync(credentials)

          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.hashedPassword) {
            return null
          }

          if (user.role !== "ADMIN" && user.role !== "EDUCATOR" && !user.isVerified) {
            throw new Error("Email not verified. Please check your inbox.")
          }

          const isValidPassword = await argon2.verify(user.hashedPassword, password)

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
          }
        } catch (error) {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub as string
      session.user.role = token.role as string
      session.user.tenantId = token.tenantId as string
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
