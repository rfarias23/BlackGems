import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPortalDashboard } from '@/lib/actions/portal';
import {
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Landmark,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default async function PortalPage() {
    const data = await getPortalDashboard();

    // No investor linked — show onboarding message
    if (!data) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20">
                <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h1 className="text-2xl font-serif font-bold text-slate-900">Welcome to BlackGem</h1>
                <p className="text-slate-500 mt-2">
                    Your investor account is being set up. Please contact your fund manager for access.
                </p>
            </div>
        );
    }

    const { summary, funds, recentTransactions } = data;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Investment Overview</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Your capital account summary across all funds.
                </p>
            </div>

            <ErrorBoundary module="Portal Dashboard">
            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Committed</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalCommitted)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Capital Called</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalCalled)}</div>
                        <p className="text-xs text-slate-500 mt-1">{summary.calledPct}% of commitment</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Distributions</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalDistributed)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Unfunded</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.unfunded)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Fund breakdown */}
            {funds.length > 0 && (
                <div>
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Fund Commitments</h2>
                    <div className="grid gap-4">
                        {funds.map((fund) => (
                            <Card key={fund.id} className="bg-white border-slate-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{fund.name}</h3>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {fund.type.replace(/_/g, ' ').toLowerCase()} &middot; {fund.status.replace(/_/g, ' ').toLowerCase()}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-slate-500 capitalize">
                                            {fund.commitmentStatus.replace(/_/g, ' ').toLowerCase()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500">Committed</p>
                                            <p className="font-semibold text-slate-900">{formatCurrency(fund.committed)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Called</p>
                                            <p className="font-semibold text-slate-900">{formatCurrency(fund.called)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Paid</p>
                                            <p className="font-semibold text-slate-900">{formatCurrency(fund.paid)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Distributed</p>
                                            <p className="font-semibold text-emerald-600">{formatCurrency(fund.distributed)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Unfunded</p>
                                            <p className="font-semibold text-slate-900">{formatCurrency(fund.unfunded)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent activity */}
            <div>
                <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Recent Activity</h2>
                {recentTransactions.length === 0 ? (
                    <Card className="bg-white border-slate-200">
                        <CardContent className="py-10 text-center text-slate-400 text-sm">
                            No transactions yet.
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {recentTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                                tx.type === 'CAPITAL_CALL'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {tx.type === 'CAPITAL_CALL'
                                                    ? <ArrowUpRight className="h-4 w-4" />
                                                    : <ArrowDownLeft className="h-4 w-4" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                                                <p className="text-xs text-slate-500">{tx.fund} &middot; {formatDate(tx.date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${
                                                tx.type === 'DISTRIBUTION' ? 'text-emerald-600' : 'text-slate-900'
                                            }`}>
                                                {tx.type === 'DISTRIBUTION' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {tx.status.replace(/_/g, ' ').toLowerCase()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            </ErrorBoundary>
        </div>
    );
}
