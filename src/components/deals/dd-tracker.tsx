'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    ClipboardCheck,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Flag,
    Trash2,
    Pencil,
    Save,
    X,
} from 'lucide-react';
import { updateDDItem, deleteDDItem } from '@/lib/actions/due-diligence';
import type { DDItemData, DDStats } from '@/lib/actions/due-diligence';

// ============================================================================
// CONSTANTS
// ============================================================================

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    deleteBtn: 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90',
} as const;

const CATEGORY_LABELS: Record<string, string> = {
    FINANCIAL: 'Financial',
    ACCOUNTING: 'Accounting',
    TAX: 'Tax',
    LEGAL: 'Legal',
    COMMERCIAL: 'Commercial',
    OPERATIONAL: 'Operational',
    HR: 'Human Resources',
    IT: 'Information Technology',
    ENVIRONMENTAL: 'Environmental',
    INSURANCE: 'Insurance',
    REAL_ESTATE: 'Real Estate',
    IP: 'Intellectual Property',
    REGULATORY: 'Regulatory',
    QUALITY: 'Quality',
    OTHER: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    PENDING_INFO: 'Pending Info',
    UNDER_REVIEW: 'Under Review',
    COMPLETED: 'Completed',
    NA: 'N/A',
};

const STATUS_COLORS: Record<string, string> = {
    NOT_STARTED: 'bg-slate-500/20 text-slate-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    PENDING_INFO: 'bg-amber-500/20 text-amber-400',
    UNDER_REVIEW: 'bg-purple-500/20 text-purple-400',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400',
    NA: 'bg-slate-500/20 text-slate-500',
};

const PRIORITY_COLORS: Record<number, string> = {
    1: 'bg-red-500/20 text-red-400',
    2: 'bg-amber-500/20 text-amber-400',
    3: 'bg-blue-500/20 text-blue-400',
    4: 'bg-slate-500/20 text-slate-400',
    5: 'bg-slate-500/20 text-slate-500',
};

const PRIORITY_LABELS: Record<number, string> = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Optional',
};

