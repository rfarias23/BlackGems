import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPortalDashboard } from '@/lib/actions/portal';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Landmark,
} from 'lucide-react';
import { AcknowledgeCallButton } from '@/components/portal/acknowledge-call-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { formatMoney } from '@/lib/shared/formatters';

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default async function CapitalAccountPage() {
    const data = await getPortalDashboard();

    if (!data) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20">
                <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h1 className="text-2xl font-serif font-bold text-slate-900">Capital Account</h1>
                <p className="text-slate-500 mt-2">Your account is being set up.</p>
            </div>
        );
    }

    const { summary, recentTransactions } = data;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Capital Account</h1>
                <p className="text-sm text-slate-500 mt-1">Your capital contributions, distributions, and account balance.</p>
            </div>

            <ErrorBoundary module="Portal Capital">
            {/* Account summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatMoney(summary.totalPaid)}</div>
                        <p className="text-xs text-slate-500 mt-1">Capital paid in</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Distributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatMoney(summary.totalDistributed)}</div>
                        <p className="text-xs text-slate-500 mt-1">Cash returned</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Net Invested</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatMoney(summary.netValue)}</div>
                        <p className="text-xs text-slate-500 mt-1">Contributions − Distributions</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Remaining Commitment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatMoney(summary.unfunded)}</div>
                        <p className="text-xs text-slate-500 mt-1">Uncalled capital</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction history */}
            <div>
                <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Transaction History</h2>
                {recentTransactions.length === 0 ? (
                    <Card className="bg-white border-slate-200">
                        <CardContent className="py-10 text-center text-slate-400 text-sm">
                            No transactions recorded yet.
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-white border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Date</th>
                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Type</th>
                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Description</th>
                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Fund</th>
                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Amount</th>
                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Status</th>
                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-6 text-slate-900">{formatDate(tx.date)}</td>
                                            <td className="py-3 px-6">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                                    tx.type === 'CAPITAL_CALL'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                    {tx.type === 'CAPITAL_CALL'
                                                        ? <><ArrowUpRight className="h-3 w-3" /> Call</>
                                                        : <><ArrowDownLeft className="h-3 w-3" /> Distribution</>
                                                    }
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-slate-900">{tx.description}</td>
                                            <td className="py-3 px-6 text-slate-500">{tx.fund}</td>
                                            <td className={`py-3 px-6 text-right font-semibold ${
                                                tx.type === 'DISTRIBUTION' ? 'text-emerald-600' : 'text-slate-900'
                                            }`}>
                                                {tx.type === 'DISTRIBUTION' ? '+' : '-'}{formatMoney(tx.amount)}
                                            </td>
                                            <td className="py-3 px-6 text-right text-slate-500 capitalize">
                                                {tx.status.replace(/_/g, ' ').toLowerCase()}
                                            </td>
                                            <td className="py-3 px-6 text-right">
                                                {tx.type === 'CAPITAL_CALL' && tx.status === 'PENDING' ? (
                                                    <AcknowledgeCallButton itemId={tx.id} />
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
            </ErrorBoundary>
        </div>
    );
}
