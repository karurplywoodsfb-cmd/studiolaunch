// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import DashboardShell from '@/components/dashboard/DashboardShell'
import './dashboard-theme.css'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenant = await getCurrentTenant()

  // If no tenant yet, push to onboarding
  if (!tenant) redirect('/onboarding')

  const admin = createAdminClient()
  const { count: newLeadsCount } = await admin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('status', 'new')

  return <DashboardShell tenant={tenant} newLeadsCount={newLeadsCount || 0}>{children}</DashboardShell>
}
