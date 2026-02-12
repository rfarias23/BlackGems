import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, Globe, Users } from 'lucide-react';
import type { PortfolioCompanyDetail } from '@/lib/actions/portfolio';

function formatDate(date: Date | null): string {
    if (!date) return '\u2014';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

interface PortfolioOverviewProps {
    company: PortfolioCompanyDetail;
}

export function PortfolioOverview({ company }: PortfolioOverviewProps) {
    return (
        <div className="space-y-6">
            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Company Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {company.description && (
                            <div className="text-sm text-muted-foreground">
                                {company.description}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Industry</span>
                            <span className="font-medium">{company.industry || '\u2014'}</span>
                        </div>
                        {company.businessModel && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Business Model</span>
                                <span className="font-medium">{company.businessModel}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Headquarters</span>
                            <span className="font-medium">{company.headquarters || '\u2014'}</span>
                        </div>
                        {company.website && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Website</span>
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    <Globe className="h-3 w-3" />
                                    Visit
                                </a>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ownership</span>
                            <span className="font-medium">{company.ownershipPct}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Investment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Acquisition Date</span>
                            <span className="font-medium">{formatDate(company.acquisitionDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Entry Valuation</span>
                            <span className="font-medium font-mono tabular-nums">{company.entryValuation}</span>
                        </div>
                        {company.entryRevenue && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entry Revenue</span>
                                <span className="font-medium font-mono tabular-nums">{company.entryRevenue}</span>
                            </div>
                        )}
                        {company.entryEbitda && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entry EBITDA</span>
                                <span className="font-medium font-mono tabular-nums">{company.entryEbitda}</span>
                            </div>
                        )}
                        {company.entryMultiple && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entry Multiple</span>
                                <span className="font-medium font-mono tabular-nums">{company.entryMultiple} EV/EBITDA</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Investment</span>
                            <span className="font-medium font-mono tabular-nums">{company.totalInvestment}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Management */}
            {(company.ceoName || company.boardSeats) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {company.ceoName && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">CEO</span>
                                <span className="font-medium">{company.ceoName}</span>
                            </div>
                        )}
                        {company.ceoEmail && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">CEO Email</span>
                                <a href={`mailto:${company.ceoEmail}`} className="font-medium text-primary hover:underline">
                                    {company.ceoEmail}
                                </a>
                            </div>
                        )}
                        {company.boardSeats && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Board Seats</span>
                                <span className="font-medium">{company.boardSeats}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Investment Thesis */}
            {company.investmentThesis && (
                <Card>
                    <CardHeader>
                        <CardTitle>Investment Thesis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {company.investmentThesis}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
