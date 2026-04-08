import { ArrowRight, Star } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function ModelCard({
  model,
  selected = false,
  tone = 'dark',
  onSelect,
  onDetails,
}) {
  if (!model) return null

  const isLight = tone === 'light'
  const displayTags = (model.tags?.length ? model.tags : model.category ?? []).slice(0, 4)
  const statusLabel = model.isOpenSource
    ? 'Open'
    : model.isTrending
      ? 'Hot'
      : model.isFeatured
        ? 'New'
        : null
  const reviewCount = Number(model.reviewCount ?? 0).toLocaleString()
  const priceLabel =
    model.isFree || (Number(model.inputPricePer1M ?? 0) === 0 && Number(model.outputPricePer1M ?? 0) === 0)
      ? model.isOpenSource
        ? 'Free (self-host)'
        : 'Free'
      : `$${Number(model.inputPricePer1M ?? 0).toFixed(Number(model.inputPricePer1M ?? 0) >= 1 ? 0 : 2)}/1M`

  return (
    <Card
      onClick={() => onSelect?.(model)}
      className={`flex h-full flex-col gap-4 ${
        isLight
          ? selected
            ? '!border-[var(--border-strong)] !bg-[var(--accent-soft)] !shadow-[0_18px_40px_rgba(var(--accent-rgb),0.14)] text-[#111]'
            : '!border-black/10 !bg-white !shadow-[0_10px_30px_rgba(16,24,40,0.04)] text-[#111]'
          : `${selected ? 'active-glow border-[var(--accent)] bg-[var(--accent-muted)]/20' : ''}`
      } ${isLight ? 'cursor-pointer overflow-hidden rounded-[28px] p-5' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="icon-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold">
            {model.labIcon || model.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[1.05rem] font-medium">{model.name}</h3>
            <p
              className={`mt-1 text-sm ${
                isLight ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {model.lab}
            </p>
          </div>
        </div>
        {statusLabel ? (
          <Badge
            variant="status"
            className={
              isLight
                ? '!border-0 !bg-[var(--accent-soft)] !px-2.5 !py-1 !text-[var(--accent)]'
                : ''
            }
          >
            {statusLabel}
          </Badge>
        ) : null}
      </div>
      <p
        className={`min-h-[72px] text-[15px] leading-7 sm:min-h-[84px] sm:leading-8 ${
          isLight ? 'text-[#645847]' : 'text-[var(--text-secondary)]'
        }`}
      >
        {model.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {displayTags.map((entry) => (
          <Badge
            key={entry}
            className={isLight ? '!bg-[var(--accent-soft)] !text-[var(--accent)]' : ''}
          >
            {entry}
          </Badge>
        ))}
      </div>
      <div className="mt-auto border-t border-black/8 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
          <div className="min-w-0 flex items-start gap-2 text-[#6d6255]">
            <div className="mt-0.5 flex items-center gap-0.5 text-[var(--accent)]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-3.5 w-3.5 fill-current stroke-current" />
              ))}
            </div>
            <div>
              <div className="leading-5">
                {model.rating}{' '}
                <span className="text-[#8f7e6a]">({reviewCount})</span>
              </div>
            </div>
          </div>
          <div className="ml-auto flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <div className="font-medium text-emerald-700">{priceLabel} tk</div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onDetails?.(model, 'how-to-use')
              }}
              className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
            >
              How to Use
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

