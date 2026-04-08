import {
  Image as ImageIcon,
  Mic,
  Monitor,
  Paperclip,
  Send,
  Sparkles,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from '../ui/Toast'
import {
  formatInputFileSize,
  mergeInputFiles,
  startMediaCapture,
} from '../../utils/mediaInput'

export function ActionComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel = "Let's go",
  trailingLabel = 'Agent',
}) {
  const recognitionRef = useRef(null)
  const generalInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [captureSession, setCaptureSession] = useState(null)
  const [captureMode, setCaptureMode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(
    () => () => {
      recognitionRef.current?.stop?.()
      captureSession?.cancel?.()
    },
    [captureSession],
  )

  function appendFiles(nextFiles) {
    if (!nextFiles.length) return
    setFiles((current) => mergeInputFiles(current, nextFiles))
  }

  function openPicker(ref) {
    ref.current?.click()
  }

  function stopListening() {
    recognitionRef.current?.stop?.()
    recognitionRef.current = null
    setIsListening(false)
  }

  async function stopCapture(shouldAttachFile = true) {
    if (!captureSession) {
      setCaptureMode('')
      return null
    }

    const nextMethod = shouldAttachFile ? captureSession.stop : captureSession.cancel
    const recordedFile = await nextMethod.call(captureSession)

    if (recordedFile && shouldAttachFile) {
      appendFiles([recordedFile])
    }

    setCaptureSession(null)
    setCaptureMode('')
    return recordedFile
  }

  async function startListening() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      toast({
        title: 'Voice input unavailable',
        message: 'This browser does not support speech recognition.',
        type: 'error',
      })
      return
    }

    if (isListening) {
      stopListening()
      return
    }

    if (captureSession) {
      await stopCapture()
    }

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
        title: 'Voice input stopped',
        message: 'We could not capture your speech. Please try again.',
        type: 'error',
      })
    }
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results ?? [])
        .flatMap((result) => Array.from(result))
        .map((entry) => entry.transcript)
        .join(' ')
        .trim()

      if (transcript) {
        onChange(value ? `${value} ${transcript}` : transcript)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  async function toggleCapture(kind) {
    if (captureMode === kind && captureSession) {
      await stopCapture()
      return
    }

    if (isListening) {
      stopListening()
    }

    if (captureSession) {
      await stopCapture()
    }

    try {
      const session = await startMediaCapture(kind)
      setCaptureSession(session)
      setCaptureMode(kind)
    } catch (error) {
      toast({
        title: kind === 'screen' ? 'Screen share unavailable' : 'Video capture unavailable',
        message: error?.message ?? 'We could not start media capture.',
        type: 'error',
      })
    }
  }

  async function handleSubmit() {
    if (!value.trim() && !files.length) return

    setIsSubmitting(true)
    try {
      await onSubmit({ text: value.trim(), files })
      setFiles([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const actions = [
    {
      key: 'voice',
      label: 'Voice input',
      icon: Mic,
      active: isListening,
      onClick: startListening,
    },
    {
      key: 'attach',
      label: 'Attach files',
      icon: Paperclip,
      onClick: () => openPicker(generalInputRef),
    },
    {
      key: 'image',
      label: 'Upload images',
      icon: ImageIcon,
      onClick: () => openPicker(imageInputRef),
    },
    {
      key: 'video',
      label: 'Video input',
      icon: Video,
      active: captureMode === 'camera',
      onClick: () => toggleCapture('camera'),
    },
    {
      key: 'screen',
      label: 'Share screen',
      icon: Monitor,
      active: captureMode === 'screen',
      onClick: () => toggleCapture('screen'),
    },
    {
      key: 'spark',
      label: 'Spark',
      icon: Sparkles,
      onClick: () =>
        onChange(value || 'Help me design an AI agent that solves this workflow clearly.'),
    },
  ]

  return (
    <div className="rounded-[24px] border border-black/10 bg-white shadow-[0_12px_28px_rgba(36,30,21,0.06)]">
      <div className="border-b border-black/8 px-5 py-4">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-11 w-full bg-transparent text-[15px] text-[#1c1712] outline-none placeholder:text-[#a49380]"
        />
      </div>

      {files.length ? (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs text-[#9a5926]"
            >
              <span>
                {file.name} - {formatInputFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFiles((current) =>
                    current.filter(
                      (entry) =>
                        !(
                          entry.name === file.name &&
                          entry.size === file.size &&
                          entry.lastModified === file.lastModified
                        ),
                    ),
                  )
                }
                className="inline-flex h-4 w-4 items-center justify-center rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <button
                key={action.key}
                type="button"
                title={action.label}
                onClick={action.onClick}
                className={`flex h-11 w-11 items-center justify-center rounded-[12px] border transition ${
                  action.active
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-black/10 bg-[#fcfaf7] text-[#7a6a58] hover:border-[#e5c4a7]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <div className="rounded-full border border-black/10 bg-[#f5f1ea] px-4 py-2 text-sm font-medium text-[#5d5146]">
            {trailingLabel}
          </div>
          <button
            type="button"
            title={submitLabel}
            disabled={isSubmitting || (!value.trim() && !files.length)}
            onClick={handleSubmit}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--accent)] px-3 text-white shadow-[0_12px_28px_rgba(var(--accent-rgb),0.2)] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        ref={generalInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          appendFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          appendFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </div>
  )
}

