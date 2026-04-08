import { Bell, Bookmark, Copy, MessageSquare, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ModelDrawer } from '../components/models/ModelDrawer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { toast } from '../components/ui/Toast'
import { discoverFeed as fallbackFeed } from '../data/discoverFeed'
import { fallbackModels } from '../data/fallbackData'
import { discoverService } from '../services/discoverService'
import { modelService } from '../services/modelService'

const filterStyles = {
  reasoning: 'bg-[#f8e7e8] text-[#b45562] border-[#edc4ca]',
  multimodal: 'bg-[#e8f2fa] text-[#2f78a0] border-[#bed8eb]',
  alignment: 'bg-[#fff0ea] text-[#d27b42] border-[#f0cfb9]',
  efficiency: 'bg-[#f9efdc] text-[#a07a15] border-[#ead9a8]',
  'open-weights': 'bg-[#f7efdd] text-[#a07a15] border-[#ead9a8]',
}

const defaultSelectedId = 'constitutional-ai-v2'

function pillTone(topicLabel) {
  const key = topicLabel.toLowerCase().replace(/\s+/g, '-')
  return filterStyles[key] ?? 'bg-[#f7efe5] text-[#b26733] border-[#edc9ab]'
}

function loadSavedIds() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem('pf_discover_saved')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveIds(nextIds) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pf_discover_saved', JSON.stringify(nextIds))
}

function DiscoverFeedItem({ item, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full grid-cols-[48px_minmax(0,1fr)] gap-3 border-l-2 px-4 py-4 text-left transition sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-4 sm:px-5 ${
        isSelected
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-transparent hover:bg-[#fcf8f2]'
      }`}
    >
      <div className="text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b9a892]">
          {item.month}
        </div>
        <div className="display-font mt-1 text-[1.8rem] leading-none tracking-[-0.04em] text-[#17110d] sm:text-[2.1rem]">
          {item.day}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#a28f7a]">
          <span>{item.source}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${pillTone(item.topicLabel)}`}
          >
            {item.topicLabel}
          </span>
        </div>
        <div className="mt-2 text-[1.05rem] font-semibold leading-6 tracking-[-0.03em] text-[#17110d]">
          {item.title}
        </div>
        <div className="mt-2 line-clamp-3 text-sm leading-6 text-[#7a6a58]">{item.summary}</div>
      </div>
    </button>
  )
}

function DetailMetric({ value, label }) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-[#fcfaf7] px-4 py-4 text-center">
      <div className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[#2a231d]">{value}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[#b3a08b]">{label}</div>
    </div>
  )
}

