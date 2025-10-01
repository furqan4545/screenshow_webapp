import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthProvider'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      throw redirect({ to: '/dashboard' })
    }
    return null
  },
  component: App,
})

function App() {
  const { signInWithGoogle } = useAuth()
  return (
    <main className="relative overflow-hidden bg-[#0b0d12] text-white">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_40%_at_50%_0%,rgba(37,99,235,.25),transparent_60%)]" />

      <section className="mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-6 text-center gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Introducing next gen screen recorder
        </div>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          <span className="text-white/90">Break the status quo,</span>
          <br />
          <span className="text-white/80">Turn dull demos into dazzle</span>
        </h1>
        <p className="max-w-2xl text-white/70">
          Ever watch a screen recording and yawn? Yeah, me too. But ScreenShow fixes that. Don't believe me? download and try yourself. It's the future of screen recorded videos.
        </p>
        <div className="flex items-center gap-3">
          <a href="/download" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500">Download</a>
          <button onClick={() => void signInWithGoogle()} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5">Log in</button>
        </div>
      </section>

      {/* Video placeholder */}
      <section className="relative mx-auto mb-24 mt-4 w-full max-w-6xl px-4 sm:px-6">
        <div className="relative rounded-3xl p-[1px] [background:linear-gradient(140deg,rgba(37,99,235,.8),rgba(99,102,241,.6),transparent_60%)]">
          <div className="relative rounded-3xl bg-black/70">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0f1117]">
                {/* Play button */}
                <button
                  aria-label="Play placeholder"
                  className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 shadow-lg transition-transform group-active:scale-95">
                    <span className="ml-0.5 inline-block text-white">▶</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by section */}
      <section className="relative mx-auto mb-28 w-full max-w-6xl px-4 sm:px-6 text-center">
        <p className="mb-8 text-sm text-white/60">Trusted by fast‑growing startups</p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex flex-col items-center gap-3 text-white/80">
            <div className="text-5xl">😭</div>
            <p>They haven't provided me their logo yet, it will be updated in next 48 hours.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
