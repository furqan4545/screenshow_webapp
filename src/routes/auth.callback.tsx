import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export const Route = createFileRoute('/auth/callback')({
  component: Callback,
})

function Callback() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const start = Date.now()

    const waitForSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session || Date.now() - start > 1500) {
        // Best-effort: ensure a secret exists (idempotent function)
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-secret`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${data.session?.access_token ?? ''}`,
                'Content-Type': 'application/json',
              },
            },
          )
          // Ignore response; we only need side-effect
        } catch (e) {
          // noop
        }
        router.navigate({ to: '/dashboard' })
      } else {
        setTimeout(waitForSession, 100)
      }
    }

    waitForSession()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-white/80">
      Completing sign in...
    </div>
  )
}



