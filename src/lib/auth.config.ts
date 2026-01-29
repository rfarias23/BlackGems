import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthPage = nextUrl.pathname.startsWith('/login')

            // Protected routes patterns
            const isProtectedRoute =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/deals') ||
                nextUrl.pathname.startsWith('/investors') ||
                nextUrl.pathname.startsWith('/portfolio') ||
                nextUrl.pathname.startsWith('/capital') ||
                nextUrl.pathname.startsWith('/reports')

            if (isProtectedRoute) {
                if (isLoggedIn) return true
                return false // Redirect to login
            }

            if (isAuthPage && isLoggedIn) {
                return Response.redirect(new URL('/deals', nextUrl))
            }

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as any
            }
            return session
        },
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig
