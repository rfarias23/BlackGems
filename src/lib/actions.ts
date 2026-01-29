'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        console.log("Attempting signIn...")
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: '/deals',
        })
        console.log("SignIn successful, redirecting...")
    } catch (error) {
        // NEXT_REDIRECT is thrown by Next.js to handle redirects.
        // We must re-throw it so the redirect actually happens.
        if ((error as Error).message?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        console.log("SignIn error:", error)

        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}
