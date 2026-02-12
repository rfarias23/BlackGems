'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Circle,
    CircleDot,
    CheckCircle2,
    XCircle,
    Trash2,
    AlertTriangle,
    ListTodo,
    Calendar,
} from 'lucide-react';
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks';
import type { TaskItem } from '@/lib/actions/tasks';

// ============================================================================
// CONSTANTS
// ============================================================================

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    deleteBtn: 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90',
} as const;

const PRIORITY_ORDER: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
    URGENT: { label: 'Urgent', className: 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/30' },
    HIGH: { label: 'High', className: 'bg-[#F97316]/20 text-[#F97316] border-[#F97316]/30' },
    MEDIUM: { label: 'Medium', className: 'border-[#334155] text-[#94A3B8]' },
    LOW: { label: 'Low', className: 'bg-[#334155]/50 text-[#64748B] border-[#334155]/50' },
};

const STATUS_CYCLE: Record<string, string> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
    COMPLETED: 'TODO',
    BLOCKED: 'TODO',
    CANCELLED: 'TODO',
};

// ============================================================================
// STATUS ICON
// ============================================================================

function StatusIcon({ status, className }: { status: string; className?: string }) {
    switch (status) {
        case 'TODO':
            return <Circle className={`h-5 w-5 text-[#94A3B8] ${className || ''}`} />;
        case 'IN_PROGRESS':
            return <CircleDot className={`h-5 w-5 text-[#3E5CFF] ${className || ''}`} />;
        case 'COMPLETED':
            return <CheckCircle2 className={`h-5 w-5 text-[#059669] ${className || ''}`} />;
        case 'BLOCKED':
            return <XCircle className={`h-5 w-5 text-[#DC2626] ${className || ''}`} />;
        case 'CANCELLED':
            return <XCircle className={`h-5 w-5 text-[#64748B] ${className || ''}`} />;
        default:
            return <Circle className={`h-5 w-5 text-[#94A3B8] ${className || ''}`} />;
    }
}

// ============================================================================
// DUE DATE DISPLAY
// ============================================================================

function DueDateDisplay({ dueDate, isCompleted }: { dueDate: Date | null; isCompleted: boolean }) {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now && !isCompleted;

    const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums ${isOverdue ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
            <Calendar className="h-3 w-3" />
            {formatted}
            {isOverdue && <span className="font-sans font-medium">Overdue</span>}
        </span>
    );
}

// ============================================================================
// PRIORITY BADGE
// ============================================================================

function PriorityBadge({ priority }: { priority: string }) {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
    return (
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.className}`}>
            {config.label}
        </Badge>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DealTasksProps {
    tasks: TaskItem[];
    canManage: boolean;
}

export function DealTasks({ tasks, canManage }: DealTasksProps) {
    const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);
    const [isPending, startTransition] = useTransition();
    const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

    // Sort: incomplete first (by priority), then completed at bottom
    const sortedTasks = [...tasks].sort((a, b) => {
        const aCompleted = a.status === 'COMPLETED' || a.status === 'CANCELLED';
        const bCompleted = b.status === 'COMPLETED' || b.status === 'CANCELLED';

        if (aCompleted !== bCompleted) {
            return aCompleted ? 1 : -1;
        }

        // Within same completion group, sort by priority
        const aPriority = PRIORITY_ORDER[a.priority] ?? 2;
        const bPriority = PRIORITY_ORDER[b.priority] ?? 2;
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        // Same priority: sort by creation date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const handleStatusToggle = (taskId: string, currentStatus: string) => {
        const nextStatus = STATUS_CYCLE[currentStatus] || 'TODO';
        setPendingStatusId(taskId);
        startTransition(async () => {
            await updateTaskStatus(taskId, nextStatus);
            setPendingStatusId(null);
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        startTransition(async () => {
            const result = await deleteTask(deleteTarget.id);
            if (result.success) {
                setDeleteTarget(null);
            }
        });
    };

    // Empty state
    if (tasks.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No tasks yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create tasks to track action items for this deal.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const completedCount = tasks.filter(
        (t) => t.status === 'COMPLETED' || t.status === 'CANCELLED'
    ).length;

    return (
        <>
            {/* Summary */}
            <div className="text-sm text-[#94A3B8] mb-3">
                {completedCount} of {tasks.length} completed
            </div>

            {/* Task list */}
            <div className="rounded-md border border-[#334155] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#334155]">
                            <th className="w-10 px-3 py-2" />
                            <th className="text-left px-3 py-2 text-[10px] font-medium tracking-wider uppercase text-[#94A3B8]">
                                Task
                            </th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium tracking-wider uppercase text-[#94A3B8] hidden md:table-cell">
                                Priority
                            </th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium tracking-wider uppercase text-[#94A3B8] hidden md:table-cell">
                                Assignee
                            </th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium tracking-wider uppercase text-[#94A3B8] hidden lg:table-cell">
                                Due
                            </th>
                            {canManage && (
                                <th className="w-10 px-3 py-2" />
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map((task) => {
                            const isCompleted = task.status === 'COMPLETED' || task.status === 'CANCELLED';
                            const isUpdating = pendingStatusId === task.id;

                            return (
                                <tr
                                    key={task.id}
                                    className={`border-b border-[#334155] last:border-b-0 transition-colors hover:bg-[#1E293B]/50 ${isCompleted ? 'opacity-50' : ''}`}
                                >
                                    {/* Status toggle */}
                                    <td className="px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={() => handleStatusToggle(task.id, task.status)}
                                            disabled={isUpdating || !canManage}
                                            className={`flex items-center justify-center transition-opacity ${isUpdating ? 'opacity-50' : 'hover:opacity-80'} ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                                            title={`Status: ${task.status.replace('_', ' ')}`}
                                        >
                                            <StatusIcon status={task.status} />
                                        </button>
                                    </td>

                                    {/* Title & description */}
                                    <td className="px-3 py-3">
                                        <div className={`text-sm font-medium ${isCompleted ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                                            {task.title}
                                        </div>
                                        {task.description && (
                                            <div className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                                                {task.description}
                                            </div>
                                        )}
                                        {/* Mobile-only: priority + assignee + due date */}
                                        <div className="flex items-center gap-2 mt-1 md:hidden">
                                            <PriorityBadge priority={task.priority} />
                                            <span className="text-xs text-[#94A3B8]">
                                                {task.assignee.name || task.assignee.email || 'Unassigned'}
                                            </span>
                                            <DueDateDisplay dueDate={task.dueDate} isCompleted={isCompleted} />
                                        </div>
                                    </td>

                                    {/* Priority */}
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        <PriorityBadge priority={task.priority} />
                                    </td>

                                    {/* Assignee */}
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        <span className="text-sm text-[#94A3B8]">
                                            {task.assignee.name || task.assignee.email || 'Unassigned'}
                                        </span>
                                    </td>

                                    {/* Due date */}
                                    <td className="px-3 py-3 hidden lg:table-cell">
                                        <DueDateDisplay dueDate={task.dueDate} isCompleted={isCompleted} />
                                    </td>

                                    {/* Actions */}
                                    {canManage && (
                                        <td className="px-3 py-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-[#64748B] hover:text-[#DC2626]"
                                                onClick={() => setDeleteTarget(task)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
                <DialogContent className={`sm:max-w-[400px] ${dark.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
                            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                            Delete Task
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#94A3B8]">
                        Are you sure you want to delete{' '}
                        <strong className="text-[#F8FAFC]">{deleteTarget?.title}</strong>?
                        This action cannot be undone.
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
        </>
    );
}
