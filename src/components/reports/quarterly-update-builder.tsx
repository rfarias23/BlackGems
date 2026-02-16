'use client'

import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, FileText, Plus, CheckCircle2, Download } from 'lucide-react'
import {
  generateQuarterlyUpdate,
  getQuarterlyUpdateDraft,
  approveAndPublish,
  listReports,
} from '@/lib/actions/quarterly-updates'
import type { QuarterlyReport, ReportListItem } from '@/lib/actions/quarterly-updates'
import { SectionEditor } from '@/components/reports/section-editor'
import { generateQuarterlyUpdatePDF } from '@/lib/pdf/quarterly-update'
import type { QuarterlyUpdatePDFData } from '@/lib/pdf/quarterly-update'

interface QuarterlyUpdateBuilderProps {
  fundId: string
  fundName?: string
  initialReports: ReportListItem[]
}

type View = 'list' | 'editor'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const quarters = [1, 2, 3, 4] as const

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  REVIEW: 'outline',
  PUBLISHED: 'default',
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function formatPeriod(start: Date | null, end: Date | null): string {
  if (!start || !end) return '-'
  const s = new Date(start)
  const e = new Date(end)
  const startStr = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(s)
  const endStr = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(e)
  return `${startStr} - ${endStr}`
}

export function QuarterlyUpdateBuilder({ fundId, fundName, initialReports }: QuarterlyUpdateBuilderProps) {
  const [view, setView] = useState<View>('list')
  const [reports, setReports] = useState<ReportListItem[]>(initialReports)
  const [draft, setDraft] = useState<QuarterlyReport | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [selectedQuarter, setSelectedQuarter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshReports = useCallback(() => {
    startTransition(async () => {
      const updated = await listReports()
      setReports(updated)
    })
  }, [])

  const handleGenerate = () => {
    if (!selectedQuarter) return
    setError(null)

    startTransition(async () => {
      const result = await generateQuarterlyUpdate(
        fundId,
        Number(selectedYear),
        Number(selectedQuarter)
      )
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.reportId) {
        const report = await getQuarterlyUpdateDraft(result.reportId)
        if (report) {
          setDraft(report)
          setView('editor')
        }
        const updated = await listReports()
        setReports(updated)
      }
    })
  }

  const handleOpenDraft = (reportId: string) => {
    setError(null)
    startTransition(async () => {
      const report = await getQuarterlyUpdateDraft(reportId)
      if (report) {
        setDraft(report)
        setView('editor')
      }
    })
  }

  const handleApproveAndPublish = () => {
    if (!draft) return
    setError(null)

    startTransition(async () => {
      const result = await approveAndPublish(draft.id)
      if (result.error) {
        setError(result.error)
        return
      }
      // Refresh draft and list
      const updatedDraft = await getQuarterlyUpdateDraft(draft.id)
      if (updatedDraft) setDraft(updatedDraft)
      const updated = await listReports()
      setReports(updated)
    })
  }

  const handleSectionSaved = () => {
    if (!draft) return
    startTransition(async () => {
      const updatedDraft = await getQuarterlyUpdateDraft(draft.id)
      if (updatedDraft) setDraft(updatedDraft)
    })
  }

  const handleBackToList = () => {
    setDraft(null)
    setView('list')
    setError(null)
    refreshReports()
  }

  const handlePreviewPDF = () => {
    if (!draft) return

    const pdfData: QuarterlyUpdatePDFData = {
      fundName: fundName || 'Fund',
      year: draft.year,
      quarter: draft.quarter,
      periodStart: draft.periodStart,
      periodEnd: draft.periodEnd,
      sections: draft.sections.map((s) => ({
        key: s.key,
        title: s.title,
        content: s.content,
      })),
    }

    generateQuarterlyUpdatePDF(pdfData)
  }

  // ---- EDITOR VIEW ----
  if (view === 'editor' && draft) {
    const canPublish = draft.status === 'DRAFT' || draft.status === 'REVIEW'

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Back
            </Button>
            <div>
              <h3 className="text-lg font-semibold">{draft.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatPeriod(draft.periodStart, draft.periodEnd)}
              </p>
            </div>
          </div>
          <Badge variant={statusVariant[draft.status] || 'outline'}>
            {draft.status}
          </Badge>
        </div>

        {error && (
          <div className="rounded-md border border-red-400/20 bg-red-400/5 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {draft.sections.map((section) => (
            <SectionEditor
              key={section.key}
              section={section}
              reportId={draft.id}
              onSaved={handleSectionSaved}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handlePreviewPDF}
            disabled={isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Preview PDF
          </Button>
          {canPublish && (
            <Button
              onClick={handleApproveAndPublish}
              disabled={isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isPending ? 'Publishing...' : 'Approve & Publish'}
            </Button>
          )}
        </div>

        {draft.status === 'PUBLISHED' && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-sm text-emerald-400">
              This report has been published.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ---- LIST VIEW ----
  const quarterlyReports = reports.filter(r => r.type === 'QUARTERLY_UPDATE')

  return (
    <div className="space-y-6">
      {/* Create New */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Quarterly Update</CardTitle>
          <CardDescription>
            Generate a quarterly update draft with auto-populated fund data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q} value={String(q)}>
                      Q{q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedQuarter || isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isPending ? 'Generating...' : 'Generate Draft'}
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Existing Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quarterly Updates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quarterlyReports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">Title</TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">Period</TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">Created</TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">Published</TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarterlyReports.map((report) => (
                  <TableRow key={report.id} className="border-border">
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[report.status] || 'outline'}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPeriod(report.periodStart, report.periodEnd)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(report.publishedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDraft(report.id)}
                        disabled={isPending}
                      >
                        {report.status === 'PUBLISHED' ? 'View' : 'Edit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No quarterly updates yet. Generate your first draft above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
