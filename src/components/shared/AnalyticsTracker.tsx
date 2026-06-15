'use client'
// src/components/shared/AnalyticsTracker.tsx
// Fires a lightweight page-view event on mount — used inside TenantSite

import { useEffect } from 'react'

export default function AnalyticsTracker({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    if (!tenantId) return

    // Don't track dashboard or bot-like user agents
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return

    fetch('/api/analytics/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tenant_id: tenantId, path: window.location.pathname }),
    }).catch(() => {}) // fire-and-forget, never block render
  }, [tenantId])

  return null
}
