import { setRequestLocale } from 'next-intl/server'

import { logApiError } from '@/lib/api-errors'
import { getAudiencePayload, getStatusPayload } from '@/lib/status-payload'

import { StatusDashboard } from './StatusDashboard'

// Same window as the payload cache in lib/status-payload.ts: regenerating the
// HTML more often would only re-render the same cached payload.
export const revalidate = 30

/**
 * Server shell of /status. Both payloads come from the same cached loaders the
 * API routes use, so rendering here costs a cache read, not the 26 queries.
 *
 * A failure in either loader renders that part empty and lets the client poll
 * fill it in, which is what the page did for everything before.
 *
 * The JSON round trip gives the client exactly the shape it already receives
 * from /api/status (dates as ISO strings, no undefined keys) instead of the
 * richer types React would carry across the server/client boundary.
 */
export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [status, audience] = await Promise.all([
    getStatusPayload()
      .then((result) => toPlainJson(result.data))
      .catch((error) => {
        logApiError('status-page', error)
        return null
      }),
    getAudiencePayload()
      .then(toPlainJson)
      .catch((error) => {
        logApiError('ga4', error)
        return null
      }),
  ])

  return <StatusDashboard initialData={status} initialAudience={audience} />
}

function toPlainJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value))
}
