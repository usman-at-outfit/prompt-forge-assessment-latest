import { ArrowRight, Handshake, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { agentTemplateIcons } from '../../data/agentGuideData'

const chipToneByTemplate = {
  'research-agent': 'bg-[#edf8f6] text-[#157b68] border-[#b9e6dc]',
  'customer-support': 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-strong)]',
  'code-review': 'bg-[#eef4ff] text-[#4467c8] border-[#cbd9ff]',
  'data-analysis': 'bg-[#eef9f1] text-[#2c8b59] border-[#cce9d4]',
  'content-writer': 'bg-[#fff0f7] text-[#bf4c80] border-[#efc7da]',
  'sales-outreach': 'bg-[#fff6ea] text-[#c47223] border-[#f2d4ae]',
  'custom-agent': 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-strong)]',
}

export function AgentTemplateCard({ template, onUse }) {
  const Icon = agentTemplateIcons[template.icon] ?? (template.id === 'sales-outreach' ? Handshake : Plus)
  const isScratch = template.id === 'custom-agent'
  const chipTone = chipToneByTemplate[template.id] ?? chipToneByTemplate['custom-agent']

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      onClick={() => onUse(template)}
      className={`group flex h-full min-h-[152px] flex-col rounded-[22px] border text-left transition sm:min-h-[162px] ${
        isScratch
          ? 'items-center justify-center border-dashed border-[var(--border-strong)] bg-[var(--accent-soft)] px-6 py-7 hover:border-[#d79c6c] hover:bg-[#fffaf6]'
          : 'border-black/8 bg-white px-5 py-5 shadow-[0_10px_22px_rgba(36,30,21,0.05)] hover:border-[var(--border-strong)] hover:shadow-[0_18px_34px_rgba(var(--accent-rgb),0.1)]'
      }`}
    >
      <div
        className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] ${
          isScratch ? 'bg-white text-[var(--accent)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="display-font mt-4 text-[clamp(1.55rem,6vw,1.8rem)] leading-[0.95] font-medium tracking-[-0.05em] text-[#18120d]">
        {template.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-[14px] leading-7 text-[#6f604f]">{template.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(template.modelTags ?? []).map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-3 py-1 text-xs ${chipTone}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        className={`mt-auto flex items-center gap-2 pt-5 text-sm font-medium ${
          isScratch ? 'text-[var(--accent)]' : 'text-[var(--accent)]'
        }`}
      >
        {isScratch ? 'Start building' : 'Use template'}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  )
}

