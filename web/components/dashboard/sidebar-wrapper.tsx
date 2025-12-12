'use client'

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/animate-ui/components/radix/sidebar'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'

interface SidebarWrapperProps {
  userEmail?: string
  userName?: string
  children: React.ReactNode
}

export function SidebarWrapper({ userEmail, userName, children }: SidebarWrapperProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar userEmail={userEmail} userName={userName} />
      <SidebarInset>
        <div className="flex h-screen overflow-hidden bg-background">
          <main className="flex-1 overflow-y-auto">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

