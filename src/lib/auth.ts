import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/shared/rate-limit"

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt' },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                try {
                    const { email, password } = await credentialsSchema.parseAsync(credentials)

                    // Rate limit: 10 attempts per email per minute
                    const rl = rateLimit(`auth:${email}`, 10, 60_000)
                    if (!rl.success) {
                        return null
                    }

                    const user = await prisma.user.findUnique({
                        where: { email },
                        include: { investor: { select: { id: true } } },
                    })

                    if (!user || !user.passwordHash) {
                        return null
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

                    if (!passwordsMatch) {
                        return null
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        investorId: user.investor?.id ?? null,
                        organizationId: user.organizationId ?? null,
                    }
                } catch (error) {
                    console.error("Authorize error:", error);
                    return null
                }
            },
        }),
    ],
})
