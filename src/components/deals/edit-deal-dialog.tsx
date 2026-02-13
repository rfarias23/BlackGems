'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DealStageSelect } from './deal-stage-select'
import { DealStage } from './deal-stage-badge'
import { updateDeal } from '@/lib/actions/deals'
import { Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Hardcoded hex colors for portal component (Dialog renders outside layout div)
const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626] rounded-md p-3 text-sm',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
    muted: 'text-[#94A3B8]',
    textarea: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF] resize-none min-h-[100px]',
} as const

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
})

type DealFormValues = z.infer<typeof formSchema>

interface EditDealDialogProps {
    deal: {
        id: string
        name: string
        stage: string
        industry: string | null
        askingPrice: string | null
        description: string | null
    }
}

export function EditDealDialog({ deal }: EditDealDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const form = useForm<DealFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: deal.name,
            stage: deal.stage as DealStage,
            sector: deal.industry || '',
            askPrice: deal.askingPrice || '',
            description: deal.description || '',
        },
    })

    async function onSubmit(values: DealFormValues) {
        setIsLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('name', values.name)
        formData.append('stage', values.stage)
        formData.append('sector', values.sector)
        if (values.askPrice) formData.append('askPrice', values.askPrice)
        if (values.description) formData.append('description', values.description)

        const result = await updateDeal(deal.id, formData)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={dark.cancelBtn}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Deal
                </Button>
            </DialogTrigger>
            <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Edit Deal</DialogTitle>
                    <DialogDescription className={dark.muted}>
                        Update the basic information for this deal.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={dark.label}>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corp" className={dark.input} {...field} />
                                    </FormControl>
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
                                        <FormLabel className={dark.label}>Stage</FormLabel>
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
                                        <FormLabel className={dark.label}>Sector</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Manufacturing" className={dark.input} {...field} />
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
                                    <FormLabel className={dark.label}>Asking Price</FormLabel>
                                    <FormControl>
                                        <Input placeholder="$5,000,000" className={dark.input} {...field} />
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
                                    <FormLabel className={dark.label}>Description / Investment Thesis</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about the deal..."
                                            className={dark.textarea}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <div className={dark.error}>
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                                className={dark.cancelBtn}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className={dark.saveBtn}
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
