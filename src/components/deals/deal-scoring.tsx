'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Target } from 'lucide-react'
import { updateDealScores } from '@/lib/actions/deals'
import {
  computeCompositeScore,
  getScoreColor,
  validateDealScores,
} from '@/lib/shared/deal-scoring-utils'

interface DealScoringProps {
  dealId: string
  initialScores: {
    attractivenessScore: number | null
    fitScore: number | null
    riskScore: number | null
  }
  canEdit: boolean
}

interface ScoreRowProps {
  label: string
  description: string
  value: number | null
  onChange: (value: number) => void
  canEdit: boolean
}

function ScoreRow({ label, description, value, onChange, canEdit }: ScoreRowProps) {
  const displayValue = value ?? '-'
  const colorClass = value !== null ? getScoreColor(value) : 'text-muted-foreground'

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onChange(Math.max(1, (value ?? 5) - 1))}
            disabled={value !== null && value <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
        )}
        <span className={`font-mono tabular-nums text-lg font-bold w-8 text-center ${colorClass}`}>
          {displayValue}
        </span>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onChange(Math.min(10, (value ?? 5) + 1))}
            disabled={value !== null && value >= 10}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function DealScoring({ dealId, initialScores, canEdit }: DealScoringProps) {
  const [attractiveness, setAttractiveness] = useState(initialScores.attractivenessScore)
  const [fit, setFit] = useState(initialScores.fitScore)
  const [risk, setRisk] = useState(initialScores.riskScore)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const composite = computeCompositeScore(attractiveness, fit, risk)
  const compositeColor = composite !== null ? getScoreColor(Math.round(composite)) : 'text-muted-foreground'

  const hasChanges =
    attractiveness !== initialScores.attractivenessScore ||
    fit !== initialScores.fitScore ||
    risk !== initialScores.riskScore

  const allScored = attractiveness !== null && fit !== null && risk !== null

  function handleSave() {
    if (!allScored) return

    const validationError = validateDealScores({
      attractivenessScore: attractiveness,
      fitScore: fit,
      riskScore: risk,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateDealScores(dealId, {
        attractivenessScore: attractiveness,
        fitScore: fit,
        riskScore: risk,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-muted-foreground" />
          Deal Scoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <ScoreRow
          label="Attractiveness"
          description="Market opportunity and financial profile"
          value={attractiveness}
          onChange={setAttractiveness}
          canEdit={canEdit}
        />
        <div className="border-t border-border" />
        <ScoreRow
          label="Fit"
          description="Strategic alignment with fund thesis"
          value={fit}
          onChange={setFit}
          canEdit={canEdit}
        />
        <div className="border-t border-border" />
        <ScoreRow
          label="Risk"
          description="Execution and downside assessment"
          value={risk}
          onChange={setRisk}
          canEdit={canEdit}
        />

        {/* Composite score */}
        <div className="border-t border-border pt-3 mt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Composite Score</p>
              <p className="text-xs text-muted-foreground">Weighted: 40% / 35% / 25%</p>
            </div>
            <span className={`font-mono tabular-nums text-xl font-bold ${compositeColor}`}>
              {composite !== null ? composite.toFixed(1) : '-'}
            </span>
          </div>
        </div>

        {/* Save button and feedback */}
        {canEdit && (
          <div className="pt-3 flex items-center justify-between">
            <div className="text-xs">
              {error && <span className="text-red-400">{error}</span>}
              {saved && <span className="text-emerald-500">Scores saved</span>}
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !hasChanges || !allScored}
            >
              {isPending ? 'Saving...' : 'Save Scores'}
            </Button>
          </div>
        )}

        {/* Unscored hint */}
        {!allScored && canEdit && (
          <p className="text-xs text-muted-foreground pt-1">
            Use +/- to set each score between 1 and 10
          </p>
        )}
      </CardContent>
    </Card>
  )
}
