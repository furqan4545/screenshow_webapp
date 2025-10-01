// Deno Edge Function: create-checkout
// Creates a Stripe Checkout Session for the given priceKey.
// Chooses dev vs prod price IDs based on the provided successUrl (localhost => dev).

import Stripe from 'npm:stripe@14.23.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Body = {
  priceKey: 'pro_month' | 'pro_year' | 'lifetime' | 'enterprise_month'
  successUrl?: string
  cancelUrl?: string
}

const env = {
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY')!,
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY')!,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  // Price IDs for DEV (test) and PROD (live)
  PRICE_PRO_MONTH_DEV: Deno.env.get('PRICE_PRO_MONTH_DEV')!,
  PRICE_PRO_YEAR_DEV: Deno.env.get('PRICE_PRO_YEAR_DEV')!,
  PRICE_LIFETIME_DEV: Deno.env.get('PRICE_LIFETIME_DEV')!,
  PRICE_ENT_MONTH_DEV: Deno.env.get('PRICE_ENT_MONTH_DEV')!,
  PRICE_PRO_MONTH_PROD: Deno.env.get('PRICE_PRO_MONTH_PROD')!,
  PRICE_PRO_YEAR_PROD: Deno.env.get('PRICE_PRO_YEAR_PROD')!,
  PRICE_LIFETIME_PROD: Deno.env.get('PRICE_LIFETIME_PROD')!,
  PRICE_ENT_MONTH_PROD: Deno.env.get('PRICE_ENT_MONTH_PROD')!,
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function pickPriceId(priceKey: Body['priceKey'], isDev: boolean): string {
  const mapDev: Record<Body['priceKey'], string> = {
    pro_month: env.PRICE_PRO_MONTH_DEV,
    pro_year: env.PRICE_PRO_YEAR_DEV,
    lifetime: env.PRICE_LIFETIME_DEV,
    enterprise_month: env.PRICE_ENT_MONTH_DEV,
  }
  const mapProd: Record<Body['priceKey'], string> = {
    pro_month: env.PRICE_PRO_MONTH_PROD,
    pro_year: env.PRICE_PRO_YEAR_PROD,
    lifetime: env.PRICE_LIFETIME_PROD,
    enterprise_month: env.PRICE_ENT_MONTH_PROD,
  }
  return (isDev ? mapDev : mapProd)[priceKey]
}

async function getOrCreateCustomer(admin: ReturnType<typeof createClient>, userId: string, email?: string) {
  const { data: row } = await admin.from('customers').select('stripe_customer_id').eq('user_id', userId).maybeSingle()
  if (row?.stripe_customer_id) return row.stripe_customer_id as string

  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } })
  await admin.from('customers').insert({ user_id: userId, stripe_customer_id: customer.id })
  return customer.id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } })
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    const body = (await req.json()) as Body
    const isDev = (body.successUrl ?? '').includes('localhost')
    const priceId = pickPriceId(body.priceKey, isDev)
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Missing price ID for ${body.priceKey} (${isDev ? 'DEV' : 'PROD'})` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }
    const mode = body.priceKey === 'lifetime' ? 'payment' : 'subscription'
    const successUrl = body.successUrl || `${isDev ? 'http://localhost:3000' : 'https://screenshow.app'}/dashboard`
    const cancelUrl = body.cancelUrl || (isDev ? 'http://localhost:3000/pricing' : 'https://screenshow.app/pricing')

    const customerId = await getOrCreateCustomer(admin, user.id, user.email ?? undefined)

    const session = await stripe.checkout.sessions.create({
      mode: mode as 'payment' | 'subscription',
      customer: customerId,
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id, price_key: body.priceKey },
      subscription_data: mode === 'subscription' ? { metadata: { user_id: user.id, price_key: body.priceKey } } : undefined,
    })

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e: any) {
    console.error('create-checkout error', e)
    const message = typeof e?.message === 'string' ? e.message : 'Internal error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})


