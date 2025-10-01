// Deno Edge Function: generate-secret
// - Verifies caller with Supabase Auth (Authorization: Bearer <access_token>)
// - Generates a strong secret and stores ONLY an HMAC-SHA256 digest (with server-only pepper)
// - Returns the plaintext secret ONCE along with a short preview (last 6)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SECRET_PEPPER: string
}

const env = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY')!,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  SECRET_PEPPER: Deno.env.get('SECRET_PEPPER')!,
} satisfies Env

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomBase64Url(numBytes: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(numBytes))
  const base64 = btoa(String.fromCharCode(...bytes))
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hmacSHA256(message: string, key: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return toHex(sig)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    // Client with the caller's JWT to read user
    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Admin client (service role) to write to DB
    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    const { force } = (await (async () => {
      try {
        return await req.json()
      } catch {
        return { force: false }
      }
    })()) as { force?: boolean }

    // Idempotency: if user already has a secret, return preview unless force=true
    const { data: existing, error: existingErr } = await admin
      .from('user_secrets')
      .select('id,last4')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existingErr) {
      console.error('Query error', existingErr)
      return new Response('Database error', { status: 500, headers: corsHeaders })
    }
    if (existing && !force) {
      return new Response(
        JSON.stringify({ created: false, preview: `••••${existing.last4}` }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (existing && force) {
      await admin.from('user_secrets').delete().eq('user_id', user.id)
    }

    // Generate secret: 32 bytes url-safe + prefix
    const token = randomBase64Url(32)
    const secret = `sk_live_${token}`
    const last6 = secret.slice(-6)

    // Store irreversible HMAC digest (server-only pepper)
    const digest = await hmacSHA256(secret, env.SECRET_PEPPER)

    const { error } = await admin.from('user_secrets').insert({
      user_id: user.id,
      secret_hash: digest,
      last4: last6.slice(-4),
    })
    if (error) {
      console.error('Insert error', error)
      return new Response('Database error', { status: 500, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ created: true, secret, preview: `••••${last6}` }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (e) {
    console.error(e)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})


