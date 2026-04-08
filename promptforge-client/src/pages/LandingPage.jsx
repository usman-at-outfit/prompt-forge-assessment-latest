import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Bot,
  Code2,
  Globe2,
  Image as ImageIcon,
  Mic,
  Monitor,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Square,
  Upload,
  Users,
  Video,
  Wand2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CompareModal } from '../components/models/CompareModal'
import { ModelDrawer } from '../components/models/ModelDrawer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { toast } from '../components/ui/Toast'
import { fallbackModels } from '../data/fallbackData'
import { translate, translations } from '../data/i18n'
import { modelService } from '../services/modelService'
import { queuePendingComposer, runChatAction } from '../store/chatStore'
import { useLanguageStore } from '../store/languageStore'
import { useModelStore } from '../store/modelStore'
import {
  formatInputFileSize,
  mergeInputFiles,
  startMediaCapture,
} from '../utils/mediaInput'

const quickActions = [
  { icon: ImageIcon, label: 'Create image', useCase: 'create-images', entryMessage: 'Create an image for me', followUp: 'Create a campaign-ready image concept.' },
  { icon: Mic, label: 'Generate Audio', useCase: 'just-exploring', entryMessage: 'Generate audio for me', followUp: 'Generate a podcast intro or short audio clip.' },
  { icon: Sparkles, label: 'Create video', useCase: 'just-exploring', entryMessage: 'Create a video for me', followUp: 'Create a short product video workflow.' },
  { icon: BarChart3, label: 'Create slides', useCase: 'write-content', entryMessage: 'Create slides for me', followUp: 'Create a polished slide outline for a launch deck.' },
  { icon: BarChart3, label: 'Create Infographs', useCase: 'analyse-data', entryMessage: 'Create infographics for me', followUp: 'Turn a data story into an infographic concept.' },
  { icon: BookOpen, label: 'Create quiz', useCase: 'just-exploring', entryMessage: 'Create a quiz for me', followUp: 'Create a short quiz for learners.' },
  { icon: BookOpen, label: 'Create Flashcards', useCase: 'just-exploring', entryMessage: 'Create flashcards for me', followUp: 'Create flashcards from a lesson or document.' },
  { icon: Sparkles, label: 'Create Mind map', useCase: 'build-something', entryMessage: 'Create a mind map for me', followUp: 'Create a mind map for a project idea.' },
  { icon: BarChart3, label: 'Analyze Data', useCase: 'analyse-data', entryMessage: 'Analyze data for me', followUp: 'Analyze a dashboard or spreadsheet.' },
  { icon: Wand2, label: 'Write content', useCase: 'write-content', entryMessage: 'Write content for me', followUp: 'Draft a product launch email.' },
  { icon: Code2, label: 'Code Generation', useCase: 'build-something', entryMessage: 'Generate code for me', followUp: 'Generate production-ready code for a new feature.' },
  { icon: BookOpen, label: 'Document Analysis', useCase: 'analyse-data', entryMessage: 'Analyze this document for me', followUp: 'Analyze a policy, contract, or long report.' },
  { icon: Globe2, label: 'Translate', useCase: 'just-exploring', entryMessage: 'Translate this for me', followUp: 'Translate text for a global audience.' },
  { icon: Search, label: 'Just Exploring', useCase: 'just-exploring', entryMessage: 'Help me explore what is possible', followUp: 'Show me what I can do with PromptForge.' },
]

