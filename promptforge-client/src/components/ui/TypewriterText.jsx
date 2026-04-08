import { useEffect, useState } from 'react'

export function TypewriterText({ text = '' }) {
  const [visibleText, setVisibleText] = useState('')

  useEffect(() => {
    setVisibleText('')
    let index = 0
    const interval = window.setInterval(() => {
      index += 1
      setVisibleText(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(interval)
      }
    }, 18)

    return () => window.clearInterval(interval)
  }, [text])

  return (
    <pre className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]">
      {visibleText}
      <span className="animate-pulse text-[var(--accent)]">|</span>
    </pre>
  )
}
