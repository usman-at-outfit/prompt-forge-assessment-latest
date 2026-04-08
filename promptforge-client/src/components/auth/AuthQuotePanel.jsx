import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { Card } from '../ui/Card'

const DEFAULT_QUOTES = [
  'The best prompt is not louder, just clearer.',
  'A curious question can unlock more than a perfect command.',
  'Good AI feels less like magic and more like momentum.',
  'Automation shines brightest when it gives human creativity room to breathe.',
]

function getNextIndex(currentIndex, length) {
  return (currentIndex + 1) % length
}

export function AuthQuotePanel({
  className,
  eyebrow = 'AI Quotes',
  title = 'A softer screen for bigger ideas',
  description = 'A few machine-age thoughts drift by while you sign in.',
  quotes = DEFAULT_QUOTES,
}) {
  const shouldReduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (quotes.length < 2 || isHovered) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => getNextIndex(currentIndex, quotes.length))
    }, 5200)

    return () => window.clearInterval(interval)
  }, [isHovered, quotes.length])

  return (
    <Card
      className={clsx(
        'relative hidden min-h-[29rem] overflow-hidden border-[var(--accent)]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,245,240,0.92))] lg:flex',
        className,
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-[rgba(var(--accent-rgb),0.16)] blur-3xl" />
      <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-white/80 blur-3xl" />

      <div className="relative flex w-full flex-col justify-between gap-8">
        <div className="space-y-4">
          <div className="accent-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
            <Sparkles size={14} />
            {eyebrow}
          </div>
          <div className="display-font max-w-sm text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-[0.95]">
            {title}
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>

        <div className="rounded-[calc(var(--radius-lg)-8px)] border border-white/70 bg-white/75 p-6 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="mb-5 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
            <span>Machine Thought</span>
            <span>
              {String(activeIndex + 1).padStart(2, '0')} / {String(quotes.length).padStart(2, '0')}
            </span>
          </div>

          <div className="min-h-[11rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={quotes[activeIndex]}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -18 }}
                transition={{ duration: shouldReduceMotion ? 0.12 : 0.42, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div className="display-font text-5xl leading-none text-[rgba(var(--accent-rgb),0.22)]">
                  "
                </div>
                <p className="display-font text-[1.55rem] leading-tight text-[var(--text-primary)]">
                  {quotes[activeIndex]}
                </p>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-xs text-[var(--text-secondary)]">
              {isHovered ? 'Paused while you hover.' : 'Rotates every few seconds.'}
            </div>
            <div className="flex items-center gap-2">
              {quotes.map((quote, index) => (
                <button
                  key={quote}
                  type="button"
                  aria-label={`Show quote ${index + 1}`}
                  aria-pressed={activeIndex === index}
                  onClick={() => setActiveIndex(index)}
                  className={clsx(
                    'h-2.5 rounded-full transition-all duration-200',
                    activeIndex === index
                      ? 'w-8 bg-[var(--accent)]'
                      : 'w-2.5 bg-[rgba(var(--accent-rgb),0.22)] hover:bg-[rgba(var(--accent-rgb),0.46)]',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
