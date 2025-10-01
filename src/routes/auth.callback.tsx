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



