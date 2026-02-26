import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser, getFundConfig } from '@/lib/actions/settings';
import { getSubscriptionStatus } from '@/lib/actions/billing';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { FundConfigForm } from '@/components/settings/fund-config-form';
import { BillingTab } from '@/components/settings/billing-tab';
import { Card, CardContent } from '@/components/ui/card';
import { User, Building2, CreditCard } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface SettingsPageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
    const params = await searchParams;
    const defaultTab = ['profile', 'fund', 'billing'].includes(params.tab ?? '')
        ? params.tab!
        : 'profile';

    const [user, fundConfig, billing] = await Promise.all([
        getCurrentUser(),
        getFundConfig(),
        getSubscriptionStatus(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your profile, fund configuration, and billing.
                </p>
            </div>

            <ErrorBoundary module="Settings">
            <Tabs defaultValue={defaultTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="fund" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Fund Configuration
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    {user ? (
                        <>
                            <ProfileForm user={user} />
                            <PasswordForm />
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-muted-foreground">Unable to load user profile.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Fund Configuration Tab */}
                <TabsContent value="fund" className="space-y-6">
                    {fundConfig ? (
                        <FundConfigForm fund={fundConfig} />
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-muted-foreground">No fund configured. Contact your administrator.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-6">
                    <BillingTab
                        tier={billing?.tier ?? null}
                        status={billing?.status ?? null}
                        daysRemaining={billing?.daysRemaining}
                        hasStripeCustomer={billing?.hasStripeCustomer ?? false}
                    />
                </TabsContent>
            </Tabs>
            </ErrorBoundary>
        </div>
    );
}
