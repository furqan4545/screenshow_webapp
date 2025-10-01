import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

function Pricing() {
  const [yearly, setYearly] = useState(true)
  const discount = useMemo(() => {
    // Monthly $20 -> $240/year; Yearly $84 -> $84/year, so 65% off vs monthly
    const monthlyYear = 240
    const yearlyPrice = 84
    const pct = Math.round(((monthlyYear - yearlyPrice) / monthlyYear) * 100)
    return pct
  }, [])

  const price = yearly ? '$7' : '$20'
  const subcopy = yearly
    ? 'Per month billed yearly ($84/yr).'
    : 'Per month billed monthly. Switch to yearly anytime.'

  return (
    <main className="relative min-h-[70vh] bg-[#0b0d12] text-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Pricing</h1>
          <div className="flex items-center gap-3">
            {yearly && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                Save {discount}%
              </span>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-1 text-xs">
              <button
                onClick={() => setYearly(false)}
                className={[ 'rounded-full px-3 py-1', !yearly ? 'bg-black/60 text-white' : 'text-white/70' ].join(' ')}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={[ 'rounded-full px-3 py-1', yearly ? 'bg-black/60 text-white' : 'text-white/70' ].join(' ')}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Pro card */}
          <PricingCard
            badge={yearly ? 'Yearly' : 'Monthly'}
            title="Screenshow Pro"
            price={price}
            perMonth={true}
            subcopy={subcopy}
            features={[
              'All Screenshow features',
              'Lifetime updates',
              'Shareable links (coming soon)',
              '1 personal device',
            ]}
            highlight={yearly}
          />

          {/* Lifetime */}
          <PricingCard
            badge="Lifetime"
            title="Screenshow Lifetime"
            price="$220"
            perMonth={false}
            subcopy="One‑time payment. 1 month of updates included."
            features={[
              'All Screenshow features',
              'Updates for 1 month',
              'Shareable links (coming soon)',
              '1 personal device',
            ]}
          />

          {/* Enterprise */}
          <PricingCard
            badge="Enterprise"
            title="Screenshow Enterprise"
            price="$199"
            perMonth={true}
            subcopy="Per month billed monthly. Team features & support."
            features={[
              'All Screenshow features',
              'Priority support',
              'Shareable links (coming soon)',
              'Custom contract',
            ]}
          />
        </div>
      </section>
    </main>
  )
}

function PricingCard({
  badge,
  title,
  price,
  perMonth,
  subcopy,
  features,
  highlight,
}: {
  badge: string
  title: string
  price: string
  perMonth: boolean
  subcopy: string
  features: string[]
  highlight?: boolean
}) {
  const [loading, setLoading] = useState(false)

  const onCheckout = async (priceKey: 'pro_month' | 'pro_year' | 'lifetime' | 'enterprise_month') => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const isDev = window.location.origin.includes('localhost')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceKey,
            successUrl: `${isDev ? 'http://localhost:3000' : 'https://screenshow.app'}/dashboard`,
            cancelUrl: `${window.location.origin}/pricing`,
          }),
        },
      )
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        if (json?.url) window.location.assign(json.url)
        else if (json?.error) alert(json.error)
      } catch {
        alert(text)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={[ 'flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6', highlight ? 'ring-1 ring-indigo-500/40' : '' ].join(' ')}>
      <div className="mb-3 inline-flex w-max rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
        {badge}
      </div>
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mb-5 text-white/70">All Screenshow features included.</p>
      <div className="mb-1 text-5xl font-bold">
        {price}{perMonth && <span className="text-xl font-medium text-white/60">/month</span>}
      </div>
      <p className="mb-5 text-sm text-white/60">{subcopy}</p>
      <ul className="mt-2 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-3 w-3 rounded-full bg-green-500/80" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <button
          onClick={() => onCheckout(title.includes('Enterprise') ? 'enterprise_month' : title.includes('Lifetime') ? 'lifetime' : (badge === 'Yearly' ? 'pro_year' : 'pro_month'))}
          className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Preparing checkout…' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}


