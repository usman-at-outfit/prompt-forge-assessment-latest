import {
  ImagePlus,
  Mic,
  Monitor,
  Paperclip,
  Send,
  Sparkles,
  Square,
  Video,
  Wand2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumePendingComposer, runChatAction, useChatStore } from '../../store/chatStore'
import { useModelStore } from '../../store/modelStore'
import {
  formatInputFileSize,
  mergeInputFiles,
  startMediaCapture,
} from '../../utils/mediaInput'
import { GuidedAgentFlow } from './GuidedAgentFlow'
import { ModelDrawer } from '../models/ModelDrawer'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { MessageBubble } from './MessageBubble'
import { ModelSelector } from './ModelSelector'
import { toast } from '../ui/Toast'

const quickStarts = [
  'Draft a launch email for a new feature.',
  'Help me turn this idea into a build plan.',
  'Summarize what model is best for marketing research.',
  'Create a short automation workflow for onboarding.',
  'Outline how to analyze churn for my team.',
  'Give me a prompt to explore AI tools safely.',
]

const composerSuggestionGroups = [
  {
    id: 'use-cases',
    label: 'Use cases',
    prompts: [
      'Explain how large language models work simply',
      'What is RAG and when should you use it?',
      'Explain the difference between fine-tuning and RAG',
    ],
  },
  {
    id: 'monitor',
    label: 'Monitor the situation',
    prompts: [
      'Summarize the latest changes in frontier AI models',
      'What should I watch when evaluating new model launches?',
      'Turn recent AI updates into a short team briefing',
    ],
  },
  {
    id: 'prototype',
    label: 'Create a prototype',
    prompts: [
      'Help me turn an app idea into a prototype plan',
      'Draft an MVP scope for a new AI assistant',
      'What should I validate before building the first version?',
    ],
  },
  {
    id: 'business',
    label: 'Build a business plan',
    prompts: [
      'Draft a lean business plan for an AI product',
      'How should I price a new AI workflow product?',
      'Outline risks, assumptions, and early milestones',
    ],
  },
  {
    id: 'content',
    label: 'Create content',
    prompts: [
      'Write a launch email for a product update',
      'Create a LinkedIn post about a new feature',
      'Draft a short newsletter for our customers',
    ],
  },
  {
    id: 'research',
    label: 'Analyze & research',
    prompts: [
      'Find and compare the top AI models for my task',
      'Research market trends in my industry',
      'Explain a technical paper in plain English',
    ],
  },
  {
    id: 'learn',
    label: 'Learn something',
    prompts: [
      'Teach me prompt engineering from scratch',
      'Help me understand AI agent architectures',
      'Give me a 5-minute overview of AI safety concepts',
    ],
  },
]