const landingSuggestionGroups = [
  {
    id: 'recruiting',
    label: 'Recruiting',
    icon: Users,
    prompts: [
      { icon: Users, text: 'Write a recruiting brief for a senior frontend engineer' },
      { icon: Search, text: 'Source the best AI tools to screen applicants fairly' },
      { icon: Wand2, text: 'Draft an outreach message for high-potential candidates' },
      { icon: BookOpen, text: 'Summarise interview feedback into one hiring recommendation' },
      { icon: BarChart3, text: 'Compare candidate scorecards across the hiring pipeline' },
    ],
  },
  {
    id: 'prototype',
    label: 'Create a prototype',
    icon: Code2,
    prompts: [
      { icon: Code2, text: 'Turn a rough product idea into a clickable MVP plan' },
      { icon: Sparkles, text: 'Design a prototype flow for a new mobile onboarding journey' },
      { icon: ImageIcon, text: 'Generate interface ideas for a dashboard concept' },
      { icon: Bot, text: 'Map the prompts and model choices for a prototype AI assistant' },
      { icon: BookOpen, text: 'Create a short product requirements brief for the prototype' },
    ],
  },
  {
    id: 'business',
    label: 'Build a business',
    icon: Briefcase,
    prompts: [
      { icon: Briefcase, text: 'Draft a lean business plan for an AI product idea' },
      { icon: BarChart3, text: 'Model pricing tiers and margins for a SaaS launch' },
      { icon: Search, text: 'Research competitors and market gaps in my niche' },
      { icon: Wand2, text: 'Write landing-page copy for a new startup concept' },
      { icon: BookOpen, text: 'Summarise the risks, assumptions, and next milestones' },
    ],
  },
  {
    id: 'learning',
    label: 'Help me learn',
    icon: BookOpen,
    prompts: [
      { icon: BookOpen, text: 'Explain retrieval-augmented generation in plain English' },
      { icon: Sparkles, text: 'Teach me prompt engineering from beginner to advanced' },
      { icon: Code2, text: 'Walk me through how AI agents use tools and memory' },
      { icon: Globe2, text: 'Compare the strengths of top frontier models today' },
      { icon: BarChart3, text: 'Give me a 5-minute primer on AI benchmarking' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    icon: Search,
    prompts: [
      { icon: BookOpen, text: 'Summarise latest research on a topic' },
      { icon: Search, text: 'Find and compare top AI models for my task' },
      { icon: Globe2, text: 'Research market trends in my industry' },
      { icon: BookOpen, text: 'Explain a technical paper in plain English' },
      { icon: Sparkles, text: 'Map out key players in a new field' },
    ],
  },
]

const builderCards = [
  { title: 'Guided Discovery Chat', tag: 'GUIDED CHAT', description: 'Ask a natural question and get model guidance plus a clear next step.', route: '/hub' },
  { title: 'Prompt Engineering Guide', tag: 'PROMPTS', description: 'Tailored prompt principles, examples, and starter templates for every model.', route: '/marketplace' },
  { title: 'Agent Builder', tag: 'AGENTS', description: 'Step-by-step agent creation, tools, memory, and testing in one flow.', route: '/agents' },
  { title: 'Flexible Pricing', tag: 'PRICING', description: 'Compare pay-per-use, subscriptions, free tiers, and enterprise options.', route: '/marketplace' },
  { title: 'User Reviews & Ratings', tag: 'REVIEWS', description: 'Benchmarks, ratings, and real-world notes help you choose confidently.', route: '/marketplace' },
  { title: 'Research Feed', tag: 'RESEARCH', description: 'Daily model releases, benchmark shifts, and AI research updates.', route: '/discover' },
]

const useCaseCards = [
  { title: 'Code Generation', models: 'Claude Opus 4.6, Devstral 2, GPT-5.4, Qwen3-Coder', icon: Code2, preset: { useCase: 'build-something', audience: 'my-team', experience: 'developer', followUp: 'Create production-ready code for a new feature.' } },
  { title: 'Image Generation', models: 'gpt-image-1.5, Grok-Imagine-Pro, Gemini Flash Image', icon: ImageIcon, preset: { useCase: 'create-images', audience: 'my-customers', experience: 'beginner', followUp: 'Generate realistic images for a campaign.' } },
  { title: 'AI Agents', models: 'GPT-5.4, Claude Opus 4.6, kimi-k2.5, Grok-4-1', icon: Bot, route: '/agents' },
  { title: 'Document Analysis', models: 'Claude Sonnet 4.6, Gemini 3.1 Pro, Nemotron Ultra', icon: BookOpen, preset: { useCase: 'document-analysis', audience: 'my-company', experience: 'researcher', followUp: 'Extract key information from a long document.' } },
  { title: 'Video Generation', models: 'Sora 2 Pro, Veo 3.1, Grok-Imagine-Video', icon: Sparkles, preset: { useCase: 'just-exploring', audience: 'public', experience: 'beginner', followUp: 'Plan a short product video.' } },
  { title: 'Voice & Audio', models: 'Gemini-TTS, ElevenLabs, Whisper v3', icon: Mic, preset: { useCase: 'just-exploring', audience: 'public', experience: 'beginner', followUp: 'Create an audio workflow with narration.' } },
  { title: 'Multilingual / Translation', models: 'Qwen3-Max, Gemini 3.1 Flash-Lite, GLM-4.7', icon: Globe2, preset: { useCase: 'just-exploring', audience: 'public', experience: 'beginner', followUp: 'Translate content for an international audience.' } },
]

const labMeta = {
  OpenAI: { label: 'OpenAI', symbol: 'O' },
  Anthropic: { label: 'Anthropic', symbol: 'A' },
  Google: { label: 'Google DeepMind', symbol: 'G' },
  Meta: { label: 'Meta (Llama)', symbol: 'M' },
  DeepSeek: { label: 'DeepSeek', symbol: 'D' },
  xAI: { label: 'xAI / Grok', symbol: 'X' },
  Mistral: { label: 'Mistral AI', symbol: 'Mi' },
  Cohere: { label: 'Cohere', symbol: 'C' },
  Moonshot: { label: 'Moonshot (Kimi)', symbol: 'K' },
}

function formatMoney(value) {
  if (value === 0) return 'Free'
  if (value < 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(value >= 10 ? 0 : 1)}`
}

function formatContext(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}M`
  return `${Math.round(value / 1000)}K`
}

function normalizeList(response, fallback = []) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.items)) return response.items
  return fallback
}

