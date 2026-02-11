'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PortalReportsTabsProps {
    children: React.ReactNode;
}

export function PortalReportsTabs({ children }: PortalReportsTabsProps) {
    return (
        <Tabs defaultValue="capital-account" className="space-y-6">
            <TabsList className="bg-slate-100 border border-slate-200">
                <TabsTrigger
                    value="capital-account"
                    className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                    Capital Account
                </TabsTrigger>
                <TabsTrigger
                    value="fund-performance"
                    className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                    Fund Performance
                </TabsTrigger>
                <TabsTrigger
                    value="portfolio"
                    className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                    Portfolio Overview
                </TabsTrigger>
            </TabsList>
            {children}
        </Tabs>
    );
}

export { TabsContent };
