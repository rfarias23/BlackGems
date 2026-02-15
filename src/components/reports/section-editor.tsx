'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Pencil, X } from 'lucide-react'
import { updateQuarterlySection } from '@/lib/actions/quarterly-updates'
import type { QuarterlySection } from '@/lib/actions/quarterly-updates'

interface SectionEditorProps {
  section: QuarterlySection
  reportId: string
  onSaved: () => void
}

export function SectionEditor({ section, reportId, onSaved }: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(section.content)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateQuarterlySection(reportId, section.key, content)
      if (result.error) {
        setError(result.error)
        return
      }
      setIsEditing(false)
      onSaved()
    })
  }

  const handleCancel = () => {
    setContent(section.content)
    setIsEditing(false)
    setError(null)
  }

  const previewContent = section.content
    ? section.content.length > 200
      ? section.content.slice(0, 200) + '...'
      : section.content
    : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{section.title}</CardTitle>
          <div className="flex items-center gap-2">
            {section.editable ? (
              <Badge variant="secondary" className="text-xs">Editable</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Auto-generated</Badge>
            )}
            {section.editable && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-y bg-transparent border-[#334155] text-sm"
              placeholder={`Write ${section.title.toLowerCase()} content...`}
              disabled={isPending}
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                {isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {previewContent ? (
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {section.content}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No content yet. {section.editable ? 'Click Edit to add content.' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
