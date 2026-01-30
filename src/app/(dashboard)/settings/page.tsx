import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser, getFundConfig } from '@/lib/actions/settings';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { FundConfigForm } from '@/components/settings/fund-config-form';
import { Card, CardContent } from '@/components/ui/card';
import { User, Building2 } from 'lucide-react';

export default async function SettingsPage() {
    const [user, fundConfig] = await Promise.all([
        getCurrentUser(),
        getFundConfig(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your profile and fund configuration.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="fund" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Fund Configuration
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
            </Tabs>
        </div>
    );
}
