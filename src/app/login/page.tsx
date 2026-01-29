import { LoginForm } from '@/components/auth/login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login - BlackGem',
    description: 'Login to your account',
}

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <LoginForm />
        </div>
    )
}
