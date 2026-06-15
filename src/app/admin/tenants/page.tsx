// src/app/admin/tenants/page.tsx — Studio management with plan override
import { getAdminMetrics } from '@/lib/admin'
import AdminTenantsClient from './AdminTenantsClient'

export const dynamic = 'force-dynamic'

export default async function AdminTenantsPage() {
  const metrics = await getAdminMetrics()
  return <AdminTenantsClient tenants={metrics.tenants} />
}
