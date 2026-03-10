'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import type { FundSummary } from '@/lib/actions/funds'

interface TabletSidebarDrawerProps {
  userRole?: string
  funds: FundSummary[]
  activeFundId: string
  permissions: string[]
  trialDaysRemaining?: number
}

export function TabletSidebarDrawer({
  userRole,
  funds,
  activeFundId,
  permissions,
  trialDaysRemaining,
}: TabletSidebarDrawerProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-[35] hidden md:flex xl:hidden items-center justify-center h-8 w-8 rounded-md hover:bg-[#1E293B] transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5 text-[#94A3B8]" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-[#11141D] border-[#334155]"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {/* Re-declare dark CSS vars — portal renders outside the layout div */}
          <div
            className="h-full"
            style={{
              '--background': '#11141D',
              '--foreground': '#F8FAFC',
              '--card': '#11141D',
              '--card-foreground': '#F8FAFC',
              '--popover': '#1E293B',
              '--popover-foreground': '#F8FAFC',
              '--primary': '#F8FAFC',
              '--primary-foreground': '#11141D',
              '--secondary': '#334155',
              '--secondary-foreground': '#F8FAFC',
              '--muted': '#1E293B',
              '--muted-foreground': '#94A3B8',
              '--accent': '#3E5CFF',
              '--accent-foreground': '#F8FAFC',
              '--border': '#334155',
              '--input': '#334155',
              '--ring': '#F8FAFC',
              colorScheme: 'dark',
            } as React.CSSProperties}
          >
            <Sidebar
              userRole={userRole}
              funds={funds}
              activeFundId={activeFundId}
              permissions={permissions}
              trialDaysRemaining={trialDaysRemaining}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
