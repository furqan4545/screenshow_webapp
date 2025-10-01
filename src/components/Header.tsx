import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header className={[
      'sticky top-4 z-50 w-full',
      'transition-all duration-300',
      isScrolled ? 'translate-y-0' : 'translate-y-0',
      'pointer-events-none',
    ].join(' ')}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pointer-events-auto">
        <div className={[
          'rounded-full p-[1px]',
          'bg-[linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06)_35%,transparent_80%)]',
          'shadow-[0_20px_50px_-20px_rgba(0,0,0,.7)]',
        ].join(' ')}>
          <div
            className={[
              'rounded-full border border-white/10 backdrop-blur',
              'bg-black/55 supports-[backdrop-filter]:bg-black/40',
              'transition-all duration-300',
              isScrolled ? 'py-1.5' : 'py-2.5',
            ].join(' ')}
          >
            <div
              className={[
                'mx-auto flex w-full items-center justify-between',
                'px-4',
                'transition-all duration-300',
                isScrolled ? 'gap-4' : 'gap-10',
              ].join(' ')}
            >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/LOGO_LARGE.png"
            alt="Screenshow logo"
            className={[ 'rounded-md object-contain', isScrolled ? 'h-7 w-7' : 'h-9 w-9' ].join(' ')}
          />
          <span
            className={[
              'font-semibold tracking-tight text-white',
              'transition-[font-size,opacity] duration-300',
              isScrolled ? 'text-base' : 'text-xl',
            ].join(' ')}
          >
            Screenshow
          </span>
        </Link>

        {/* Nav */}
        <nav
          className={[
            'hidden md:flex items-center',
            'transition-all duration-300',
            isScrolled ? 'gap-6' : 'gap-12',
          ].join(' ')}
        >
          <Link to="/" className="text-white/80 hover:text-white transition-colors">
            Home
          </Link>
          <a href="#how" className="text-white/80 hover:text-white transition-colors">
            How it Works
          </a>
          <a href="#features" className="text-white/80 hover:text-white transition-colors">
            Features
          </a>
          <a href="/pricing" className="text-white/80 hover:text-white transition-colors">
            Pricing
          </a>
        </nav>

        {/* Right actions */}
        <div className={['flex items-center', isScrolled ? 'gap-2' : 'gap-3'].join(' ')}>
          {user ? (
            <button
              className={[
                'rounded-full border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/5',
                'transition-all duration-300',
              ].join(' ')}
              onClick={async () => {
                await signOut()
                window.location.assign('/')
              }}
            >
              Sign out
            </button>
          ) : (
            <button
              id="try-button"
              className={[
                'rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-500',
                'transition-all duration-300',
                isScrolled ? 'px-4 py-2 text-sm' : 'px-5 py-2.5 text-sm',
              ].join(' ')}
              onClick={() => void signInWithGoogle()}
            >
              Try for free
            </button>
          )}
        </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
