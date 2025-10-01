// Deno Edge Function: verify-secret
// POST { email, secret }
// - Looks up the user by email (Supabase Auth, admin)
// - Computes HMAC(secret + server pepper) and compares with stored hash
// - Returns { valid, userId, plan, status } when valid

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SECRET_PEPPER: string
}

const env = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  SECRET_PEPPER: Deno.env.get('SECRET_PEPPER')!,
} satisfies Env

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSHA256(message: string, key: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return toHex(sig)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Not found', { status: 404, headers: corsHeaders })

  try {
    const { email, secret } = (await req.json().catch(() => ({}))) as { email?: string; secret?: string }
    if (!email || !secret) {
      return new Response(JSON.stringify({ error: 'email and secret are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    // Lookup user by email via Admin API
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const user = list.data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (!user) {
      return new Response(JSON.stringify({ valid: false, reason: 'user_not_found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const digest = await hmacSHA256(secret, env.SECRET_PEPPER)

    const { data: row } = await admin
      .from('user_secrets')
      .select('secret_hash')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!row || row.secret_hash !== digest) {
      return new Response(JSON.stringify({ valid: false, reason: 'secret_mismatch' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { data: sub } = await admin
      .from('subscriptions')
      .select('plan,status,current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()

    return new Response(
      JSON.stringify({
        valid: true,
        userId: user.id,
        plan: sub?.plan ?? 'free',
        status: sub?.status ?? 'active',
        current_period_end: sub?.current_period_end ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (e) {
    console.error(e)
    return new Response('error', { status: 500, headers: corsHeaders })
  }
})