export function ChatWindow() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [detailModel, setDetailModel] = useState(null)
  const [detailTab, setDetailTab] = useState('overview')
  const [isListening, setIsListening] = useState(false)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [activeSuggestionGroup, setActiveSuggestionGroup] = useState('learn')
  const messages = useChatStore((state) => state.messages)
  const activeModel = useChatStore((state) => state.activeModel)
  const isTyping = useChatStore((state) => state.isTyping)
  const guideFlow = useChatStore((state) => state.guideFlow)
  const models = useModelStore((state) =>
    state.filteredModels.length ? state.filteredModels : state.allModels,
  )
  const selectedModel = useModelStore((state) => state.selectedModel)
  const selectModel = useModelStore((state) => state.actions.selectModel)
  const listRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const videoCaptureRef = useRef(null)
  const screenCaptureRef = useRef(null)
  const activeModelLabel =
    selectedModel?.modelId === activeModel ? selectedModel.name : activeModel
  const activeComposerSuggestions =
    composerSuggestionGroups.find((group) => group.id === activeSuggestionGroup) ??
    composerSuggestionGroups.at(-1)

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [guideFlow, isTyping, messages])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.()
      videoCaptureRef.current?.cancel?.()
      screenCaptureRef.current?.cancel?.()
    }
  }, [])

  useEffect(() => {
    const pendingComposer = consumePendingComposer()
    if (!pendingComposer) return

    if (pendingComposer.autoSend) {
      runChatAction('sendMessage', pendingComposer)
      return
    }

    setDraft(pendingComposer.content ?? '')
    setSelectedFiles(Array.isArray(pendingComposer.files) ? pendingComposer.files : [])
  }, [])

  function openDetails(model, tab = 'overview') {
    setDetailModel(model)
    setDetailTab(tab)
  }

  function addFiles(fileList) {
    const nextFiles = Array.from(fileList ?? [])
    if (nextFiles.length === 0) return
    setSelectedFiles((current) => mergeInputFiles(current, nextFiles))
  }

  function removeFile(indexToRemove) {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove))
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
        setSelectedFiles((current) => mergeInputFiles(current, [file]))
        toast({
          title: successTitle,
          message: `${file.name} is ready to send with your message.`,
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

      setDraft((current) => (current ? `${current} ${transcript}`.trim() : transcript))
      toast({
        title: 'Voice transcribed',
        message: 'Transcript was added to the input field.',
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
          setSelectedFiles((current) => mergeInputFiles(current, [file]))
          toast({
            title: kind === 'camera' ? 'Video attached' : 'Screen recording attached',
            message: `${file.name} is ready to send with your message.`,
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

  async function handleSend() {
    if (!draft.trim() && selectedFiles.length === 0) return

    const content = draft
    const files = selectedFiles
    setDraft('')
    setSelectedFiles([])
    await runChatAction('sendMessage', { content, files })
  }

  function applyComposerSuggestion(prompt) {
    setDraft(prompt)
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="text-sm text-[var(--text-muted)]">Active model</div>
            <div className="text-lg font-semibold">{activeModelLabel}</div>
          </div>
          <ModelSelector
            models={models}
            value={activeModel}
            onChange={(modelId) => runChatAction('switchModel', modelId)}
          />
        </div>
        <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {guideFlow.mode === 'agent-builder' ? (
            <GuidedAgentFlow
              flow={guideFlow}
              models={models}
              onAudienceSelect={(audience) => runChatAction('setGuideAudience', audience)}
              onProceedModel={(model) => {
                selectModel(model)
                runChatAction('proceedGuideModel', model.modelId)
              }}
              onQuestionSelect={(questionId) => runChatAction('selectGuideQuestion', questionId)}
              onOpenDetails={(model) => openDetails(model)}
              onSelectVersion={async (model) => {
                selectModel(model)
                await runChatAction('switchModel', model.modelId)
                runChatAction('clearGuideFlow')
                navigate('/agents', {
                  state: {
                    agentBuilder: {
                      openBuilder: true,
                      templateId: guideFlow.template?.id ?? null,
                      selectedModelId: model.modelId,
                    },
                  },
                })
              }}
            />
          ) : null}

          {messages.length === 0 && guideFlow.mode !== 'agent-builder' ? (
            <div className="space-y-6">
              <div>
                <h2 className="display-font text-[clamp(2rem,9vw,2.5rem)] font-semibold">
                  Welcome! I&apos;m here to help you
                </h2>
                <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
                  Start with a quick prompt, upload files or images, or use voice input
                  and keep the full conversation history while switching models.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quickStarts.map((item) => (
                  <Card
                    key={item}
                    className="cursor-pointer"
                    onClick={() => {
                      setDraft(item)
                      runChatAction('sendMessage', item)
                    }}
                  >
                    {item}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
          {isTyping ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:0.12s]" />
              <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:0.24s]" />
              Thinking...
            </div>
          ) : null}
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)]/55 p-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files)
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
              addFiles(event.target.files)
              event.target.value = ''
            }}
          />

          {selectedFiles.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                >
                  <span className="max-w-[160px] truncate sm:max-w-[220px]">{file.name}</span>
                  <span className="text-[var(--text-muted)]">{formatInputFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-full p-0.5 transition hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mb-3 flex flex-wrap gap-2 text-[var(--text-muted)]">
            <button
              type="button"
              onClick={startVoiceCapture}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isListening
                  ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleMediaCapture('camera')}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isRecordingVideo
                  ? 'border-rose-200 bg-rose-500 text-white'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-rose-400 hover:text-rose-500'
              }`}
            >
              {isRecordingVideo ? <Square className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleMediaCapture('screen')}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isSharingScreen
                  ? 'border-emerald-200 bg-emerald-500 text-white'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              {isSharingScreen ? <Square className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() =>
                toast({
                  title: 'Prompt helper',
                  message: 'Use the main input plus uploads or voice to start the request.',
                })
              }
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Wand2 className="h-4 w-4" />
            </button>
            {isListening ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-muted)] px-3 py-2 text-xs text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                Listening...
              </div>
            ) : null}
            {isRecordingVideo ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-2 text-xs text-rose-700">
                <Video className="h-3.5 w-3.5" />
                Recording video...
              </div>
            ) : null}
            {isSharingScreen ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs text-emerald-700">
                <Monitor className="h-3.5 w-3.5" />
                Sharing screen...
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={1}
              placeholder="Send a message, upload files, record video, share your screen, or use voice..."
              className="min-h-[58px] flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.12)]"
            />
            <Button
              className="w-full sm:w-auto"
              onClick={handleSend}
              disabled={!draft.trim() && selectedFiles.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <div className="flex flex-wrap gap-2">
              {composerSuggestionGroups.map((group) => {
                const isActive = activeSuggestionGroup === group.id
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveSuggestionGroup(group.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      isActive
                        ? 'border-transparent bg-[#1d1b18] text-white'
                        : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {group.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)] md:grid-cols-2">
              {activeComposerSuggestions.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => applyComposerSuggestion(prompt)}
                  className="flex items-start gap-2 text-left transition hover:text-[var(--accent)]"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-muted)]" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ModelDrawer
        isOpen={Boolean(detailModel)}
        onClose={() => setDetailModel(null)}
        model={detailModel}
        initialTab={detailTab}
      />
    </>
  )
}

