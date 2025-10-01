// Deno Edge Function: stripe-webhook
// Handles Stripe events to persist subscription state to Supabase

import Stripe from 'npm:stripe@14.23.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const env = {
  STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY')!,
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return new Response('Missing stripe-signature', { status: 400, headers: corsHeaders })
  }
  const raw = await req.text()
  let event: Stripe.Event
  try {
    // Use async verifier (works reliably on Deno/Supabase edge runtime)
    // @ts-ignore - constructEventAsync available in stripe v14+
    event = await stripe.webhooks.constructEventAsync(raw, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('webhook verify failed', err)
    return new Response('Invalid signature', { status: 400, headers: corsHeaders })
  }

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = (session.metadata?.user_id as string) || ''
        const priceKey = (session.metadata?.price_key as string) || ''
        if (session.mode === 'subscription') {
          const subId = session.subscription as string
          const sub = await stripe.subscriptions.retrieve(subId)
          await admin.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            plan: priceKey,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }, { onConflict: 'user_id' })
        } else {
          await admin.from('subscriptions').upsert({
            user_id: userId,
            plan: priceKey,
            status: 'active',
            current_period_end: null,
          }, { onConflict: 'user_id' })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = (sub.metadata?.user_id as string) || ''
        await admin.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: sub.id,
          plan: (sub.metadata?.price_key as string) || null,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' })
        break
      }
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error(e)
    return new Response('error', { status: 500, headers: corsHeaders })
  }
})


