'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFund } from '@/lib/actions/funds'

const dark = {
  dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
  input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
  cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
  saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
  select: 'bg-[#11141D] border-[#334155] text-[#F8FAFC]',
} as const

const FUND_TYPES = [
  { value: 'TRADITIONAL_SEARCH_FUND', label: 'Traditional Search Fund' },
  { value: 'SELF_FUNDED_SEARCH', label: 'Self-Funded Search' },
  { value: 'ACCELERATOR_FUND', label: 'Accelerator Fund' },
  { value: 'ACQUISITION_FUND', label: 'Acquisition Fund' },
  { value: 'PE_FUND', label: 'PE Fund' },
  { value: 'HOLDING_COMPANY', label: 'Holding Company' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '£' },
]

export function CreateFundDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState('USD')

  // Listen for custom event from fund switcher
  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-create-fund', handler)
    return () => document.removeEventListener('open-create-fund', handler)
  }, [])

  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? '$'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createFund(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setError(null)
    }}>
      <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
        <DialogHeader>
          <DialogTitle className="text-[#F8FAFC]">Create Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fund Name */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Fund Name</Label>
            <Input
              name="name"
              placeholder="Apex Fund I"
              required
              className={dark.input}
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Currency</Label>
            <Select
              name="currency"
              value={currency}
              onValueChange={setCurrency}
            >
              <SelectTrigger className={dark.select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#64748B]">
              Currency cannot be changed after creation.
            </p>
          </div>

          {/* Fund Type */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Fund Type</Label>
            <Select name="type" defaultValue="TRADITIONAL_SEARCH_FUND">
              <SelectTrigger className={dark.select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {FUND_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Size */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Target Size</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-mono text-sm">
                {currencySymbol}
              </span>
              <Input
                name="targetSize"
                type="text"
                inputMode="numeric"
                placeholder="50,000,000"
                required
                className={`${dark.input} pl-7 font-mono tabular-nums`}
              />
            </div>
          </div>

          {/* Vintage */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Vintage Year</Label>
            <Input
              name="vintage"
              type="number"
              placeholder={String(new Date().getFullYear())}
              className={`${dark.input} font-mono tabular-nums`}
            />
          </div>

          {error && (
            <div className="rounded-md p-2 text-sm bg-[#DC2626]/15 text-[#DC2626]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className={dark.cancelBtn}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={dark.saveBtn}
            >
              {isPending ? 'Creating...' : 'Create Fund'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
