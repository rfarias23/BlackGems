'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)

    return (
        <Card className="w-full max-w-sm border-border bg-card">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="m@example.com"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            required
                        />
                    </div>
                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-destructive" aria-live="polite">
                            <AlertCircle className="h-4 w-4" />
                            <p>{errorMessage}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <LoginButton />
                </CardFooter>
            </form>
        </Card>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <Button className="w-full" aria-disabled={pending} disabled={pending}>
            {pending ? 'Logging in...' : 'Sign in'}
        </Button>
    )
}
