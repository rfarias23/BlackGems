'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { acceptInvitation } from '@/lib/actions/users'

interface AcceptInviteFormProps {
    token: string
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    if (!token) {
        return (
            <Card className="w-full max-w-sm border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl">Invalid Link</CardTitle>
                    <CardDescription>
                        This invitation link is missing or invalid. Please check the link in your email or contact your fund manager.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
                        Go to Login
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        startTransition(async () => {
            const result = await acceptInvitation(token, name, password)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        })
    }

    if (success) {
        return (
            <Card className="w-full max-w-sm border-border bg-card">
                <CardHeader className="text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                    <CardTitle className="text-2xl">Account Created</CardTitle>
                    <CardDescription>
                        Your account has been set up successfully. Redirecting to login...
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm border-border bg-card">
            <CardHeader>
                <CardTitle className="text-2xl">Welcome to BlackGem</CardTitle>
                <CardDescription>
                    Set up your account to access the investor portal.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Smith"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            required
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive" aria-live="polite">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