function SectionHeading({ eyebrow, title, subtitle, actionLabel, onAction, actionTo }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">{eyebrow}</div> : null}
        <h2 className="display-font text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-[2.4rem]">{title}</h2>
        {subtitle ? <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{subtitle}</p> : null}
      </div>
      {actionLabel ? (
        actionTo ? (
          <Button as={Link} to={actionTo} variant="ghost" className="!border-black/0 !bg-transparent !px-0 !text-[var(--accent)] hover:!border-black/0 hover:!bg-transparent">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" className="!border-black/0 !bg-transparent !px-0 !text-[var(--accent)] hover:!border-black/0 hover:!bg-transparent" onClick={onAction}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )
      ) : null}
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const [heroPrompt, setHeroPrompt] = useState('')
  const [heroFiles, setHeroFiles] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [selectedLandingFocus, setSelectedLandingFocus] = useState('research')
  const [featuredModels, setFeaturedModels] = useState([])
  const [trendingModels, setTrendingModels] = useState([])
  const [allModels, setAllModels] = useState([])
  const [labs, setLabs] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareModels, setCompareModels] = useState([])
  const selectModel = useModelStore((state) => state.actions.selectModel)
  const clearFilters = useModelStore((state) => state.actions.clearFilters)
  const setFilter = useModelStore((state) => state.actions.setFilter)
  const locale = useLanguageStore((state) => state.locale)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const heroInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const videoCaptureRef = useRef(null)
  const screenCaptureRef = useRef(null)

  const t = (key, fallback = '') => translate(locale, key, fallback)

  useEffect(() => {
    document.title = 'PromptForge - AI model discovery'
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.()
      videoCaptureRef.current?.cancel?.()
      screenCaptureRef.current?.cancel?.()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const [featuredResponse, trendingResponse, labsResponse, modelsResponse] = await Promise.all([
        modelService.featured(),
        modelService.trending(),
        modelService.labs(),
        modelService.list(),
      ])

      if (cancelled) return

      const models = normalizeList(modelsResponse, fallbackModels)
      setAllModels(models.length ? models : fallbackModels)
      setFeaturedModels(normalizeList(featuredResponse, fallbackModels.filter((model) => model.isFeatured).slice(0, 6)))
      setTrendingModels(normalizeList(trendingResponse, fallbackModels.filter((model) => model.isTrending).slice(0, 6)))
      setLabs(Array.isArray(labsResponse) ? labsResponse : [])
    }

    loadData().catch(() => {
      if (!cancelled) {
        setAllModels(fallbackModels)
        setFeaturedModels(fallbackModels.filter((model) => model.isFeatured).slice(0, 6))
        setTrendingModels(fallbackModels.filter((model) => model.isTrending).slice(0, 6))
        setLabs([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const labCards = useMemo(() => {
    const modelSource = allModels.length ? allModels : fallbackModels
    const sampleLookup = modelSource.reduce((acc, model) => {
      acc[model.lab] = acc[model.lab] ?? []
      acc[model.lab].push(model.name)
      return acc
    }, {})

    const source = labs.length
      ? labs.map((entry) => ({
          ...entry,
          samples: sampleLookup[entry.lab] ?? [],
        }))
      : Object.values(
          modelSource.reduce((acc, model) => {
            acc[model.lab] = acc[model.lab] ?? { lab: model.lab, count: 0, samples: [] }
            acc[model.lab].count += 1
            acc[model.lab].samples.push(model.name)
            return acc
          }, {}),
        )

    return source
      .map((entry) => ({
        ...entry,
        label: labMeta[entry.lab]?.label ?? entry.lab,
        symbol: labMeta[entry.lab]?.symbol ?? entry.lab.slice(0, 1),
      }))
      .sort((left, right) => right.count - left.count)
  }, [allModels, labs])

  const budgetCards = useMemo(() => {
    const source = allModels.length ? allModels : fallbackModels
    const groups = [
      {
        key: 'free',
        title: 'Free & Open Source',
        color: '#0f766e',
        bg: 'bg-emerald-100/85 border-emerald-200',
        filter: { pricingModels: ['Free tier'], category: 'open-source' },
        models: source.filter((model) => model.isFree || model.isOpenSource),
        description: 'Open models and self-host options for teams that want zero API cost.',
      },
      {
        key: 'budget',
        title: 'Budget - Under $0.50/1M',
        color: '#1d4ed8',
        bg: 'bg-sky-100/85 border-sky-200',
        filter: { pricingModels: ['Pay-per-use'] },
        models: source.filter((model) => model.inputPricePer1M + model.outputPricePer1M <= 0.5),
        description: 'Low-cost models for prototyping, automation, and high-volume work.',
      },
      {
        key: 'mid',
        title: 'Mid-Range - $1-$5/1M',
        color: '#b45309',
        bg: 'bg-amber-100/85 border-amber-200',
        filter: { pricingModels: ['Subscription'] },
        models: source.filter((model) => model.inputPricePer1M + model.outputPricePer1M > 0.5 && model.inputPricePer1M + model.outputPricePer1M <= 20),
        description: 'Balanced quality and cost for everyday product and team use.',
      },
      {
        key: 'premium',
        title: 'Premium - $5+/1M',
        color: '#c2410c',
        bg: 'bg-rose-100/85 border-rose-200',
        filter: { pricingModels: ['Enterprise'] },
        models: source.filter((model) => model.inputPricePer1M + model.outputPricePer1M > 20),
        description: 'Top-tier quality for demanding reasoning, multimodal, and agentic tasks.',
      },
    ]

    return groups.map((group) => ({
      ...group,
      count: group.models.length,
      samples: group.models.slice(0, 4).map((model) => model.name),
    }))
  }, [allModels])

  const comparisonModels = useMemo(() => {
    const source = allModels.length ? allModels : fallbackModels
    return [...source].sort((left, right) => right.rating - left.rating).slice(0, 12)
  }, [allModels])

  const localizedQuickActions = useMemo(() => {
    const translatedLabels = translations[locale]?.landing?.quickActions ?? []
    return quickActions.map((item, index) => ({
      ...item,
      label: translatedLabels[index] ?? item.label,
    }))
  }, [locale])

  const activeLandingSuggestionGroup = useMemo(
    () =>
      landingSuggestionGroups.find((group) => group.id === selectedLandingFocus) ??
      landingSuggestionGroups.at(-1),
    [selectedLandingFocus],
  )

  function openPromptBuilder(preset = {}) {
    navigate('/hub', {
      state: {
        tab: 'prompt-builder',
        promptBuilder: {
          useCase: preset.useCase ?? 'just-exploring',
          audience: preset.audience ?? 'public',
          experience: preset.experience ?? 'beginner',
          followUp: preset.followUp ?? 'Show me what I can do with PromptForge.',
          entryMessage: preset.entryMessage ?? '',
          currentStep: 4,
        },
      },
    })
  }

  function openLandingFeature(item) {
    navigate('/hub', {
      state: {
        tab: 'prompt-builder',
        promptBuilder: {
          useCase: item.useCase ?? 'just-exploring',
          entryMessage: item.entryMessage ?? item.label,
          currentStep: 1,
        },
      },
    })
  }

  function addHeroFiles(fileList) {
    const nextFiles = Array.from(fileList ?? [])
    if (!nextFiles.length) return
    setHeroFiles((current) => mergeInputFiles(current, nextFiles))
  }

  function removeHeroFile(indexToRemove) {
    setHeroFiles((current) => current.filter((_, index) => index !== indexToRemove))
  }

  function applyLandingSuggestion(prompt) {
    setHeroPrompt(prompt)
    window.requestAnimationFrame(() => {
      heroInputRef.current?.focus()
      heroInputRef.current?.setSelectionRange?.(prompt.length, prompt.length)
    })
  }

  function stopVoiceCapture() {
    recognitionRef.current?.stop?.()
    recognitionRef.current = null
    setIsListening(false)
  }

  async function stopMediaSession(kind) {
    const activeRef = kind === 'camera' ? videoCaptureRef : screenCaptureRef
    const setActiveState = kind === 'camera' ? setIsRecordingVideo : setIsSharingScreen
    const successTitle = kind === 'camera' ? 'Video attached' : 'Screen recording attached'
    const errorTitle = kind === 'camera' ? 'Video capture failed' : 'Screen sharing failed'

    if (!activeRef.current) {
      setActiveState(false)
      return null
    }

    try {
      const file = await activeRef.current.stop()
      activeRef.current = null
      setActiveState(false)

      if (file) {
        setHeroFiles((current) => mergeInputFiles(current, [file]))
        toast({
          title: successTitle,
          message: `${file.name} is ready to send in Chat Hub.`,
          type: 'success',
        })
      }

      return file
    } catch {
      activeRef.current = null
      setActiveState(false)
      toast({
        title: errorTitle,
        message: 'Please try again and allow browser permissions if prompted.',
        type: 'error',
      })
      return null
    }
  }

  async function stopOtherLiveInputs(nextKind) {
    if (nextKind !== 'voice' && isListening) {
      stopVoiceCapture()
    }

    if (nextKind !== 'camera' && videoCaptureRef.current) {
      await stopMediaSession('camera')
    }

    if (nextKind !== 'screen' && screenCaptureRef.current) {
      await stopMediaSession('screen')
    }
  }

  async function startVoiceCapture() {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      toast({
        title: 'Voice input unavailable',
        message: 'This browser does not support speech recognition.',
        type: 'error',
      })
      return
    }

    if (isListening) {
      stopVoiceCapture()
      return
    }

    await stopOtherLiveInputs('voice')

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setIsListening(false)
      toast({
        title: 'Voice capture failed',
        message: 'Try again or type your request manually.',
        type: 'error',
      })
    }
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim()

      if (!transcript) return

      setHeroPrompt((current) => (current ? `${current} ${transcript}`.trim() : transcript))
      toast({
        title: 'Voice transcribed',
        message: 'Transcript was added to the main input.',
        type: 'success',
      })
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  async function handleMediaCapture(kind) {
    const isActive = kind === 'camera' ? isRecordingVideo : isSharingScreen
    const activeRef = kind === 'camera' ? videoCaptureRef : screenCaptureRef
    const setActiveState = kind === 'camera' ? setIsRecordingVideo : setIsSharingScreen
    const errorTitle = kind === 'camera' ? 'Video capture failed' : 'Screen sharing failed'

    if (isActive && activeRef.current) {
      await stopMediaSession(kind)
      return
    }

    await stopOtherLiveInputs(kind)

    try {
      const session = await startMediaCapture(kind)
      activeRef.current = session
      setActiveState(true)

      session.finished
        .then((file) => {
          if (activeRef.current !== session) return
          activeRef.current = null
          setActiveState(false)
          if (!file) return
          setHeroFiles((current) => mergeInputFiles(current, [file]))
          toast({
            title: kind === 'camera' ? 'Video attached' : 'Screen recording attached',
            message: `${file.name} is ready to send in Chat Hub.`,
            type: 'success',
          })
        })
        .catch(() => {
          if (activeRef.current !== session) return
          activeRef.current = null
          setActiveState(false)
          toast({
            title: errorTitle,
            message: 'Please try again and allow browser permissions if prompted.',
            type: 'error',
          })
        })
    } catch (error) {
      setActiveState(false)
      toast({
        title: errorTitle,
        message:
          error instanceof Error
            ? error.message
            : 'Please try again and allow browser permissions if prompted.',
        type: 'error',
      })
    }
  }

  function openMarketplace(filters = {}) {
    clearFilters()
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) setFilter(key, value)
    })
    navigate('/marketplace')
  }

  function openModelDetails(model, tab = 'overview') {
    if (!model) return
    setSelectedModel(model)
    setSelectedTab(tab)
  }

  async function tryModel(model) {
    if (!model) return
    setSelectedModel(model)
    selectModel(model)
    await runChatAction('switchModel', model.modelId)
    navigate('/hub')
  }

  function openCompare() {
    const models = comparisonModels.slice(0, 3)
    if (!models.length) return
    setCompareModels(models)
    setCompareOpen(true)
  }

  function handleUseCaseCard(card) {
    if (card.route) {
      navigate(card.route)
      return
    }

    if (card.preset) {
      openPromptBuilder(card.preset)
    }
  }

  const liveCount = allModels.filter((model) => model.isLive).length || fallbackModels.length
  const totalModels = allModels.length || 525
  const heroModel = featuredModels[0] ?? fallbackModels[0]

  return (
    <PageWrapper className="!p-0 bg-[#f4efe8] text-[#111]">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(rgba(17,17,17,0.08) 1px, transparent 1px), radial-gradient(rgba(17,17,17,0.03) 1px, transparent 1px)',
            backgroundPosition: '0 0, 12px 12px',
            backgroundSize: '24px 24px, 24px 24px',
          }}
        />

        <section className="relative border-b border-black/5 px-4 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-8 lg:gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              <div>
            <div className="mx-auto flex w-full max-w-max items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--accent-hover)] shadow-[var(--shadow-soft)] sm:w-auto xl:mx-0 xl:justify-start">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {liveCount} {t('landing.liveUpdatedDaily', 'models live - Updated daily')}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="display-font mx-auto mt-10 max-w-[940px] text-center text-[clamp(2.8rem,13vw,6.5rem)] font-medium leading-[0.84] text-[#181412] xl:mx-0 xl:max-w-[820px] xl:text-left"
            >
              {t('landing.heroLine1', 'Find your perfect')}
              <span className="block text-[var(--accent-hover)]">{t('landing.heroHighlight', 'AI model')}</span>
              {t('landing.heroLine2', 'with guided')}
              <span className="block">{t('landing.heroLine3', 'discovery')}</span>
            </motion.h1>

            <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-[var(--text-secondary)] sm:text-lg xl:mx-0 xl:text-left">
              {t(
                'landing.heroSubtitle',
                'You do not need to know anything about AI to get started. Click the box below and we will do the rest together.',
              )}
            </p>

            <form
              className="soft-section mx-auto mt-10 max-w-[1320px] rounded-[28px] px-4 py-4 backdrop-blur sm:rounded-[32px] xl:mx-0"
              onSubmit={(event) => {
                event.preventDefault()
                const normalizedPrompt = heroPrompt.trim()

                if (!normalizedPrompt && heroFiles.length === 0) {
                  navigate('/hub')
                  return
                }

                queuePendingComposer({
                  content: normalizedPrompt,
                  files: heroFiles,
                  autoSend: true,
                })
                setHeroPrompt('')
                setHeroFiles([])
                navigate('/hub')
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  addHeroFiles(event.target.files)
                  event.target.value = ''
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  addHeroFiles(event.target.files)
                  event.target.value = ''
                }}
              />
              <div className="flex items-center gap-3 px-2">
                <input
                  ref={heroInputRef}
                  type="text"
                  value={heroPrompt}
                  onChange={(event) => setHeroPrompt(event.target.value)}
                  placeholder={t('landing.searchPlaceholder', 'Click here and type anything - or just say hi ...')}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-[#111] outline-none placeholder:text-[#9e8f7c]"
                />
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: 'Guided mode ready',
                        message: 'Use the suggestions below or jump straight into Chat Hub.',
                        type: 'info',
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.28)] transition hover:scale-[1.03]"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/hub')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--shadow-soft)] transition hover:scale-[1.03]"
                  >
                    <Bot className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-black/6 px-2 pt-4 sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startVoiceCapture}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                      isListening
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--accent)] transition hover:border-[var(--border-strong)]"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--accent)] transition hover:border-[var(--border-strong)]"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--accent)] transition hover:border-[var(--border-strong)]"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMediaCapture('camera')}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                      isRecordingVideo
                        ? 'border-[#ff9f9f] bg-[#ef4444] text-white'
                        : 'border-[#ffc8c8] bg-[#fff5f5] text-[#ef4444] hover:border-[#ff9f9f]'
                    }`}
                  >
                    {isRecordingVideo ? <Square className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMediaCapture('screen')}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                      isSharingScreen
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[var(--border)] bg-white text-emerald-700 hover:border-emerald-300'
                    }`}
                  >
                    {isSharingScreen ? <Square className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/agents')}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-white"
                  >
                    <Bot className="h-4 w-4" />
                    Agent
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white text-[12px]">
                      <Plus className="h-3 w-3" />
                    </span>
                  </button>
                </div>

                <Button type="submit" className="w-full rounded-full px-5 sm:w-auto">
                  <Search className="h-4 w-4" />
                  {t('landing.letsGo', "Let's go")}
                </Button>
              </div>
            </form>

            {heroFiles.length || isListening || isRecordingVideo || isSharingScreen ? (
              <div className="mx-auto mt-4 flex max-w-[1320px] flex-wrap items-center gap-2 xl:mx-0">
                {heroFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-[0_8px_24px_rgba(16,24,40,0.05)]"
                  >
                    <span className="max-w-[220px] truncate">{file.name}</span>
                    <span className="text-[#9e8f7c]">{formatInputFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeHeroFile(index)}
                      className="rounded-full p-0.5 transition hover:bg-black/5 hover:text-[#111]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {isListening ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs text-[var(--accent)]">
                    <Mic className="h-3.5 w-3.5" />
                    Listening...
                  </div>
                ) : null}
                {isRecordingVideo ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-xs text-rose-700">
                    <Video className="h-3.5 w-3.5" />
                    Recording video...
                  </div>
                ) : null}
                {isSharingScreen ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs text-emerald-700">
                    <Monitor className="h-3.5 w-3.5" />
                    Sharing screen...
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="soft-section mx-auto mt-4 max-w-[1320px] overflow-hidden rounded-[28px] xl:mx-0">
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-black/6 px-4 pt-4 sm:flex-wrap">
                {landingSuggestionGroups.map((group) => {
                  const Icon = group.icon
                  const isActive = group.id === activeLandingSuggestionGroup?.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedLandingFocus(group.id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-t-[18px] border border-b-0 px-4 py-2 text-sm transition ${
                        isActive
                          ? 'border-black/10 bg-white text-[#111]'
                          : 'border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[#111]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-2 px-5 py-5">
                {activeLandingSuggestionGroup?.prompts.map((prompt) => {
                  const Icon = prompt.icon
                  return (
                    <button
                      key={prompt.text}
                      type="button"
                      onClick={() => applyLandingSuggestion(prompt.text)}
                      className="flex w-full items-center gap-4 rounded-2xl px-3 py-2 text-left transition hover:bg-[#f8f3eb]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[17px] text-[#4f4438]">{prompt.text}</span>
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-black/6 px-5 py-3 text-sm text-[var(--text-muted)]">
                Click any suggestion to fill the search box, then press{' '}
                <span className="font-semibold text-[var(--text-secondary)]">{t('landing.letsGo', "Let's go")}</span>
              </div>
            </div>

            <div className="mx-auto mt-5 grid max-w-[1320px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:mx-0 xl:grid-cols-4">
              {localizedQuickActions.map((item) => {
                const Icon = item.icon
                return (
                  <Card
                    key={item.label}
                    className="cursor-pointer bg-white/95 p-4 text-center text-[#111] shadow-[0_10px_28px_rgba(16,24,40,0.06)]"
                    onClick={() => openLandingFeature(item)}
                  >
                    <Icon className="mx-auto h-6 w-6 text-[var(--accent)]" />
                    <div className="mt-2 text-sm font-semibold leading-5">{item.label}</div>
                  </Card>
                )
              })}
            </div>
              </div>

              <div className="space-y-4 xl:sticky xl:top-28">
                <Card className="overflow-hidden bg-[rgba(255,253,248,0.96)] p-0">
                  <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-5 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                      Featured Right Now
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">
                      A calm, guided entry point into the marketplace.
                    </div>
                  </div>
                  <div className="space-y-5 p-5">
                    <div className="flex items-start gap-4">
                      <div className="icon-badge h-14 w-14 rounded-[20px] text-lg font-semibold">
                        {heroModel.labIcon || heroModel.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-semibold text-[var(--text-primary)]">
                          {heroModel.name}
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-muted)]">{heroModel.lab}</div>
                        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                          {heroModel.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Rating</div>
                        <div className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                          {heroModel.rating?.toFixed(1) ?? '--'}
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Context</div>
                        <div className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                          {formatContext(heroModel.contextWindow)}
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Price</div>
                        <div className="mt-2 text-base font-semibold text-emerald-700">
                          {formatMoney(heroModel.inputPricePer1M)}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <Button variant="secondary" className="w-full" onClick={() => openModelDetails(heroModel)}>
                        View details
                      </Button>
                      <Button className="w-full" onClick={() => tryModel(heroModel)}>
                        Try this model
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[rgba(255,253,248,0.96)]">
                  <div className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Guided Path
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                    {activeLandingSuggestionGroup?.label}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    Tap a suggestion and we&apos;ll prefill the main composer for you.
                  </div>
                  <div className="mt-5 space-y-3">
                    {activeLandingSuggestionGroup?.prompts.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt.text}
                        type="button"
                        onClick={() => applyLandingSuggestion(prompt.text)}
                        className="flex w-full items-start gap-3 rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
                      >
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                        <span className="text-sm leading-6 text-[var(--text-secondary)]">{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading title="Featured Models" actionLabel={`Browse all ${totalModels}`} actionTo="/marketplace" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredModels.slice(0, 6).map((model) => (
                <Card
                  key={model.modelId}
                  className="flex h-full flex-col justify-between bg-white p-5 text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.06)]"
                  onClick={() => openModelDetails(model)}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]">
                          {model.labIcon || model.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{model.name}</div>
                          <div className="text-sm text-[var(--text-muted)]">{model.lab}</div>
                        </div>
                      </div>
                      <Badge variant={model.isTrending ? 'status' : 'category'}>
                        {model.isTrending ? 'Hot' : model.isFeatured ? 'New' : 'Live'}
                      </Badge>
                    </div>
                    <p className="mt-4 min-h-[72px] text-sm leading-6 text-[var(--text-secondary)]">{model.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(model.tags ?? []).slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#edf2ff] px-3 py-1 text-xs font-medium text-[#4967d1]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-black/5 pt-4">
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Rating</div>
                        <div className="mt-1 font-semibold">{model.rating.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Context</div>
                        <div className="mt-1 font-semibold">{formatContext(model.contextWindow)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Price</div>
                        <div className="mt-1 font-semibold text-emerald-700">{formatMoney(model.inputPricePer1M)}/1M tk</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button
                        variant="secondary"
                        className="bg-transparent text-[#111]"
                        onClick={(event) => {
                          event.stopPropagation()
                          openModelDetails(model, 'overview')
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        onClick={async (event) => {
                          event.stopPropagation()
                          await tryModel(model)
                        }}
                      >
                        Try
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black/5 bg-[#f3ede4] px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading eyebrow="Built for every builder" title="A guided workflow for every stage of discovery" subtitle="Start with a conversation, compare pricing and performance, then move directly into prompting, agent building, or research." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {builderCards.map((card) => (
                <Card key={card.title} className="cursor-pointer bg-white p-5 text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.05)]" onClick={() => navigate(card.route)}>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{card.tag}</div>
                  <div className="mt-4 text-xl font-semibold">{card.title}</div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{card.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                    Open now
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading eyebrow="Browse by AI Lab" title="Pick the provider family that fits your workflow" actionLabel="See all labs" actionTo="/marketplace" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {labCards.map((lab) => (
                <Card key={lab.lab} className="cursor-pointer bg-[#f8f4ee] p-5 text-center text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.04)]" onClick={() => openMarketplace({ lab: lab.lab })}>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-[var(--accent)] shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
                    {lab.symbol}
                  </div>
                  <div className="mt-4 text-base font-semibold">{lab.label}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">{lab.count} models</div>
                  <div className="mt-3 text-xs leading-5 text-[#7e6f5f]">{(lab.samples ?? []).slice(0, 3).join(', ')}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#faf7f2] px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading eyebrow="Flagship Model Comparison" title="Side-by-side view of the leading models" subtitle="Compare context, pricing, speed, and best-fit use cases before you choose a model." actionLabel="Compare all" onAction={openCompare} />
            <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_10px_30px_rgba(16,24,40,0.05)]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Model</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Lab</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Context</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Input $/1M</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Output $/1M</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Multimodal</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Speed</th>
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonModels.map((model) => (
                      <tr key={model.modelId} className="cursor-pointer border-t border-black/5 transition hover:bg-[#faf5ee]" onClick={() => openModelDetails(model)}>
                        <td className="px-5 py-4 font-semibold text-[#111]">{model.name}</td>
                        <td className="px-5 py-4 text-[#8f7e6a]">{model.lab}</td>
                        <td className="px-5 py-4 text-[var(--accent-hover)]">{formatContext(model.contextWindow)}</td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">{formatMoney(model.inputPricePer1M)}</td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">{formatMoney(model.outputPricePer1M)}</td>
                        <td className="px-5 py-4">{model.multimodal ? 'Yes' : 'No'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${model.speed === 'fast' ? 'bg-emerald-500' : model.speed === 'medium' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                            {model.speed.charAt(0).toUpperCase() + model.speed.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#8f7e6a]">{model.bestFor?.[0] ?? 'General use'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/5 bg-white px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading eyebrow="Trending This Week" title="What builders are clicking into right now" actionLabel="View research feed" actionTo="/discover" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {trendingModels.slice(0, 6).map((model, index) => (
                <Card key={model.modelId} className="cursor-pointer bg-white p-5 text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.05)]" onClick={() => openModelDetails(model)}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="category" className="bg-[var(--accent-soft)] text-[var(--accent)]">
                      {index === 0 ? 'Just Released' : index === 1 ? 'Hot' : index === 2 ? 'Computer Use' : index === 3 ? 'Real-Time' : index === 4 ? 'Open Source' : 'Coding'}
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)]">{model.lab}</span>
                  </div>
                  <div className="mt-4 text-lg font-semibold leading-7">{model.name}</div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{model.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f3ede4] px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading eyebrow="Find Models by Budget" title="Start from the pricing path that matches your team" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {budgetCards.map((card) => (
                <Card key={card.key} className={`cursor-pointer border ${card.bg} p-6 text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.05)]`} onClick={() => openMarketplace(card.filter)}>
                  <div className="text-2xl">$</div>
                  <div className="mt-4 text-xl font-semibold" style={{ color: card.color }}>{card.title}</div>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-[var(--text-secondary)]">{card.description}</p>
                  <div className="mt-4 text-sm font-semibold" style={{ color: card.color }}>
                    {card.count} models available
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.samples.slice(0, 3).map((name) => (
                      <span key={name} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7c6e5c]">{name}</span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading eyebrow="Quick-Start by Use Case" title="Pick the starting point that fits what you need to do" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
              {useCaseCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card key={card.title} className="cursor-pointer bg-white p-5 text-[#111] shadow-[0_10px_30px_rgba(16,24,40,0.05)]" onClick={() => handleUseCaseCard(card)}>
                    <Icon className="h-5 w-5 text-[var(--accent)]" />
                    <div className="mt-3 font-semibold leading-5">{card.title}</div>
                    <div className="mt-2 text-xs leading-5 text-[#8c7c68]">{card.models}</div>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                      Start now
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {['Explain how large language models work simply', 'What is RAG and when should you use it?', 'Explain the difference between fine-tuning and RAG'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => openPromptBuilder({ followUp: prompt })} className="block text-left text-sm text-[#6f5f4d] transition hover:text-[var(--accent)]">
                    - {prompt}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {['Teach me prompt engineering from scratch', 'Help me understand AI agent architectures', 'Give me a 5-minute overview of AI safety concepts'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => openPromptBuilder({ followUp: prompt })} className="block text-left text-sm text-[#6f5f4d] transition hover:text-[var(--accent)]">
                    - {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-[#161410] px-4 py-20 text-white lg:px-8">
          <div className="mx-auto max-w-[900px] text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
              {t('landing.newsletterEyebrow', 'Stay ahead of the curve')}
            </div>
            <h2 className="display-font mt-5 text-[clamp(2.5rem,6vw,4.4rem)] font-medium leading-[0.96] tracking-[-0.06em]">
              {t('landing.newsletterTitle1', 'New models drop every week.')}
              <br />
              {t('landing.newsletterTitle2', 'Do not miss a release.')}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#bcb3a5]">
              {t(
                'landing.newsletterText',
                'Get a curated weekly digest with model releases, benchmark comparisons, pricing changes, and prompt engineering tips, straight to your inbox.',
              )}
            </p>
            <form
              className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                toast({
                  title: 'Subscribed',
                  message: 'Weekly updates will be sent once email signup is connected.',
                  type: 'success',
                })
              }}
            >
              <input
                type="email"
                required
                placeholder={t('landing.newsletterPlaceholder', 'your@email.com')}
                className="flex-1 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white outline-none placeholder:text-[#867a6d]"
              />
              <Button type="submit" className="rounded-full px-6">
                {t('landing.subscribeFree', 'Subscribe free')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-5 text-sm text-[#867a6d]">
              {t('landing.noSpam', 'No spam. Unsubscribe any time. Trusted by 82K+ builders.')}
            </p>
          </div>

          <div className="mx-auto mt-16 flex max-w-[1440px] flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-[#d8d0c5]">
            <div className="brand-font text-lg font-semibold">PromptForge Model Marketplace</div>
            <div className="flex flex-wrap gap-5 text-[#c8beb1]">
              <button type="button" onClick={() => navigate('/marketplace')}>Models</button>
              <button type="button" onClick={() => navigate('/discover')}>Research</button>
              <button type="button" onClick={() => navigate('/hub')}>API</button>
              <button type="button">Privacy</button>
              <button type="button">Terms</button>
            </div>
          </div>
        </section>
      </div>

      <ModelDrawer isOpen={Boolean(selectedModel)} onClose={() => setSelectedModel(null)} model={selectedModel} initialTab={selectedTab} />
      <CompareModal isOpen={compareOpen} onClose={() => setCompareOpen(false)} models={compareModels} />
    </PageWrapper>
  )
}


