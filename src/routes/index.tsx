import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '../lib/supabaseClient'

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
  return (
    <main className="relative overflow-hidden bg-[#0b0d12] text-white">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_40%_at_50%_0%,rgba(37,99,235,.25),transparent_60%)]" />

      <section className="mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-6 text-center gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Introducing custom automations
        </div>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Meet your AI Agent
          <br />
          <span className="text-white/80">Streamline your workflow</span>
        </h1>
        <p className="max-w-2xl text-white/70">
          AI assistant designed to streamline your digital workflows and handle mundane
          tasks, so you can focus on what truly matters.
        </p>
        <div className="flex items-center gap-3">
          <a href="#try" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500">Try for Free</a>
          <a href="#login" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5">Log in</a>
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mx-auto grid w-max grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              'OpenAI',
              'Retool',
              'Stripe',
              'Wise',
              'Loom',
              'Medium',
              'Cash App',
              'Linear',
            ].map((brand) => (
              <div
                key={brand}
                className="flex items-center justify-center rounded-xl border border-white/5 bg-black/20 px-4 py-6 text-white/80"
              >
                <span className="text-lg sm:text-xl">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