const DD_STATUSES = [
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'PENDING_INFO', label: 'Pending Info' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'NA', label: 'N/A' },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface DDTrackerProps {
    items: DDItemData[];
    stats: DDStats;
    dealId: string;
    canManage: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DDTracker({ items, stats, dealId, canManage }: DDTrackerProps) {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [redFlagsOnly, setRedFlagsOnly] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editFindings, setEditFindings] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<DDItemData | null>(null);
    const [isPending, startTransition] = useTransition();

    // Filter items
    const filteredItems = items.filter((item) => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
        if (redFlagsOnly && !item.redFlag) return false;
        return true;
    });

    // Group filtered items by category
    const groupedItems = new Map<string, DDItemData[]>();
    for (const item of filteredItems) {
        if (!groupedItems.has(item.category)) {
            groupedItems.set(item.category, []);
        }
        groupedItems.get(item.category)!.push(item);
    }

    // Sort categories
    const sortedCategories = Array.from(groupedItems.keys()).sort();

    const toggleCategory = (cat: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) {
                next.delete(cat);
            } else {
                next.add(cat);
            }
            return next;
        });
    };

    const handleStatusChange = (itemId: string, newStatus: string) => {
        const formData = new FormData();
        formData.set('status', newStatus);
        startTransition(async () => {
            await updateDDItem(itemId, formData);
        });
    };

    const handleRedFlagToggle = (item: DDItemData) => {
        const formData = new FormData();
        formData.set('redFlag', String(!item.redFlag));
        startTransition(async () => {
            await updateDDItem(item.id, formData);
        });
    };

    const handleEditSave = (itemId: string) => {
        const formData = new FormData();
        formData.set('notes', editNotes);
        formData.set('findings', editFindings);
        startTransition(async () => {
            await updateDDItem(itemId, formData);
            setEditingItem(null);
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        startTransition(async () => {
            const result = await deleteDDItem(deleteTarget.id);
            if (result.success) {
                setDeleteTarget(null);
            }
        });
    };

    const startEditing = (item: DDItemData) => {
        setEditingItem(item.id);
        setEditNotes(item.notes || '');
        setEditFindings(item.findings || '');
    };

    // Empty state
    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No due diligence items yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add items to track your due diligence process.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Overall Progress */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                                {stats.completedItems}/{stats.totalItems} complete
                            </span>
                            <span className="text-sm text-muted-foreground">
                                ({stats.overallProgress}%)
                            </span>
                        </div>
                        {stats.redFlagCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#DC2626]/15 text-[#DC2626] px-2 py-0.5 rounded-full">
                                <Flag className="h-3 w-3" />
                                {stats.redFlagCount} red flag{stats.redFlagCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="w-full bg-[#334155] rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${stats.overallProgress === 100 ? 'bg-emerald-500' : 'bg-[#3E5CFF]'}`}
                            style={{ width: `${stats.overallProgress}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        {DD_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={redFlagsOnly ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 text-xs ${redFlagsOnly ? 'bg-[#DC2626] hover:bg-[#DC2626]/90 text-white' : ''}`}
                    onClick={() => setRedFlagsOnly(!redFlagsOnly)}
                >
                    <Flag className="h-3 w-3 mr-1" />
                    Red Flags
                </Button>

                <span className="text-xs text-muted-foreground ml-auto">
                    {filteredItems.length} of {items.length} items
                </span>
            </div>

            {/* Category Groups */}
            {filteredItems.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">No items match the current filters.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {sortedCategories.map((cat) => {
                        const catItems = groupedItems.get(cat)!;
                        const isExpanded = expandedCategories.has(cat);
                        const catCompleted = catItems.filter((i) => i.status === 'COMPLETED' || i.status === 'NA').length;
                        const catRedFlags = catItems.filter((i) => i.redFlag).length;

                        return (
                            <Card key={cat}>
                                {/* Category Header */}
                                <button
                                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
                                    onClick={() => toggleCategory(cat)}
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    )}

                                    <span className="font-medium text-sm flex-1">
                                        {CATEGORY_LABELS[cat] || cat}
                                    </span>

                                    <span className="text-xs text-muted-foreground">
                                        {catCompleted}/{catItems.length}
                                    </span>

                                    {/* Mini progress bar */}
                                    <div className="w-20 bg-[#334155] rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${catCompleted === catItems.length ? 'bg-emerald-500' : 'bg-[#3E5CFF]'}`}
                                            style={{ width: `${catItems.length > 0 ? (catCompleted / catItems.length) * 100 : 0}%` }}
                                        />
                                    </div>

                                    {catRedFlags > 0 && (
                                        <Flag className="h-3.5 w-3.5 text-[#DC2626] flex-shrink-0" />
                                    )}
                                </button>

                                {/* Category Items */}
                                {isExpanded && (
                                    <div className="border-t border-border">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs w-20">Priority</th>
                                                        <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">Item</th>
                                                        <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs w-32">Status</th>
                                                        <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs w-24">Assigned</th>
                                                        <th className="text-center py-2 px-4 font-medium text-muted-foreground text-xs w-16">Flag</th>
                                                        {canManage && (
                                                            <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs w-20">Actions</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {catItems.map((item) => (
                                                        <tr key={item.id} className="border-b border-border last:border-0 group">
                                                            <td className="py-2 px-4">
                                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS[3]}`}>
                                                                    {PRIORITY_LABELS[item.priority] || 'Medium'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                <div>
                                                                    <span className="text-foreground">{item.item}</span>
                                                                    {/* Inline edit area */}
                                                                    {editingItem === item.id ? (
                                                                        <div className="mt-2 space-y-2">
                                                                            <div>
                                                                                <Label className="text-xs text-muted-foreground">Notes</Label>
                                                                                <Textarea
                                                                                    value={editNotes}
                                                                                    onChange={(e) => setEditNotes(e.target.value)}
                                                                                    className={`mt-1 resize-none text-xs ${dark.input}`}
                                                                                    rows={2}
                                                                                    placeholder="Internal notes..."
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <Label className="text-xs text-muted-foreground">Findings</Label>
                                                                                <Textarea
                                                                                    value={editFindings}
                                                                                    onChange={(e) => setEditFindings(e.target.value)}
                                                                                    className={`mt-1 resize-none text-xs ${dark.input}`}
                                                                                    rows={2}
                                                                                    placeholder="Key findings..."
                                                                                />
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="h-7 text-xs bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                                                                                    onClick={() => handleEditSave(item.id)}
                                                                                    disabled={isPending}
                                                                                >
                                                                                    <Save className="h-3 w-3 mr-1" />
                                                                                    Save
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-7 text-xs"
                                                                                    onClick={() => setEditingItem(null)}
                                                                                >
                                                                                    <X className="h-3 w-3 mr-1" />
                                                                                    Cancel
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {item.notes && (
                                                                                <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                                                                            )}
                                                                            {item.findings && (
                                                                                <p className="text-xs text-emerald-400 mt-0.5">Finding: {item.findings}</p>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                {canManage ? (
                                                                    <Select
                                                                        value={item.status}
                                                                        onValueChange={(v) => handleStatusChange(item.id, v)}
                                                                        disabled={isPending}
                                                                    >
                                                                        <SelectTrigger className="h-7 w-full text-[10px] border-none bg-transparent p-0">
                                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.NOT_STARTED}`}>
                                                                                {STATUS_LABELS[item.status] || item.status}
                                                                            </span>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {DD_STATUSES.map((s) => (
                                                                                <SelectItem key={s.value} value={s.value}>
                                                                                    {s.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.NOT_STARTED}`}>
                                                                        {STATUS_LABELS[item.status] || item.status}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-4 text-xs text-muted-foreground">
                                                                {item.assignedTo || '—'}
                                                            </td>
                                                            <td className="py-2 px-4 text-center">
                                                                {canManage ? (
                                                                    <button
                                                                        onClick={() => handleRedFlagToggle(item)}
                                                                        disabled={isPending}
                                                                        className={`p-1 rounded transition-colors ${item.redFlag ? 'text-[#DC2626]' : 'text-muted-foreground hover:text-[#DC2626]'}`}
                                                                    >
                                                                        <Flag className="h-3.5 w-3.5" fill={item.redFlag ? 'currentColor' : 'none'} />
                                                                    </button>
                                                                ) : (
                                                                    item.redFlag && <Flag className="h-3.5 w-3.5 text-[#DC2626] mx-auto" fill="currentColor" />
                                                                )}
                                                            </td>
                                                            {canManage && (
                                                                <td className="py-2 px-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => startEditing(item)}
                                                                            className="p-1 rounded text-muted-foreground hover:text-[#3E5CFF] transition-colors"
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setDeleteTarget(item)}
                                                                            className="p-1 rounded text-muted-foreground hover:text-[#DC2626] transition-colors"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
                <DialogContent className={`sm:max-w-[400px] ${dark.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
                            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                            Delete DD Item
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#94A3B8]">
                        Are you sure you want to delete <strong className="text-[#F8FAFC]">{deleteTarget?.item}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isPending}
                            className={dark.cancelBtn}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isPending}
                            className={dark.deleteBtn}
                        >
                            {isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
