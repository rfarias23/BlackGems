'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useActionState } from 'react';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DealStageSelect } from './deal-stage-select';
import { DealStage } from './deal-stage-badge';
import { createDeal } from '@/lib/actions/deals';
import Link from 'next/link';

// Form Schema
const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Company name must be at least 2 characters.',
    }),
    stage: z.enum([
        'Identified',
        'Initial Review',
        'NDA Signed',
        'IOI Submitted',
        'LOI Negotiation',
        'Due Diligence',
        'Closing',
        'Closed Won',
        'Closed Lost',
        'On Hold',
    ] as [string, ...string[]]),
    sector: z.string().min(2, {
        message: 'Sector must be at least 2 characters.',
    }),
    askPrice: z.string().optional(),
    description: z.string().optional(),
});

type DealFormValues = z.infer<typeof formSchema>;

const defaultValues: Partial<DealFormValues> = {
    stage: 'Identified',
    description: '',
};

export function DealForm() {
    const form = useForm<DealFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | undefined, formData: FormData) => {
            const result = await createDeal(formData);
            return result;
        },
        undefined
    );

    return (
        <Form {...form}>
            <form action={formAction} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Acme Corp" {...field} />
                            </FormControl>
                            <FormDescription>
                                The legal name of the target company.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="stage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stage</FormLabel>
                                <FormControl>
                                    <DealStageSelect
                                        value={field.value as DealStage}
                                        onValueChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sector"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sector</FormLabel>
                                <FormControl>
                                    <Input placeholder="Manufacturing" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="askPrice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Asking Price</FormLabel>
                            <FormControl>
                                <Input placeholder="$5,000,000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description / Investment Thesis</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about the deal..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {state?.error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {state.error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/deals">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Creating...' : 'Create Deal'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
