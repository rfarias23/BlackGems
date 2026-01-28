import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DealStageBadge } from '@/components/deals/deal-stage-badge';
import { ArrowLeft, Edit, Archive, Upload, Plus, FileText, Phone, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DealDetailPage({ params }: { params: { id: string } }) {
    // Mock Data based on ID (real implementation would fetch)
    const deal = {
        id: params.id,
        name: 'ABC Manufacturing',
        stage: 'Due Diligence' as const,
        sector: 'Manufacturing',
        askPrice: '$8,500,000',
        description: 'ABC Manufacturing is a 35-year-old manufacturer of industrial equipment with strong customer relationships and consistent margins.',
        revenue: '$8.2M',
        ebitda: '$1.4M',
        margin: '17.1%',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/deals">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{deal.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{deal.sector}</span>
                            <span>•</span>
                            <DealStageBadge stage={deal.stage} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Deal
                    </Button>
                    <Button variant="destructive" size="icon">
                        <Archive className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue (LTM)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{deal.revenue}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">EBITDA (LTM)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{deal.ebitda}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">EBITDA Margin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-500">{deal.margin}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Asking Price</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-muted-foreground">{deal.askPrice}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Investment Thesis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {deal.description}
                                </p>
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-semibold">Key Highlights:</h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        <li>Strong recurring revenue component</li>
                                        <li>Low customer concentration</li>
                                        <li>Founder willing to stay for transition</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Key Dates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">First Contact</span>
                                        <span className="font-medium">Jan 5, 2026</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">NDA Signed</span>
                                        <span className="font-medium">Jan 12, 2026</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">CIM Received</span>
                                        <span className="font-medium">Jan 15, 2026</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Mgmt Meeting</span>
                                        <span className="font-medium">Jan 22, 2026</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Data Room</h3>
                        <Button size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload File
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Confidential Information Memorandum (CIM)</p>
                                            <p className="text-xs text-muted-foreground">PDF • 2.4 MB • Uploaded Jan 15</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">Download</Button>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Financial Model</p>
                                            <p className="text-xs text-muted-foreground">XLSX • 1.1 MB • Uploaded Jan 18</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">Download</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Deal Team & External</h3>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-700">JS</div>
                                <div>
                                    <CardTitle className="text-base">John Smith</CardTitle>
                                    <CardDescription>CEO / Founder (Target)</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>john@abcmanufacturing.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>+1 (555) 123-4567</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-700">MJ</div>
                                <div>
                                    <CardTitle className="text-base">Mike Jones</CardTitle>
                                    <CardDescription>Broker (Business Intermediary)</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>mike@brokerage.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>+1 (555) 987-6543</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {/* Timeline Item */}
                                <div className="flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Management Meeting Completed</p>
                                        <p className="text-sm text-muted-foreground">Met with John Smith and CFO. Positive impression of operations.</p>
                                        <div className="flex items-center pt-2 text-xs text-muted-foreground">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            Jan 22, 2026
                                        </div>
                                    </div>
                                </div>
                                {/* Timeline Item */}
                                <div className="flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">CIM Review Started</p>
                                        <p className="text-sm text-muted-foreground">Team analyzing initial materials.</p>
                                        <div className="flex items-center pt-2 text-xs text-muted-foreground">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            Jan 15, 2026
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Private Notes</CardTitle>
                            <CardDescription>Internal team notes not shared with external parties.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground italic">
                                No notes yet. Start typing to add a note...
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
