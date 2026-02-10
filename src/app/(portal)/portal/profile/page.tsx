import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { User } from 'lucide-react';

export default async function PortalProfilePage() {
    const session = await auth();

    let investor = null;
    if (session?.user?.investorId) {
        investor = await prisma.investor.findUnique({
            where: { id: session.user.investorId },
            select: {
                name: true,
                type: true,
                email: true,
                phone: true,
                contactName: true,
                contactEmail: true,
                contactPhone: true,
                contactTitle: true,
                legalName: true,
                jurisdiction: true,
                city: true,
                state: true,
                country: true,
            },
        });
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Profile</h1>
                <p className="text-sm text-slate-500 mt-1">Your investor profile and contact information.</p>
            </div>

            {/* Account info */}
            <Card className="bg-white border-slate-200">
                <CardHeader>
                    <CardTitle className="text-base text-slate-900">Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{session?.user?.name || 'User'}</p>
                            <p className="text-sm text-slate-500">{session?.user?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Investor info */}
            {investor && (
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-900">Investor Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div>
                                <dt className="text-slate-500">Entity Name</dt>
                                <dd className="font-medium text-slate-900 mt-0.5">{investor.name}</dd>
                            </div>
                            {investor.legalName && (
                                <div>
                                    <dt className="text-slate-500">Legal Name</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">{investor.legalName}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-slate-500">Type</dt>
                                <dd className="font-medium text-slate-900 mt-0.5 capitalize">{investor.type.replace(/_/g, ' ').toLowerCase()}</dd>
                            </div>
                            {investor.jurisdiction && (
                                <div>
                                    <dt className="text-slate-500">Jurisdiction</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">{investor.jurisdiction}</dd>
                                </div>
                            )}
                            {(investor.city || investor.state) && (
                                <div>
                                    <dt className="text-slate-500">Location</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">
                                        {[investor.city, investor.state, investor.country].filter(Boolean).join(', ')}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>
            )}

            {/* Contact info */}
            {investor && (investor.contactName || investor.contactEmail) && (
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-900">Primary Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            {investor.contactName && (
                                <div>
                                    <dt className="text-slate-500">Name</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">{investor.contactName}</dd>
                                </div>
                            )}
                            {investor.contactTitle && (
                                <div>
                                    <dt className="text-slate-500">Title</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">{investor.contactTitle}</dd>
                                </div>
                            )}
                            {investor.contactEmail && (
                                <div>
                                    <dt className="text-slate-500">Email</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">{investor.contactEmail}</dd>
                                </div>
                            )}
                            {investor.contactPhone && (
                                <div>
                                    <dt className="text-slate-500">Phone</dt>
                                    <dd className="font-medium text-slate-900 mt-0.5">{investor.contactPhone}</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
