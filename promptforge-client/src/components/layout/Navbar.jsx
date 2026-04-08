import {
  Bot,
  ArrowRight,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  MessageSquareText,
  Sparkles,
  Store,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { languageOptions, translate } from '../../data/i18n'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { useTokenStore } from '../../store/tokenStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function formatTokens(value) {
  const amount = Number(value ?? 0)
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
  return `${amount}`
}

function getUserInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'PF'
  )
}

export function Navbar() {
  const location = useLocation()
  const isMarketingPage = ['/', '/marketplace', '/discover'].includes(location.pathname)
  const isLandingPage = location.pathname === '/'
  const localeMenuRef = useRef(null)
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const isGuest = useAuthStore((state) => state.isGuest)
  const totalTokens = useTokenStore((state) => state.totalTokens)
  const logout = useAuthStore((state) => state.actions.logout)
  const locale = useLanguageStore((state) => state.locale)
  const setLocale = useLanguageStore((state) => state.actions.setLocale)
  const isLoggedIn = Boolean(user)
  const userInitials = useMemo(() => getUserInitials(user?.name), [user?.name])

  const navItems = useMemo(
    () => [
      { to: '/hub', label: translate(locale, 'nav.chatHub', 'Chat Hub'), icon: MessageSquareText },
      { to: '/marketplace', label: translate(locale, 'nav.marketplace', 'Marketplace'), icon: Store },
      {
        to: '/agents',
        label: translate(locale, 'nav.agents', 'Agents'),
        icon: Bot,
        requiresAuth: true,
      },
      { to: '/discover', label: translate(locale, 'nav.discover', 'Discover New'), icon: Sparkles },
    ],
    [locale],
  )

  const activeLanguage = languageOptions.find((entry) => entry.code === locale) ?? languageOptions[0]

  useEffect(() => {
    setIsLocaleMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!localeMenuRef.current?.contains(event.target)) {
        setIsLocaleMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-[1100] border-b border-[var(--border)] bg-[rgba(251,247,239,0.92)] text-[var(--text-primary)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="icon-badge h-10 w-10 rounded-2xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="brand-font truncate text-lg font-semibold sm:text-xl">PromptForge</div>
              <div className="hidden text-xs text-[var(--text-muted)] lg:block">
                {translate(locale, 'nav.tagline', 'AI model discovery and prompt building')}
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const requiresLogin = item.requiresAuth && !isLoggedIn
              const target = requiresLogin ? '/login' : item.to
              const navState = requiresLogin ? { from: item.to } : undefined

              return (
                <NavLink
                  key={item.to}
                  to={target}
                  state={navState}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                      isActive
                        ? 'active-glow border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent-hover)]'
                        : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[rgba(255,253,248,0.8)] hover:text-[var(--text-primary)]'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div ref={localeMenuRef} className="relative">
            <Button
              type="button"
              variant="secondary"
              className="items-center gap-2 !rounded-full !border-[var(--border)] !bg-[rgba(255,253,248,0.92)] !px-3 !text-[var(--text-primary)]"
              onClick={() => setIsLocaleMenuOpen((value) => !value)}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{activeLanguage.label}</span>
              <span className="sm:hidden">{activeLanguage.prefix}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </Button>
            {isLocaleMenuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-3 w-[min(240px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[rgba(255,253,248,0.98)] shadow-[var(--shadow-card)]">
                <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  {translate(locale, 'nav.appLanguage', 'App Language')}
                </div>
                <div className="max-h-[420px] overflow-y-auto py-1">
                  {languageOptions.map((entry) => (
                    <button
                      key={entry.code}
                      type="button"
                      onClick={() => {
                        setLocale(entry.code)
                        setIsLocaleMenuOpen(false)
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        entry.code === locale
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className={`w-7 shrink-0 text-[11px] font-semibold uppercase ${entry.code === locale ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                        {entry.prefix}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{entry.nativeName}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {isLoggedIn ? (
            <>
              <Badge variant="token" className="hidden sm:inline-flex">
                #{formatTokens(totalTokens)} tok
              </Badge>
              <Button
                as={Link}
                to="/settings"
                variant="secondary"
                size="sm"
                className="!rounded-full !border-[var(--border)] !bg-[rgba(255,253,248,0.96)] !pl-2 !pr-3 !shadow-none"
              >
                <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent)]">
                  {userInitials}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                </span>
                <span className="hidden max-w-[9rem] truncate sm:inline">{user.name}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="!rounded-full !px-3 !text-[var(--text-primary)]"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{translate(locale, 'nav.signOut', 'Sign out')}</span>
              </Button>
            </>
          ) : isMarketingPage ? (
            <>
              <Button
                as={Link}
                to="/login"
                variant="ghost"
                className="hidden md:flex !rounded-full !text-[var(--text-primary)]"
              >
                {translate(locale, 'nav.signIn', 'Sign in')}
              </Button>
              <Button as={Link} to="/register" className="hidden md:flex !rounded-full !px-5">
                {isLandingPage
                  ? translate(locale, 'nav.getStarted', 'Get Started')
                  : translate(locale, 'nav.tryFree', 'Try free')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Badge variant="token">#{formatTokens(totalTokens)} tok</Badge>
              {isGuest ? (
                <Badge variant="category">{translate(locale, 'nav.guestSession', 'Guest Session')}</Badge>
              ) : null}
              <Button as={Link} to="/login" variant="ghost" className="hidden md:flex !rounded-full">
                {translate(locale, 'nav.login', 'Login')}
              </Button>
            </>
          )}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,253,248,0.92)] text-[var(--text-secondary)] lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
