import {
  BookOpen,
  ClipboardList,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ModelCard } from '../components/models/ModelCard'
import { ModelDrawer } from '../components/models/ModelDrawer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { useModelStore } from '../store/modelStore'

const categoryTabs = [
  { value: '', label: 'All' },
  { value: 'language', label: 'Language' },
  { value: 'vision', label: 'Vision' },
  { value: 'code', label: 'Code' },
  { value: 'image-gen', label: 'Image Gen' },
  { value: 'audio', label: 'Audio' },
  { value: 'open-source', label: 'Open Source' },
]

const pricingLabels = ['Pay-per-use', 'Subscription', 'Free tier', 'Enterprise']
const licenseLabels = ['Commercial', 'Open Source', 'Research only']
const quickGuideButtons = [
  {
    label: 'Prompt engineering tips',
    icon: Wand2,
    tab: 'prompt-guide',
  },
  {
    label: 'Agent creation guide',
    icon: BookOpen,
    tab: 'agent-creation',
  },
  {
    label: 'Pricing comparison',
    icon: ClipboardList,
    tab: 'pricing',
  },
]

export function MarketplacePage() {
  const [drawerModel, setDrawerModel] = useState(null)
  const [drawerTab, setDrawerTab] = useState('overview')

  const allModels = useModelStore((state) => state.allModels)
  const filteredModels = useModelStore((state) => state.filteredModels)
  const selectedModel = useModelStore((state) => state.selectedModel)
  const filters = useModelStore((state) => state.filters)
  const labs = useModelStore((state) => state.labs)
  const loadModels = useModelStore((state) => state.actions.loadModels)
  const loadLabs = useModelStore((state) => state.actions.loadLabs)
  const setFilter = useModelStore((state) => state.actions.setFilter)
  const toggleListFilter = useModelStore((state) => state.actions.toggleListFilter)
  const clearFilters = useModelStore((state) => state.actions.clearFilters)
  const selectModel = useModelStore((state) => state.actions.selectModel)

  const visibleModels = useMemo(
    () => (filteredModels.length ? filteredModels : allModels),
    [allModels, filteredModels],
  )

  const activeModel = selectedModel ?? visibleModels[0] ?? null

  useEffect(() => {
    loadModels()
    loadLabs()
  }, [loadLabs, loadModels])

  useEffect(() => {
    if (!visibleModels.length) {
      if (selectedModel) selectModel(null)
      return
    }

    if (!selectedModel || !visibleModels.some((entry) => entry.modelId === selectedModel.modelId)) {
      selectModel(visibleModels[0])
    }
  }, [selectModel, selectedModel, visibleModels])

  function openDrawer(model, tab = 'overview') {
    if (!model) return
    selectModel(model)
    setDrawerModel(model)
    setDrawerTab(tab)
  }

  const allLabsCount =
    labs.length > 0
      ? labs.reduce((sum, lab) => sum + (lab.count ?? 0), 0)
      : allModels.length

  useEffect(() => {
    document.title = 'Marketplace - PromptForge'
  }, [])

  return (
    <PageWrapper className="mx-auto min-h-[calc(100vh-89px)] max-w-[1600px] bg-[#f7f2eb] px-4 py-4 lg:px-8">
      <div className="mb-4 flex flex-col items-stretch gap-4 xl:flex-row xl:flex-nowrap xl:items-center">
        <h1 className="display-font shrink-0 text-3xl font-medium tracking-[-0.04em] text-[#111]">
          Model Marketplace
        </h1>
        <div className="flex w-full items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white px-4 py-2.5 shadow-[0_10px_30px_rgba(16,24,40,0.03)] sm:max-w-[380px]">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search models, capabilities..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#111] outline-none placeholder:text-[var(--text-muted)]"
            value={filters.search}
            onChange={(event) => setFilter('search', event.target.value)}
          />
        </div>

        <div className="flex flex-1 flex-wrap gap-2">
          {categoryTabs.map((tab) => {
            const isActive = filters.category === tab.value
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => setFilter('category', tab.value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isActive
                  ? 'border-[var(--border-strong)] bg-[var(--accent-soft)] text-[#111]'
                  : 'border-black/10 bg-white text-[#6f5f4d] hover:border-[var(--border-strong)] hover:text-[#111]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 overflow-x-auto border-y border-black/8 py-3">
        <button
          type="button"
          onClick={() => {
            setFilter('lab', '')
            setFilter('labs', [])
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            !filters.labs.length && !filters.lab
              ? 'border-[var(--border-strong)] bg-[var(--accent)] text-white'
              : 'border-black/10 bg-white text-[#6f5f4d] hover:border-[var(--border-strong)] hover:text-[#111]'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          All Labs ({allLabsCount})
        </button>
        {labs.map((lab) => {
          const isActive = filters.labs.includes(lab.lab) || filters.lab === lab.lab
          return (
            <button
              key={lab.lab}
              type="button"
              onClick={() => toggleListFilter('labs', lab.lab)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isActive
                  ? 'border-[var(--border-strong)] bg-white text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.06)]'
                  : 'border-black/10 bg-[#f8f3ed] text-[#6f5f4d] hover:border-[var(--border-strong)] hover:text-[#111]'
              }`}
            >
              {lab.lab} ({lab.count})
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(16,24,40,0.04)] xl:sticky xl:top-24">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            AI Labs
          </div>

          <div className="space-y-5">
            <div className="rounded-[20px] border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4">
              <div className="text-sm font-semibold text-[var(--accent)]">Need help choosing?</div>
              <p className="mt-2 text-sm leading-6 text-[#7b6d5c]">
                Chat with our AI guide for a personalized recommendation in 60 seconds.
              </p>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Provider
              </div>
              <div className="space-y-2 text-sm text-[#3b342b]">
                {labs.map((lab) => (
                  <label key={lab.lab} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.labs.includes(lab.lab)}
                      onChange={() => toggleListFilter('labs', lab.lab)}
                      className="h-4 w-4 rounded border-black/20 accent-[var(--accent)]"
                    />
                    <span>{lab.lab}</span>
                    <span className="text-[#9b8b78]">({lab.count})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Pricing model
              </div>
              <div className="space-y-2 text-sm text-[#3b342b]">
                {pricingLabels.map((label) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.pricingModels.includes(label)}
                      onChange={() => toggleListFilter('pricingModels', label)}
                      className="h-4 w-4 rounded border-black/20 accent-[var(--accent)]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Max price /1M tokens
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.maxPrice ?? 100}
                onChange={(event) => setFilter('maxPrice', Number(event.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="mt-2 text-sm text-[#7b6d5c]">
                Up to ${filters.maxPrice ?? 100}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Min rating
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: null, label: 'Any' },
                  { value: 4, label: '4+' },
                  { value: 4.5, label: '4.5+' },
                ].map((item) => {
                  const isActive =
                    filters.minRating == null ? item.value == null : filters.minRating === item.value
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setFilter('minRating', item.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        isActive
                          ? 'border-[var(--border-strong)] bg-[var(--accent-soft)] text-[#111]'
                          : 'border-black/10 bg-white text-[#6f5f4d] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Licence
              </div>
              <div className="space-y-2 text-sm text-[#3b342b]">
                {licenseLabels.map((label) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.licenses.includes(label)}
                      onChange={() => toggleListFilter('licenses', label)}
                      className="h-4 w-4 rounded border-black/20 accent-[var(--accent)]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Quick guides
              </div>
              <div className="space-y-2">
                {quickGuideButtons.map((guide) => {
                  const Icon = guide.icon
                  return (
                    <button
                      key={guide.label}
                      type="button"
                      onClick={() => {
                        if (!activeModel) return
                        openDrawer(activeModel, guide.tab)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-sm text-[#3b342b] transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
                    >
                      <Icon className="h-4 w-4 text-[var(--accent)]" />
                      <span>{guide.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full !border-black/10 !bg-[#faf7f2] !text-[#111]"
              onClick={() => {
                clearFilters()
              }}
            >
              Clear all filters
            </Button>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleModels.map((model) => (
              <ModelCard
                key={model.modelId}
                model={model}
                tone="light"
                selected={activeModel?.modelId === model.modelId}
                onSelect={(nextModel) => openDrawer(nextModel, 'overview')}
                onDetails={(nextModel, tab) => openDrawer(nextModel, tab ?? 'overview')}
              />
            ))}
          </div>
        </main>
      </div>

      <ModelDrawer
        isOpen={Boolean(drawerModel)}
        onClose={() => setDrawerModel(null)}
        model={drawerModel}
        initialTab={drawerTab}
        hideHeaderActions
      />
    </PageWrapper>
  )
}



