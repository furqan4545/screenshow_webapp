import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '../context/AuthProvider'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/' })
    }
    return null
  },
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<string>('free')
  const [active, setActive] = useState<'secret' | 'billing'>('secret')
  const [secret, setSecret] = useState<string>('')
  const [copied, setCopied] = useState<{ email: boolean; secret: boolean }>({
    email: false,
    secret: false,
  })

  const initials = useMemo(() => {
    const email = user?.email ?? 'U'
    const [namePart] = email.split('@')
    return namePart.slice(0, 2).toUpperCase()
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    const storageKey = `user-secret-${user.id}`
    let existing = localStorage.getItem(storageKey) || ''
    if (!existing) {
      const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      existing = `sk_live_${random}`
      localStorage.setItem(storageKey, existing)
    }
    setSecret(existing)
  }, [user?.id])

  useEffect(() => {
    const fetchPlan = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan,status')
        .eq('user_id', user?.id)
        .maybeSingle()
      if (data?.plan && data.status !== 'canceled') setPlan(data.plan)
      else setPlan('free')
    }
    if (user?.id) void fetchPlan()
  }, [user?.id])

  const maskedSecret = useMemo(() => {
    if (!secret) return '—'
    const tail = secret.slice(-6)
    return `••••••••••••••••${tail}`
  }, [secret])

  return (
    <div className="min-h-[80vh] w-full bg-[#0b0d12] text-white">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
        {/* Sidebar */}
        <aside className="w-full max-w-xs shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-600/80 text-sm font-medium">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user?.email ?? '—'}</div>
                <div className="text-xs text-white/60">{plan.replace('_', ' ') || 'free'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActive('secret')}
                className={[
                  'flex-1 rounded-lg border px-3 py-2 text-sm',
                  active === 'secret'
                    ? 'border-white/20 bg-white/[0.06] text-white'
                    : 'border-white/10 text-white/70 hover:bg-white/[0.04]'
                ].join(' ')}
              >
                Secret
              </button>
              <button
                onClick={() => setActive('billing')}
                className={[
                  'flex-1 rounded-lg border px-3 py-2 text-sm',
                  active === 'billing'
                    ? 'border-white/20 bg-white/[0.06] text-white'
                    : 'border-white/10 text-white/70 hover:bg-white/[0.04]'
                ].join(' ')}
              >
                Billing
              </button>
            </div>
            {/* Logout handled in header */}
          </div>
        </aside>

        {/* Main panel */}
        <section className="min-h-[60vh] flex-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            {active === 'secret' ? (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold">Secret</h2>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-4">
                    <label className="mb-1 block text-xs text-white/60">Email</label>
                    <div className="flex items-stretch gap-2">
                      <input
                        readOnly
                        value={user?.email ?? '—'}
                        className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                      />
                      <button
                        onClick={async () => {
                          if (!user?.email) return
                          await navigator.clipboard.writeText(user.email)
                          setCopied({ email: true, secret: false })
                          setTimeout(() => setCopied({ email: false, secret: false }), 1200)
                        }}
                        className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/[0.06]"
                      >
                        {copied.email ? (
                          <span className="text-green-400">✓ Copied</span>
                        ) : (
                          'Copy'
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Secret key</label>
                    <div className="flex items-stretch gap-2">
                      <input
                        readOnly
                        value={maskedSecret}
                        className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                      />
                      <button
                        onClick={async () => {
                          if (!secret) return
                          await navigator.clipboard.writeText(secret)
                          setCopied({ email: false, secret: true })
                          setTimeout(() => setCopied({ email: false, secret: false }), 1200)
                        }}
                        className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/[0.06]"
                      >
                        {copied.secret ? (
                          <span className="text-green-400">✓ Copied</span>
                        ) : (
                          'Copy'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Billing</h2>
                <p className="text-sm text-white/70">Manage your subscription and invoices here once connected to Stripe.</p>
                <p className="mt-3 text-sm text-white/60">To view plans, visit the <a className="text-indigo-400 hover:underline" href="/pricing">pricing page</a>.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}


