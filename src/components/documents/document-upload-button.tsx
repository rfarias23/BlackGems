'use client';

import { useState, useRef } from 'react';
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
import { Upload, FileUp, X } from 'lucide-react';

const DEAL_CATEGORIES = [
    { value: 'CIM', label: 'CIM' },
    { value: 'NDA', label: 'NDA' },
    { value: 'FINANCIAL_STATEMENTS', label: 'Financial Statements' },
    { value: 'LOI', label: 'LOI' },
    { value: 'TERM_SHEET', label: 'Term Sheet' },
    { value: 'DUE_DILIGENCE', label: 'Due Diligence' },
    { value: 'PURCHASE_AGREEMENT', label: 'Purchase Agreement' },
    { value: 'CLOSING_DOCS', label: 'Closing Docs' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'OTHER', label: 'Other' },
];

const INVESTOR_DOC_CATEGORIES = [
    { value: 'INVESTOR_COMMS', label: 'Investor Comms' },
    { value: 'TAX', label: 'Tax' },
    { value: 'COMPLIANCE', label: 'Compliance' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'NDA', label: 'NDA' },
    { value: 'FINANCIAL_STATEMENTS', label: 'Financial Statements' },
    { value: 'OTHER', label: 'Other' },
];

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
    dropzone: 'border-2 border-dashed border-[#334155] rounded-lg p-8 text-center hover:border-[#3E5CFF] transition-colors cursor-pointer',
    dropzoneActive: 'border-2 border-dashed border-[#3E5CFF] rounded-lg p-8 text-center bg-[#3E5CFF]/10',
} as const;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentUploadButtonProps {
    dealId?: string;
    investorId?: string;
    parentDocumentId?: string;
    buttonLabel?: string;
}

export function DocumentUploadButton({ dealId, investorId, parentDocumentId, buttonLabel }: DocumentUploadButtonProps) {
    const categories = investorId ? INVESTOR_DOC_CATEGORIES : DEAL_CATEGORIES;
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [docName, setDocName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setFile(null);
        setCategory('');
        setDocName('');
        setError(null);
        setDragActive(false);
    };

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File too large. Maximum size is 50MB.');
            return;
        }
        setFile(selectedFile);
        setError(null);
        if (!docName) {
            setDocName(selectedFile.name.replace(/\.[^.]+$/, ''));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !category) {
            setError('Please select a file and category.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (dealId) formData.append('dealId', dealId);
            if (investorId) formData.append('investorId', investorId);
            formData.append('category', category);
            formData.append('name', docName || file.name);
            if (parentDocumentId) formData.append('parentDocumentId', parentDocumentId);

            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Upload failed');
                return;
            }

            setOpen(false);
            resetForm();
            // Force page refresh to show new document
            window.location.reload();
        } catch {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    {buttonLabel || 'Upload File'}
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Upload Document</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Drop zone */}
                    {!file ? (
                        <div
                            className={dragActive ? dark.dropzoneActive : dark.dropzone}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <FileUp className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]" />
                            <p className="text-sm text-[#94A3B8]">
                                Drag & drop a file here, or click to browse
                            </p>
                            <p className="text-xs text-[#64748B] mt-1">
                                PDF, DOC, XLS, PPT, CSV, TXT, images up to 50MB
                            </p>
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#11141D] border border-[#334155]">
                            <FileUp className="h-8 w-8 text-[#3E5CFF] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#F8FAFC] truncate">{file.name}</p>
                                <p className="text-xs text-[#94A3B8]">{formatFileSize(file.size)}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#94A3B8] hover:text-[#F8FAFC]"
                                onClick={() => { setFile(null); setDocName(''); }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Document name */}
                    <div className="space-y-2">
                        <Label className={dark.label}>Document Name</Label>
                        <Input
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="e.g., Q4 2025 Financial Statements"
                            className={dark.input}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className={dark.label}>Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className={dark.input}>
                                <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className={`rounded-md p-3 text-sm ${dark.error}`}>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={uploading}
                            className={dark.cancelBtn}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || !category || uploading}
                            className={dark.saveBtn}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
