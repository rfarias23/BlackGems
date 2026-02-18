import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@prisma/client"

const LP_ROLES: UserRole[] = ['LP_PRIMARY', 'LP_VIEWER']

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthPage = nextUrl.pathname.startsWith('/login')
            const role = auth?.user?.role as UserRole | undefined

            // Dashboard (Cockpit) protected routes
            const isDashboardRoute =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/deals') ||
                nextUrl.pathname.startsWith('/investors') ||
                nextUrl.pathname.startsWith('/portfolio') ||
                nextUrl.pathname.startsWith('/capital') ||
                nextUrl.pathname.startsWith('/reports') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/settings')

            // Portal (Library) protected routes
            const isPortalRoute = nextUrl.pathname.startsWith('/portal')

            if (isDashboardRoute) {
                if (!isLoggedIn) return false
                // LP users should not access the dashboard
                if (role && LP_ROLES.includes(role)) {
                    return Response.redirect(new URL('/portal', nextUrl))
                }
                return true
            }

            if (isPortalRoute) {
                if (!isLoggedIn) return false
                return true
            }

            if (isAuthPage && isLoggedIn) {
                // Redirect based on role
                if (role && LP_ROLES.includes(role)) {
                    return Response.redirect(new URL('/portal', nextUrl))
                }
                return Response.redirect(new URL('/deals', nextUrl))
            }

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.sub = user.id
                token.investorId = user.investorId ?? null
                token.organizationId = user.organizationId ?? null
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string
                session.user.role = token.role as UserRole
                session.user.investorId = token.investorId as string | null
                session.user.organizationId = token.organizationId as string | null
            }
            return session
        },
    },
    providers: [],
} satisfies NextAuthConfig
