'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { createDealTask } from '@/lib/actions/tasks';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITIES = [
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
];

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

interface AddTaskButtonProps {
    dealId: string;
    members: { id: string; name: string | null }[];
}

export function AddTaskButton({ dealId, members }: AddTaskButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [priority, setPriority] = useState('MEDIUM');
    const [assigneeId, setAssigneeId] = useState('');

    const resetForm = () => {
        setPriority('MEDIUM');
        setAssigneeId('');
        setError(null);
    };

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('priority', priority);
        formData.set('assigneeId', assigneeId);
        startTransition(async () => {
            const result = await createDealTask(dealId, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setOpen(false);
                resetForm();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-[#334155] text-[#F8FAFC] hover:bg-[#334155]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Add Task</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className={dark.label}>Title *</Label>
                        <Input
                            name="title"
                            placeholder="Task title"
                            className={dark.input}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Description</Label>
                        <Textarea
                            name="description"
                            placeholder="Additional details..."
                            className={`resize-none ${dark.input}`}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Priority *</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue placeholder="Select priority..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((p) => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Assignee *</Label>
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue placeholder="Select assignee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name || 'Unnamed User'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Due Date</Label>
                        <Input
                            name="dueDate"
                            type="date"
                            className={dark.input}
                        />
                    </div>

                    {error && (
                        <div className={`rounded-md p-3 text-sm ${dark.error}`}>
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
                            disabled={!assigneeId || isPending}
                            className={dark.saveBtn}
                        >
                            {isPending ? 'Creating...' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
