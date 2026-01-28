import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

export default function PortalPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-primary">Investment Overview</h1>
                <p className="text-muted-foreground">
                    Welcome to your investor dashboard. Here you can track performance and access documents.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Commitment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">$500,000</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Contributed Capital</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">$350,000</div>
                        <p className="text-xs text-muted-foreground">70% Called</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">$412,500</div>
                        <p className="text-xs text-emerald-600 font-medium">+17.8% IRR</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary font-serif">Recent Documents</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Quarterly Reports</CardTitle>
                        <CardDescription>Performance updates and financial statements</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-primary">Q4 2025 Investor Report</p>
                                    <p className="text-sm text-muted-foreground">January 15, 2026</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-primary">Q3 2025 Investor Report</p>
                                    <p className="text-sm text-muted-foreground">October 15, 2025</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
