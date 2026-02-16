'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Compass, Plus, X } from 'lucide-react'
import { updateDealSource, createDealSource, getDealSources } from '@/lib/actions/deals'

const SOURCE_TYPE_DISPLAY: Record<string, string> = {
    BROKER: 'Broker',
    INVESTMENT_BANK: 'Investment Bank',
    DIRECT_OUTREACH: 'Direct Outreach',
    REFERRAL_NETWORK: 'Referral Network',
    REFERRAL_INVESTOR: 'Referral (Investor)',
    ONLINE_MARKETPLACE: 'Online Marketplace',
    CONFERENCE: 'Conference',
    ADVISOR: 'Advisor',
    INBOUND: 'Inbound',
    OTHER: 'Other',
}

const SOURCE_TYPES = Object.keys(SOURCE_TYPE_DISPLAY)

interface DealSourceSelectProps {
    dealId: string
    currentSourceId: string | null
    currentSourceName: string | null
    currentSourceType: string | null
    sourceContact: string | null
    sourceNotes: string | null
    sources: { id: string; name: string; type: string }[]
    canEdit: boolean
}

export function DealSourceSelect({
    dealId,
    currentSourceId,
    currentSourceName,
    currentSourceType,
    sourceContact,
    sourceNotes,
    sources: initialSources,
    canEdit,
}: DealSourceSelectProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const [sources, setSources] = useState(initialSources)

    // Editing state
    const [isChanging, setIsChanging] = useState(false)
    const [selectedSourceId, setSelectedSourceId] = useState(currentSourceId || '')
    const [editContact, setEditContact] = useState(sourceContact || '')
    const [editNotes, setEditNotes] = useState(sourceNotes || '')

    // New source inline form
    const [showNewForm, setShowNewForm] = useState(false)
    const [newSourceName, setNewSourceName] = useState('')
    const [newSourceType, setNewSourceType] = useState('')

    const hasSource = currentSourceId !== null

    function handleSave() {
        if (!selectedSourceId) return
        setError(null)
        setSaved(false)

        startTransition(async () => {
            const result = await updateDealSource(dealId, {
                sourceId: selectedSourceId,
                sourceContact: editContact || undefined,
                sourceNotes: editNotes || undefined,
            })
            if (result.error) {
                setError(result.error)
            } else {
                setIsChanging(false)
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        })
    }

    function handleCreateSource() {
        if (!newSourceName.trim() || !newSourceType) return
        setError(null)

        startTransition(async () => {
            const result = await createDealSource({
                name: newSourceName.trim(),
                type: newSourceType,
            })
            if (result.error) {
                setError(result.error)
            } else if (result.sourceId) {
                // Refresh sources list and select the new one
                const updated = await getDealSources()
                setSources(updated)
                setSelectedSourceId(result.sourceId)
                setShowNewForm(false)
                setNewSourceName('')
                setNewSourceType('')
            }
        })
    }

    function handleStartChange() {
        setIsChanging(true)
        setSelectedSourceId(currentSourceId || '')
        setEditContact(sourceContact || '')
        setEditNotes(sourceNotes || '')
        setError(null)
        setSaved(false)
    }

    function handleCancel() {
        setIsChanging(false)
        setShowNewForm(false)
        setSelectedSourceId(currentSourceId || '')
        setEditContact(sourceContact || '')
        setEditNotes(sourceNotes || '')
        setError(null)
    }

    // Read-only display of current source
    if (hasSource && !isChanging) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                            <Compass className="h-4 w-4 text-muted-foreground" />
                            Deal Source
                        </span>
                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleStartChange}
                                className="text-xs"
                            >
                                Change Source
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Source</span>
                        <span className="text-sm font-medium">{currentSourceName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <span className="inline-flex items-center rounded-md border border-[#334155] px-2 py-0.5 text-xs font-medium text-[#94A3B8]">
                            {currentSourceType ? SOURCE_TYPE_DISPLAY[currentSourceType] || currentSourceType : '-'}
                        </span>
                    </div>
                    {sourceContact && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Contact</span>
                            <span className="text-sm font-medium">{sourceContact}</span>
                        </div>
                    )}
                    {sourceNotes && (
                        <div className="pt-1">
                            <span className="text-sm text-muted-foreground">Notes</span>
                            <p className="text-sm mt-1 text-foreground">{sourceNotes}</p>
                        </div>
                    )}
                    {saved && (
                        <p className="text-xs text-emerald-500">Source updated</p>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Editable form (no source set, or changing)
    if (!canEdit) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Compass className="h-4 w-4 text-muted-foreground" />
                        Deal Source
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No source assigned</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-muted-foreground" />
                        Deal Source
                    </span>
                    {isChanging && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Source selector */}
                <div className="space-y-1.5">
                    <label className="text-xs text-[#94A3B8]">Source</label>
                    <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                        <SelectTrigger className="bg-[#11141D] border-[#334155] text-[#F8FAFC]">
                            <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-[#334155]">
                            {sources.map((source) => (
                                <SelectItem
                                    key={source.id}
                                    value={source.id}
                                    className="text-[#F8FAFC] focus:bg-[#334155] focus:text-[#F8FAFC]"
                                >
                                    <span className="flex items-center gap-2">
                                        {source.name}
                                        <span className="text-xs text-[#94A3B8]">
                                            {SOURCE_TYPE_DISPLAY[source.type] || source.type}
                                        </span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Contact and Notes */}
                <div className="space-y-1.5">
                    <label className="text-xs text-[#94A3B8]">Source Contact</label>
                    <Input
                        value={editContact}
                        onChange={(e) => setEditContact(e.target.value)}
                        placeholder="Contact person at source"
                        className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-[#94A3B8]">Source Notes</label>
                    <Input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Additional notes about this source"
                        className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                    />
                </div>

                {/* Save and Add New Source buttons */}
                <div className="flex items-center justify-between pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                    >
                        {showNewForm ? (
                            <>
                                <X className="mr-1 h-3 w-3" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="mr-1 h-3 w-3" />
                                Add New Source
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending || !selectedSourceId}
                    >
                        {isPending ? 'Saving...' : 'Save Source'}
                    </Button>
                </div>

                {/* Inline form for creating a new source */}
                {showNewForm && (
                    <div className="border-t border-[#334155] pt-4 space-y-3">
                        <p className="text-xs font-medium text-[#94A3B8]">Create New Source</p>
                        <div className="space-y-1.5">
                            <label className="text-xs text-[#94A3B8]">Name</label>
                            <Input
                                value={newSourceName}
                                onChange={(e) => setNewSourceName(e.target.value)}
                                placeholder="Source name"
                                className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-[#94A3B8]">Type</label>
                            <Select value={newSourceType} onValueChange={setNewSourceType}>
                                <SelectTrigger className="bg-[#11141D] border-[#334155] text-[#F8FAFC]">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E293B] border-[#334155]">
                                    {SOURCE_TYPES.map((type) => (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                            className="text-[#F8FAFC] focus:bg-[#334155] focus:text-[#F8FAFC]"
                                        >
                                            {SOURCE_TYPE_DISPLAY[type]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={handleCreateSource}
                                disabled={isPending || !newSourceName.trim() || !newSourceType}
                            >
                                {isPending ? 'Creating...' : 'Create Source'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {error && <p className="text-xs text-red-400">{error}</p>}
                {saved && <p className="text-xs text-emerald-500">Source updated</p>}
            </CardContent>
        </Card>
    )
}