export function DiscoverPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState([])
  const [feed, setFeed] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(defaultSelectedId)
  const [savedIds, setSavedIds] = useState(loadSavedIds)
  const [drawerModel, setDrawerModel] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = 'Discover New - PromptForge'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDiscoverData() {
      setIsLoading(true)
      try {
        const [filterData, feedData] = await Promise.all([
          discoverService.filters(),
          discoverService.feed(activeFilter),
        ])

        if (cancelled) return
        setFilters(filterData)
        setFeed(feedData)
      } catch {
        if (cancelled) return
        setFilters([
          { id: 'all', label: 'All' },
          { id: 'reasoning', label: 'Reasoning' },
          { id: 'multimodal', label: 'Multimodal' },
          { id: 'alignment', label: 'Alignment' },
          { id: 'efficiency', label: 'Efficiency' },
          { id: 'open-weights', label: 'Open Weights' },
        ])
        setFeed(
          activeFilter === 'all'
            ? fallbackFeed
            : fallbackFeed.filter((item) => {
                const topics = Array.isArray(item.topic) ? item.topic : [item.topic]
                return topics.includes(activeFilter)
              }),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDiscoverData()

    return () => {
      cancelled = true
    }
  }, [activeFilter])

  useEffect(() => {
    if (!feed.length) return

    const visible = feed.some((item) => item.id === selectedId)
    if (visible) return

    if (activeFilter === 'all') {
      const preferred = feed.find((item) => item.id === defaultSelectedId)
      setSelectedId(preferred?.id ?? feed[0].id)
      return
    }

    setSelectedId(feed[0].id)
  }, [activeFilter, feed, selectedId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const itemId = params.get('item')
    if (!itemId) return

    const matched = feed.find((item) => item.id === itemId)
    if (matched) {
      setSelectedId(matched.id)
    }
  }, [feed, location.search])

  const selectedItem = useMemo(
    () => feed.find((item) => item.id === selectedId) ?? feed[0] ?? null,
    [feed, selectedId],
  )

  const relatedModels = useMemo(() => {
    if (!selectedItem) return []

    return (selectedItem.relatedModelIds ?? [])
      .map((modelId) => fallbackModels.find((model) => model.modelId === modelId))
      .filter(Boolean)
  }, [selectedItem])

  async function openModel(modelId) {
    const fallbackModel = fallbackModels.find((model) => model.modelId === modelId)

    try {
      const model = await modelService.detail(modelId)
      setDrawerModel(model ?? fallbackModel ?? null)
    } catch {
      setDrawerModel(fallbackModel ?? null)
    }
  }

  function toggleSaved() {
    if (!selectedItem) return

    const isSaved = savedIds.includes(selectedItem.id)
    const nextIds = isSaved
      ? savedIds.filter((id) => id !== selectedItem.id)
      : [...savedIds, selectedItem.id]

    setSavedIds(nextIds)
    saveIds(nextIds)
    toast({
      title: isSaved ? 'Removed from saved' : 'Saved to your list',
      message: isSaved
        ? 'This research item was removed from your saved list.'
        : 'You can come back to this research item later.',
      type: 'success',
    })
  }

  async function copyCitation() {
    if (!selectedItem) return

    try {
      await navigator.clipboard.writeText(selectedItem.citation)
      toast({
        title: 'Citation copied',
        message: 'The paper citation is now on your clipboard.',
        type: 'success',
      })
    } catch {
      toast({
        title: 'Copy failed',
        message: 'Clipboard access was blocked in this browser.',
        type: 'error',
      })
    }
  }

  async function shareItem() {
    if (!selectedItem) return

    const shareUrl = `${window.location.origin}/discover?item=${selectedItem.id}`
    const shareText = `${selectedItem.title}\n${shareUrl}`

    try {
      await navigator.clipboard.writeText(shareText)
      toast({
        title: 'Share link copied',
        message: 'A shareable Discover link was copied to your clipboard.',
        type: 'success',
      })
    } catch {
      toast({
        title: 'Share failed',
        message: 'We could not copy the share link right now.',
        type: 'error',
      })
    }
  }

  function goToDiscuss() {
    if (!selectedItem) return

    navigate(`/discover/discuss?id=${selectedItem.id}`, {
      state: { feedItem: selectedItem },
    })
  }

  return (
    <PageWrapper className="mx-auto max-w-[1700px] px-4 py-4 lg:px-8 lg:py-6">
      <div className="flex min-h-[720px] flex-col overflow-hidden rounded-[26px] border border-black/8 bg-white shadow-[0_12px_30px_rgba(36,30,21,0.05)] lg:h-[calc(100vh-145px)]">
        <div className="border-b border-black/8 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display-font text-[clamp(1.8rem,7vw,2.1rem)] font-medium tracking-[-0.05em] text-[#17110d]">
                  AI Research Feed
                </h1>
                <span className="text-sm text-[#b2a08d]">Curated breakthroughs - Updated daily</span>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
              <div className="rounded-full border border-[#cbe9df] bg-[#effcf6] px-4 py-2 text-sm font-medium text-[#2f8a61]">
                {feed.length || 6} papers this week
              </div>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Research digest',
                    message: 'Weekly discover subscriptions will plug in here next.',
                  })
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#5a4f43] sm:w-auto"
              >
                <Bell className="h-4 w-4 text-[var(--accent)]" />
                Subscribe
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(filters.length ? filters : [
              { id: 'all', label: 'All' },
              { id: 'reasoning', label: 'Reasoning' },
              { id: 'multimodal', label: 'Multimodal' },
              { id: 'alignment', label: 'Alignment' },
              { id: 'efficiency', label: 'Efficiency' },
              { id: 'open-weights', label: 'Open Weights' },
            ]).map((filter) => {
              const isActive = activeFilter === filter.id

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-[#17110d] bg-[#17110d] text-white'
                      : 'border-black/10 bg-white text-[#5c5146] hover:border-[var(--accent)] hover:text-[#17110d]'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 xl:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="max-h-[360px] min-h-0 overflow-y-auto border-b border-black/8 bg-[#fbf7f1] xl:max-h-none xl:border-b-0 xl:border-r">
            {isLoading && !feed.length ? (
              <div className="px-5 py-6 text-sm text-[#8a7a68]">Loading research feed...</div>
            ) : (
              feed.map((item) => (
                <DiscoverFeedItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              ))
            )}
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden">
            {selectedItem ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                  <div className="space-y-5">
                    <div className="border-b border-black/8 pb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#9d8d7a]">
                        <span>{selectedItem.source}</span>
                        <span>-</span>
                        <span>{selectedItem.publishedDate}</span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${pillTone(selectedItem.topicLabel)}`}
                        >
                          {selectedItem.topicLabel}
                        </span>
                      </div>
                      <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#17110d]">
                        {selectedItem.title}
                      </h2>
                      <div className="mt-2 text-sm text-[#9d8d7a]">
                        {selectedItem.paperId} - {selectedItem.authors}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Overview
                      </div>
                      <p className="mt-3 text-[15px] leading-8 text-[#6c5f51]">{selectedItem.overview}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedItem.metrics.map((metric) => (
                        <DetailMetric key={metric.label} value={metric.value} label={metric.label} />
                      ))}
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Key Findings
                      </div>
                      <div className="mt-3 space-y-2">
                        {selectedItem.findings.map((finding, index) => (
                          <div
                            key={finding}
                            className="flex gap-4 rounded-[14px] border border-black/8 bg-[#fcfaf7] px-4 py-3"
                          >
                            <span className="text-sm font-semibold text-[var(--accent)]">{index + 1}</span>
                            <span className="text-sm leading-7 text-[#64584b]">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Models Referenced
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {relatedModels.map((model) => (
                          <button
                            key={model.modelId}
                            type="button"
                            onClick={() => openModel(model.modelId)}
                            className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-[#5d5146] transition hover:border-[var(--accent)] hover:text-[#17110d]"
                          >
                            {model.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Impact Assessment
                      </div>
                      <div className="mt-3 rounded-[16px] border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-4 text-sm leading-7 text-[#7a5d43]">
                        <span className="font-semibold text-[#b4632b]">{selectedItem.impact.level}</span> -{' '}
                        {selectedItem.impact.text}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                          Citation
                        </div>
                        <button
                          type="button"
                          onClick={copyCitation}
                          className="inline-flex items-center gap-2 rounded-[10px] border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#7f6d5c]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                      <div className="rounded-[16px] border border-black/8 bg-[#fcfaf7] px-4 py-4 text-sm leading-7 text-[#6f6254]">
                        {selectedItem.citation}
                        <div className="mt-3">
                          <a
                            href={selectedItem.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--accent)] underline-offset-4 hover:underline"
                          >
                            {selectedItem.paperId}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-black/8 bg-white px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={goToDiscuss}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-4 text-sm font-medium text-white shadow-[0_12px_26px_rgba(var(--accent-rgb),0.2)] sm:min-w-[260px] sm:flex-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Discuss in Chat Hub
                    </button>
                    <button
                      type="button"
                      onClick={toggleSaved}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#5a4f43] sm:w-auto"
                    >
                      <Bookmark className="h-4 w-4" />
                      {savedIds.includes(selectedItem.id) ? 'Saved' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={shareItem}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#5a4f43] sm:w-auto"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-sm text-[#8a7a68]">
                No research items are available for this filter yet.
              </div>
            )}
          </section>
        </div>
      </div>

      <ModelDrawer
        isOpen={Boolean(drawerModel)}
        onClose={() => setDrawerModel(null)}
        model={drawerModel}
        hideHeaderActions
      />
    </PageWrapper>
  )
}

