import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPortalDocuments } from '@/lib/actions/portal';
import { FileText, Download, Folder } from 'lucide-react';

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function PortalDocumentsPage() {
    const documents = await getPortalDocuments();

    // Group by category
    const grouped = documents.reduce((acc, doc) => {
        const cat = doc.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(doc);
        return acc;
    }, {} as Record<string, typeof documents>);

    const categories = Object.keys(grouped).sort();

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Documents</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Access your investor documents, reports, and fund materials.
                </p>
            </div>

            {documents.length === 0 ? (
                <Card className="bg-white border-slate-200">
                    <CardContent className="py-16 text-center">
                        <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No documents available yet.</p>
                        <p className="text-sm text-slate-400 mt-1">Documents shared with you will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {categories.map((cat) => (
                        <div key={cat}>
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                {formatCategory(cat)}
                            </h2>
                            <Card className="bg-white border-slate-200 overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {grouped[cat].map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatFileSize(doc.fileSize)} &middot; {formatDate(doc.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" asChild className="border-slate-200 text-slate-700 hover:bg-slate-50">
                                                <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
