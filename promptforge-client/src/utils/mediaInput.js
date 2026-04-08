const MEDIA_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
]

export function mergeInputFiles(currentFiles, nextFiles) {
  const merged = [...currentFiles]

  nextFiles.forEach((file) => {
    const exists = merged.some(
      (entry) =>
        entry.name === file.name &&
        entry.size === file.size &&
        entry.lastModified === file.lastModified,
    )

    if (!exists) {
      merged.push(file)
    }
  })

  return merged
}

export function formatInputFileSize(size) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

function getSupportedMediaMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return MEDIA_MIME_TYPES.find((value) => MediaRecorder.isTypeSupported(value)) ?? ''
}

async function getCaptureStream(kind) {
  if (!navigator.mediaDevices) {
    throw new Error('Media devices are not available in this browser.')
  }

  if (kind === 'screen') {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      })
    } catch {
      return navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      })
    }
  }

  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
}

export async function startMediaCapture(kind) {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not supported in this browser.')
  }

  const stream = await getCaptureStream(kind)
  const mimeType = getSupportedMediaMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks = []
  const extension = (recorder.mimeType || mimeType || '').includes('mp4') ? 'mp4' : 'webm'
  const baseName = kind === 'screen' ? 'screen-recording' : 'camera-recording'
  let finishedResolve
  let finishedReject
  let cancelled = false

  const cleanup = () => {
    stream.getTracks().forEach((track) => track.stop())
  }

  const finished = new Promise((resolve, reject) => {
    finishedResolve = resolve
    finishedReject = reject
  })

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data)
    }
  })

  recorder.addEventListener('error', (event) => {
    cleanup()
    finishedReject?.(event.error || new Error('Media recording failed.'))
  })

  recorder.addEventListener('stop', () => {
    const blob = new Blob(chunks, {
      type: recorder.mimeType || mimeType || 'video/webm',
    })
    cleanup()

    if (cancelled || !blob.size) {
      finishedResolve?.(null)
      return
    }

    finishedResolve?.(
      new File([blob], `${baseName}-${Date.now()}.${extension}`, {
        type: blob.type || 'video/webm',
        lastModified: Date.now(),
      }),
    )
  })

  stream.getTracks().forEach((track) => {
    track.addEventListener(
      'ended',
      () => {
        if (recorder.state !== 'inactive') {
          recorder.stop()
        }
      },
      { once: true },
    )
  })

  recorder.start(250)

  return {
    stream,
    finished,
    async stop() {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
      return finished
    },
    async cancel() {
      cancelled = true
      if (recorder.state !== 'inactive') {
        recorder.stop()
      } else {
        cleanup()
        finishedResolve?.(null)
      }
      return finished
    },
  }
}
