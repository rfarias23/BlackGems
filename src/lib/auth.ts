import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

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

                    const user = await prisma.user.findUnique({
                        where: { email },
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
                    }
                } catch (error) {
                    console.error("Authorize error:", error);
                    return null
                }
            },
        }),
    ],
})
