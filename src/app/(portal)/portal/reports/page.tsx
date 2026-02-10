import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function PortalReportsPage() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Reports</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Quarterly updates and fund performance reports.
                </p>
            </div>

            <Card className="bg-white border-slate-200">
                <CardContent className="py-16 text-center">
                    <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No reports published yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Published quarterly updates will appear here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
