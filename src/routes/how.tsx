import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/how')({
  component: HowPage,
})

function HowPage() {
  return (
    <main className="relative min-h-[70vh] bg-[#0b0d12] text-white">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_40%_at_50%_0%,rgba(37,99,235,.25),transparent_60%)]" />
      <section className="mx-auto grid min-h-[70vh] w-full max-w-6xl place-items-center px-4 py-16 sm:px-6 text-center">
        <div className="space-y-4">
          <div className="text-8xl">🥹</div>
          <h1 className="text-3xl font-semibold">I’m working on this page</h1>
          <p className="text-white/70">It will be updated soon. Thanks for your patience!</p>
        </div>
      </section>
    </main>
  )
}


