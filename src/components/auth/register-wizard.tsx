'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Building2, Search } from 'lucide-react'
import { registerWithOnboarding } from '@/lib/actions/onboarding'
import { generateSlug, validateSlug } from '@/lib/shared/slug-utils'
import {
  vehicleTypeSchema,
  searchFundStepSchema,
  peFirmStepSchema,
  peFundStepSchema,
  peAccountStepSchema,
  type VehicleType,
  type OnboardingInput,
} from '@/lib/shared/onboarding-schemas'

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  // Step 1
  vehicleType: VehicleType | null
  // Firm
  firmName: string
  orgSlug: string
  orgSlugEdited: boolean
  legalName: string
  entityType: string
  jurisdiction: string
  // Fund
  fundName: string
  fundSlug: string
  fundSlugEdited: boolean
  fundType: string
  targetSize: string
  vintage: string
  currency: string
  strategy: string
  // Account
  userName: string
  userEmail: string
  password: string
  confirmPassword: string
}

const initialState: WizardState = {
  vehicleType: null,
  firmName: '',
  orgSlug: '',
  orgSlugEdited: false,
  legalName: '',
  entityType: '',
  jurisdiction: '',
  fundName: '',
  fundSlug: '',
  fundSlugEdited: false,
  fundType: '',
  targetSize: '',
  vintage: new Date().getFullYear().toString(),
  currency: 'USD',
  strategy: '',
  userName: '',
  userEmail: '',
  password: '',
  confirmPassword: '',
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="mb-10">
      {/* Desktop: dots + labels */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i < current ? 'bg-[#059669]' : i === current ? 'bg-[#3E5CFF]' : 'bg-[#334155]'
                }`}
              />
              <span className={`mt-2 text-[11px] ${i === current ? 'text-slate-300' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-px w-12 mx-2 mb-5 ${i < current ? 'bg-[#059669]' : 'bg-[#334155]'}`} />
            )}
          </div>
        ))}
      </div>
      {/* Mobile: text */}
      <p className="sm:hidden text-center text-[13px] text-slate-500">
        Step {current + 1} of {total}
      </p>
    </div>
  )
}

// ============================================================================
// SLUG PREVIEW
// ============================================================================

function SlugPreview({ slug }: { slug: string }) {
  if (!slug) return null
  return (
    <p className="text-[13px] text-slate-500 font-mono mt-1">
      {slug}.blackgem.ai
    </p>
  )
}

// ============================================================================
// SHARED INPUT CLASSES
// ============================================================================

const inputClass = 'w-full rounded-lg border border-[#334155] bg-[#1E2432] px-4 py-3 text-[14px] text-[#F8FAFC] placeholder:text-slate-500 outline-none transition-colors focus:border-[#3E5CFF] focus:ring-1 focus:ring-[#3E5CFF]'
const labelClass = 'block text-[13px] text-slate-400'
const selectClass = 'w-full rounded-lg border border-[#334155] bg-[#1E2432] px-4 py-3 text-[14px] text-[#F8FAFC] outline-none transition-colors focus:border-[#3E5CFF] focus:ring-1 focus:ring-[#3E5CFF] appearance-none'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RegisterWizard() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<WizardState>(initialState)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  // Pre-select vehicle type from query param (?type=search or ?type=pe)
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'search') {
      setState(s => ({ ...s, vehicleType: 'SEARCH_FUND' }))
      setStep(1)
    } else if (type === 'pe') {
      setState(s => ({ ...s, vehicleType: 'PE_FUND' }))
      setStep(1)
    }
  }, [searchParams])

  // Auto-generate slugs from names
  useEffect(() => {
    if (!state.orgSlugEdited && state.firmName) {
      setState(s => ({ ...s, orgSlug: generateSlug(s.firmName) }))
    }
  }, [state.firmName, state.orgSlugEdited])

  useEffect(() => {
    if (!state.fundSlugEdited && state.fundName) {
      setState(s => ({ ...s, fundSlug: generateSlug(s.fundName) }))
    }
  }, [state.fundName, state.fundSlugEdited])

  const update = (fields: Partial<WizardState>) => setState(s => ({ ...s, ...fields }))

  // Step configuration by vehicle type
  const isSearchFund = state.vehicleType === 'SEARCH_FUND'
  const stepLabels = isSearchFund
    ? ['Type', 'Fund', 'Done']
    : ['Type', 'Firm', 'Fund', 'Account', 'Done']
  const totalSteps = stepLabels.length

  // --------
  // STEP VALIDATION
  // --------

  function validateCurrentStep(): boolean {
    setError(null)

    if (step === 0) {
      const result = vehicleTypeSchema.safeParse({ vehicleType: state.vehicleType })
      if (!result.success) { setError('Please select a vehicle type.'); return false }
      return true
    }

    if (isSearchFund && step === 1) {
      // Validate slug
      const slugResult = validateSlug(state.orgSlug)
      if (!slugResult.valid) { setError(slugResult.error); return false }
      // Validate all fields
      const targetNum = parseFloat(state.targetSize.replace(/[$€£,]/g, ''))
      const result = searchFundStepSchema.safeParse({
        firmName: state.firmName,
        targetSize: isNaN(targetNum) ? 0 : targetNum,
        currency: state.currency,
        userName: state.userName,
        userEmail: state.userEmail,
        password: state.password,
        confirmPassword: state.confirmPassword,
      })
      if (!result.success) { setError(result.error.issues[0]?.message ?? 'Invalid input'); return false }
      return true
    }

    // PE Fund steps
    if (!isSearchFund) {
      if (step === 1) {
        const slugResult = validateSlug(state.orgSlug)
        if (!slugResult.valid) { setError(slugResult.error); return false }
        const result = peFirmStepSchema.safeParse({
          firmName: state.firmName,
          orgSlug: state.orgSlug,
          legalName: state.legalName,
          entityType: state.entityType,
          jurisdiction: state.jurisdiction,
        })
        if (!result.success) { setError(result.error.issues[0]?.message ?? 'Invalid input'); return false }
        return true
      }
      if (step === 2) {
        const slugResult = validateSlug(state.fundSlug)
        if (!slugResult.valid) { setError(slugResult.error); return false }
        const targetNum = parseFloat(state.targetSize.replace(/[$€£,]/g, ''))
        const result = peFundStepSchema.safeParse({
          fundName: state.fundName,
          fundSlug: state.fundSlug,
          fundType: state.fundType,
          targetSize: isNaN(targetNum) ? 0 : targetNum,
          currency: state.currency,
          vintage: state.vintage ? parseInt(state.vintage, 10) : undefined,
          strategy: state.strategy,
        })
        if (!result.success) { setError(result.error.issues[0]?.message ?? 'Invalid input'); return false }
        return true
      }
      if (step === 3) {
        const result = peAccountStepSchema.safeParse({
          userName: state.userName,
          userEmail: state.userEmail,
          password: state.password,
          confirmPassword: state.confirmPassword,
        })
        if (!result.success) { setError(result.error.issues[0]?.message ?? 'Invalid input'); return false }
        return true
      }
    }

    return true
  }

  // --------
  // NAVIGATION
  // --------

  function goNext() {
    if (!validateCurrentStep()) return

    const isLastFormStep = isSearchFund ? step === 1 : step === 3
    if (isLastFormStep) {
      submitRegistration()
    } else {
      setStep(s => s + 1)
    }
  }

  function goBack() {
    setError(null)
    setStep(s => Math.max(0, s - 1))
  }

  // --------
  // SUBMIT
  // --------

  function submitRegistration() {
    if (!state.vehicleType) { setError('Please select a vehicle type.'); return }

    const targetNum = parseFloat(state.targetSize.replace(/[$€£,]/g, ''))

    const input: OnboardingInput = {
      vehicleType: state.vehicleType,
      firmName: state.firmName,
      orgSlug: state.orgSlug,
      legalName: state.legalName || undefined,
      entityType: state.entityType || undefined,
      jurisdiction: state.jurisdiction || undefined,
      fundName: isSearchFund ? undefined : state.fundName,
      fundSlug: isSearchFund ? undefined : state.fundSlug,
      fundType: isSearchFund ? undefined : (state.fundType as OnboardingInput['fundType']),
      targetSize: targetNum,
      vintage: !isSearchFund && state.vintage ? parseInt(state.vintage, 10) : undefined,
      currency: state.currency as OnboardingInput['currency'],
      strategy: state.strategy || undefined,
      userName: state.userName,
      userEmail: state.userEmail,
      password: state.password,
      confirmPassword: state.confirmPassword,
    }

    startTransition(async () => {
      setError(null)
      const result = await registerWithOnboarding(input)

      if ('error' in result) {
        setError(result.error)
        return
      }

      // Success — show success step, then auto-login
      setSuccess(true)
      setStep(totalSteps - 1)

      // Auto-login
      try {
        const signInResult = await signIn('credentials', {
          email: state.userEmail,
          password: state.password,
          redirect: false,
        })

        if (signInResult?.ok) {
          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'blackgem.ai'
          const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
          const dashboardUrl = isLocal
            ? `/dashboard?fund=${result.fundSlug}`
            : `https://${result.fundSlug}.${rootDomain}/dashboard`

          setTimeout(() => {
            window.location.href = dashboardUrl
          }, 1500)
        }
      } catch {
        // signIn failed — user can still log in manually
      }
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // SUCCESS STEP
  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-[#059669] mx-auto mb-4" />
        <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
          Your account is ready.
        </h1>
        <p className="text-[14px] text-slate-400">
          Redirecting to your dashboard...
        </p>
        <p className="text-[12px] text-slate-600 mt-6">
          If you are not redirected,{' '}
          <a href="/login" className="text-[#3E5CFF] hover:underline">sign in here</a>.
        </p>
      </div>
    )
  }

  return (
    <div>
      <StepIndicator current={step} total={totalSteps} labels={stepLabels} />

      {/* STEP 0: Vehicle Type Selection */}
      {step === 0 && (
        <div>
          <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
            What are you building?
          </h1>
          <p className="text-[14px] text-slate-400 mb-8">
            Select the type of investment vehicle you&apos;re setting up.
          </p>

          <div className="space-y-3">
            <VehicleCard
              selected={state.vehicleType === 'SEARCH_FUND'}
              onClick={() => { update({ vehicleType: 'SEARCH_FUND' }); setError(null); setStep(1) }}
              icon={<Search className="h-5 w-5" />}
              title="Search Fund"
              description="Raising capital to acquire and operate a single business."
            />
            <VehicleCard
              selected={state.vehicleType === 'PE_FUND'}
              onClick={() => { update({ vehicleType: 'PE_FUND' }); setError(null); setStep(1) }}
              icon={<Building2 className="h-5 w-5" />}
              title="PE Fund"
              description="Managing one or more funds — from single-fund operators to multi-vehicle firms."
            />
          </div>

          {error && <ErrorMessage message={error} />}
        </div>
      )}

      {/* STEP 1 (Search Fund): Combined firm + fund + account */}
      {step === 1 && isSearchFund && (
        <div>
          <BackButton onClick={goBack} />
          <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
            Set up your fund
          </h1>
          <p className="text-[14px] text-slate-400 mb-8">
            We&apos;ll create your firm, fund, and account.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); goNext() }} className="space-y-5">
            {/* Fund name */}
            <div className="space-y-2">
              <label htmlFor="sf-name" className={labelClass}>Fund name</label>
              <input id="sf-name" type="text" value={state.firmName} onChange={e => update({ firmName: e.target.value })} placeholder="e.g., Martha Fund" required className={inputClass} />
              <SlugPreview slug={state.orgSlug} />
            </div>

            {/* Target size + Currency (side by side) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <label htmlFor="sf-target" className={labelClass}>How much are you raising?</label>
                <input id="sf-target" type="text" value={state.targetSize} onChange={e => update({ targetSize: e.target.value })} placeholder="5,000,000" required className={inputClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor="sf-currency" className={labelClass}>Currency</label>
                <select id="sf-currency" value={state.currency} onChange={e => update({ currency: e.target.value })} className={selectClass}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-[#334155] my-6" />

            {/* Account fields */}
            <div className="space-y-2">
              <label htmlFor="sf-user" className={labelClass}>Your name</label>
              <input id="sf-user" type="text" value={state.userName} onChange={e => update({ userName: e.target.value })} placeholder="Martha Smith" required className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="sf-email" className={labelClass}>Email</label>
              <input id="sf-email" type="email" value={state.userEmail} onChange={e => update({ userEmail: e.target.value })} placeholder="martha@fund.com" required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="sf-pw" className={labelClass}>Password</label>
                <input id="sf-pw" type="password" value={state.password} onChange={e => update({ password: e.target.value })} placeholder="Min. 8 characters" required className={inputClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor="sf-cpw" className={labelClass}>Confirm</label>
                <input id="sf-cpw" type="password" value={state.confirmPassword} onChange={e => update({ confirmPassword: e.target.value })} placeholder="Repeat password" required className={inputClass} />
              </div>
            </div>

            <p className="text-[12px] text-slate-600">
              Running a self-funded search? You can change your fund type in Settings after signup.
            </p>

            {error && <ErrorMessage message={error} />}

            <SubmitButton pending={isPending} label="Create account" pendingLabel="Creating account..." />
          </form>
        </div>
      )}

      {/* STEP 1 (PE Fund): Firm info */}
      {step === 1 && !isSearchFund && (
        <div>
          <BackButton onClick={goBack} />
          <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
            About your firm
          </h1>
          <p className="text-[14px] text-slate-400 mb-8">
            Tell us about your organization.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); goNext() }} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="pe-firm" className={labelClass}>Firm name</label>
              <input id="pe-firm" type="text" value={state.firmName} onChange={e => update({ firmName: e.target.value })} placeholder="Andes Capital Partners" required className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pe-slug" className={labelClass}>URL</label>
              <input id="pe-slug" type="text" value={state.orgSlug} onChange={e => update({ orgSlug: e.target.value, orgSlugEdited: true })} placeholder="andes-capital" required className={inputClass} />
              <SlugPreview slug={state.orgSlug} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pe-legal" className={labelClass}>Legal entity name <span className="text-slate-600">(optional)</span></label>
              <input id="pe-legal" type="text" value={state.legalName} onChange={e => update({ legalName: e.target.value })} placeholder="Andes Capital Partners LLC" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="pe-entity" className={labelClass}>Entity type <span className="text-slate-600">(optional)</span></label>
                <select id="pe-entity" value={state.entityType} onChange={e => update({ entityType: e.target.value })} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="LLC">LLC</option>
                  <option value="LP">LP</option>
                  <option value="C_CORP">C Corp</option>
                  <option value="S_CORP">S Corp</option>
                  <option value="SICAV">SICAV</option>
                  <option value="LTD">LTD</option>
                  <option value="SARL">SARL</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="pe-juris" className={labelClass}>Jurisdiction <span className="text-slate-600">(optional)</span></label>
                <input id="pe-juris" type="text" value={state.jurisdiction} onChange={e => update({ jurisdiction: e.target.value })} placeholder="Delaware, USA" className={inputClass} />
              </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <NextButton pending={isPending} />
          </form>
        </div>
      )}

      {/* STEP 2 (PE Fund): Fund info */}
      {step === 2 && !isSearchFund && (
        <div>
          <BackButton onClick={goBack} />
          <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
            Set up your first fund
          </h1>
          <p className="text-[14px] text-slate-400 mb-8">
            Configure the details of your fund.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); goNext() }} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="pf-name" className={labelClass}>Fund name</label>
              <input id="pf-name" type="text" value={state.fundName} onChange={e => update({ fundName: e.target.value })} placeholder="Andes Capital Fund I" required className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pf-slug" className={labelClass}>Fund URL</label>
              <input id="pf-slug" type="text" value={state.fundSlug} onChange={e => update({ fundSlug: e.target.value, fundSlugEdited: true })} placeholder="andes-fund-i" required className={inputClass} />
              <SlugPreview slug={state.fundSlug} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pf-type" className={labelClass}>Fund type</label>
              <select id="pf-type" value={state.fundType} onChange={e => update({ fundType: e.target.value })} required className={selectClass}>
                <option value="">Select fund type...</option>
                <option value="TRADITIONAL_SEARCH_FUND">Traditional Search Fund</option>
                <option value="SELF_FUNDED_SEARCH">Self-Funded Search</option>
                <option value="ACCELERATOR_FUND">Accelerator Fund</option>
                <option value="ACQUISITION_FUND">Acquisition Fund</option>
                <option value="PE_FUND">PE Fund</option>
                <option value="HOLDING_COMPANY">Holding Company</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <label htmlFor="pf-target" className={labelClass}>Target fund size</label>
                <input id="pf-target" type="text" value={state.targetSize} onChange={e => update({ targetSize: e.target.value })} placeholder="25,000,000" required className={inputClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor="pf-currency" className={labelClass}>Currency</label>
                <select id="pf-currency" value={state.currency} onChange={e => update({ currency: e.target.value })} className={selectClass}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="pf-vintage" className={labelClass}>Vintage year <span className="text-slate-600">(optional)</span></label>
                <input id="pf-vintage" type="number" value={state.vintage} onChange={e => update({ vintage: e.target.value })} placeholder="2026" min="2000" max="2100" className={inputClass} />
              </div>
              <div />
            </div>
            <div className="space-y-2">
              <label htmlFor="pf-strategy" className={labelClass}>Investment thesis <span className="text-slate-600">(optional)</span></label>
              <textarea id="pf-strategy" value={state.strategy} onChange={e => update({ strategy: e.target.value })} placeholder="Brief description of your strategy..." maxLength={500} rows={3} className={`${inputClass} resize-none`} />
            </div>

            {error && <ErrorMessage message={error} />}

            <NextButton pending={isPending} />
          </form>
        </div>
      )}

      {/* STEP 3 (PE Fund): Account */}
      {step === 3 && !isSearchFund && (
        <div>
          <BackButton onClick={goBack} />
          <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
            Create your account
          </h1>
          <p className="text-[14px] text-slate-400 mb-8">
            You&apos;ll be the administrator of your firm on BlackGem.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); goNext() }} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="pa-name" className={labelClass}>Full name</label>
              <input id="pa-name" type="text" value={state.userName} onChange={e => update({ userName: e.target.value })} placeholder="Maria Rodriguez" required className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pa-email" className={labelClass}>Email address</label>
              <input id="pa-email" type="email" value={state.userEmail} onChange={e => update({ userEmail: e.target.value })} placeholder="maria@andes.com" required className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pa-pw" className={labelClass}>Password</label>
              <input id="pa-pw" type="password" value={state.password} onChange={e => update({ password: e.target.value })} placeholder="Min. 8 characters" required className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="pa-cpw" className={labelClass}>Confirm password</label>
              <input id="pa-cpw" type="password" value={state.confirmPassword} onChange={e => update({ confirmPassword: e.target.value })} placeholder="Repeat your password" required className={inputClass} />
            </div>

            {error && <ErrorMessage message={error} />}

            <SubmitButton pending={isPending} label="Create account" pendingLabel="Creating account..." />
          </form>
        </div>
      )}

      {/* Bottom link */}
      {step < totalSteps - 1 && (
        <p className="mt-8 text-center text-[13px] text-slate-600">
          Already have an account?{' '}
          <a href="/login" className="text-slate-400 hover:text-[#3E5CFF] transition-colors">
            Sign in
          </a>
        </p>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function VehicleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-5 transition-all ${
        selected
          ? 'border-[#3E5CFF] bg-[#3E5CFF]/5'
          : 'border-[#334155] bg-[#1E2432] hover:border-slate-500'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 ${selected ? 'text-[#3E5CFF]' : 'text-slate-400'}`}>
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-medium text-[#F8FAFC]">{title}</p>
          <p className="text-[13px] text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors mb-6 text-[13px]"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back
    </button>
  )
}

function NextButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3E5CFF] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Continue
      <ArrowRight className="h-4 w-4" />
    </button>
  )
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3E5CFF] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-400" aria-live="polite">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
