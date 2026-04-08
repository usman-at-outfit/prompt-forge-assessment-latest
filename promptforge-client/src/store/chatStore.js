import { create } from 'zustand'
import api from '../services/api'
import { useAuthStore } from './authStore'
import { useModelStore } from './modelStore'
import { useTokenStore } from './tokenStore'
import { estimateTokens } from '../utils/tokenCounter'

function createLocalMessage(role, content, modelId) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    modelId,
    tokens: estimateTokens(content),
    timestamp: new Date().toISOString(),
  }
}

function normalizeMessagePayload(payload) {
  if (typeof payload === 'string') {
    return { content: payload, files: [] }
  }

  return {
    content: payload?.content ?? '',
    files: Array.isArray(payload?.files) ? payload.files : [],
  }
}

function buildOptimisticPreview(content, files) {
  const previewLines = files.map(
    (file) =>
      `- ${file.name}: ${file.type || 'attachment'}, ${(file.size / 1024).toFixed(1)} KB`,
  )

  return [content.trim(), files.length ? 'Attachments:' : '', ...previewLines]
    .filter(Boolean)
    .join('\n')
}

const defaultGuideFlow = {
  mode: null,
  template: null,
  prompt: '',
  step: null,
  audience: null,
  selectedModelId: null,
  selectedQuestionId: null,
}

function normalizePendingComposer(payload = {}) {
  return {
    content: payload.content ?? '',
    files: Array.isArray(payload.files) ? payload.files : [],
    autoSend: payload.autoSend !== false,
  }
}

function updateGuideFlow(updater) {
  useChatStore.setState((state) => ({
    guideFlow: updater(state.guideFlow),
  }))
}

async function performSendMessage(payload) {
  const { content, files } = normalizeMessagePayload(payload)
  if (!content.trim() && files.length === 0) return

  const authState = useAuthStore.getState()
  const sessionId = authState.sessionId ?? useChatStore.getState().sessionId
  const userId = authState.user?.id ?? null
  const modelId =
    useChatStore.getState().activeModel ??
    useModelStore.getState().selectedModel?.modelId ??
    'gpt-4o'
  const optimisticUserMessage = createLocalMessage(
    'user',
    buildOptimisticPreview(content, files),
    modelId,
  )

  useChatStore.setState((state) => ({
    sessionId,
    isTyping: true,
    messages: [...state.messages, optimisticUserMessage],
  }))

  try {
    let data

    if (files.length > 0) {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('modelId', modelId)
      formData.append('sessionId', sessionId)
      if (userId) {
        formData.append('userId', userId)
      }
      files.forEach((file) => formData.append('files', file))
      const response = await api.post('/chat/message', formData)
      data = response.data
    } else {
      const response = await api.post('/chat/message', {
        content,
        modelId,
        sessionId,
        userId,
      })
      data = response.data
    }

    useChatStore.setState((state) => ({
      isTyping: false,
      messages: [...state.messages, data.message],
    }))
  } catch {
    const fallbackAssistant = createLocalMessage(
      'assistant',
      files.length > 0
        ? 'I could not finish the live upload analysis, but your files were captured in the message preview. Please retry once the backend is reachable.'
        : 'I could not reach the live backend, so here is a local fallback reply to keep the flow moving.',
      modelId,
    )
    useChatStore.setState((state) => ({
      isTyping: false,
      messages: [...state.messages, fallbackAssistant],
    }))
  }

  await useTokenStore.getState().actions.loadSession(sessionId)
}

async function performSwitchModel(modelId) {
  const sessionId = useAuthStore.getState().sessionId ?? useChatStore.getState().sessionId
  const fallbackModel =
    useModelStore.getState().selectedModel ??
    useModelStore.getState().allModels.find((model) => model.modelId === modelId) ??
    null

  useChatStore.setState((state) => ({
    isSwitching: true,
    activeModel: modelId,
    modelHistory: Array.from(new Set([...state.modelHistory, modelId])),
  }))

  try {
    const { data } = await api.post('/chat/switch-model', {
      newModelId: modelId,
      sessionId,
    })
    const nextModel =
      data?.model?.modelId
        ? data.model
        : useModelStore.getState().allModels.find((model) => model.modelId === modelId) ??
          fallbackModel

    if (nextModel) {
      useModelStore.getState().actions.selectModel(nextModel)
    }

    useChatStore.setState((state) => ({
      isSwitching: false,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Switched to ${data.model.name} - History preserved`,
          modelId,
          tokens: 0,
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  } catch {
    if (fallbackModel) {
      useModelStore.getState().actions.selectModel(fallbackModel)
    }

    useChatStore.setState((state) => ({
      isSwitching: false,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Switched to ${fallbackModel?.name ?? modelId} - History preserved`,
          modelId,
          tokens: 0,
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  }
}

export const useChatStore = create((set, get) => ({
  messages: [],
  activeModel: 'gpt-4o',
  modelHistory: ['gpt-4o'],
  sessionId: null,
  isTyping: false,
  isSwitching: false,
  pendingComposer: null,
  guideFlow: { ...defaultGuideFlow },
  actions: {
    initSession(session) {
      set({
        sessionId: session?.sessionId ?? null,
        messages: session?.chatHistory ?? session?.messages ?? [],
        activeModel: session?.activeModel ?? 'gpt-4o',
        modelHistory: session?.modelHistory?.length ? session.modelHistory : ['gpt-4o'],
      })
    },
    async loadHistory(sessionId) {
      if (!sessionId) return null
      try {
        const { data } = await api.get('/chat/history', { params: { sessionId } })
        set({
          sessionId,
          messages: data.messages ?? [],
          activeModel: data.activeModel ?? 'gpt-4o',
          modelHistory: data.modelHistory ?? ['gpt-4o'],
        })
        return data
      } catch {
        return null
      }
    },
    async sendMessage(payload) {
      await performSendMessage(payload)
    },
    async switchModel(modelId) {
      await performSwitchModel(modelId)
    },
    async clearHistory() {
      const sessionId = useAuthStore.getState().sessionId ?? get().sessionId
      try {
        await api.delete('/chat/history', { params: { sessionId } })
      } catch {
        // noop
      }
      set({ messages: [] })
      await useTokenStore.getState().actions.loadSession(sessionId)
    },
    startAgentGuide(payload = {}) {
      useChatStore.setState({
        guideFlow: {
          mode: 'agent-builder',
          template: payload.template ?? null,
          prompt:
            payload.prompt ??
            payload.template?.hubPrompt ??
            'Help me build an AI agent - walk me through it',
          step: 'audience',
          audience: null,
          selectedModelId: null,
          selectedQuestionId: null,
        },
      })
    },
    setGuideAudience(audience) {
      updateGuideFlow((guideFlow) => ({
        ...guideFlow,
        audience,
        step: 'recommendations',
        selectedModelId: null,
        selectedQuestionId: null,
      }))
    },
    proceedGuideModel(modelId) {
      updateGuideFlow((guideFlow) => ({
        ...guideFlow,
        selectedModelId: modelId,
        selectedQuestionId: null,
        step: 'deep-dive',
      }))
    },
    selectGuideQuestion(questionId) {
      updateGuideFlow((guideFlow) => ({
        ...guideFlow,
        selectedQuestionId:
          guideFlow.selectedQuestionId === questionId ? null : questionId,
      }))
    },
    clearGuideFlow() {
      useChatStore.setState({ guideFlow: { ...defaultGuideFlow } })
    },
    hydrate(snapshot = {}) {
      set({
        messages: snapshot.messages ?? [],
        activeModel: snapshot.activeModel ?? 'gpt-4o',
        modelHistory: snapshot.modelHistory ?? ['gpt-4o'],
        sessionId: snapshot.sessionId ?? null,
        guideFlow: snapshot.guideFlow ?? { ...defaultGuideFlow },
      })
    },
  },
}))

export function resetChatSessionState() {
  useChatStore.setState({
    messages: [],
    activeModel: 'gpt-4o',
    modelHistory: ['gpt-4o'],
    sessionId: null,
    isTyping: false,
    isSwitching: false,
    pendingComposer: null,
    guideFlow: { ...defaultGuideFlow },
  })
}

export function runChatAction(actionName, ...args) {
  const action = useChatStore.getState().actions?.[actionName]
  if (typeof action === 'function') {
    return action(...args)
  }

  if (actionName === 'switchModel' && args[0]) {
    return performSwitchModel(args[0])
  }

  if (actionName === 'sendMessage') {
    return performSendMessage(args[0])
  }

  if (actionName === 'startAgentGuide') {
    const payload = args[0] ?? {}
    useChatStore.setState({
      guideFlow: {
        mode: 'agent-builder',
        template: payload.template ?? null,
        prompt:
          payload.prompt ??
          payload.template?.hubPrompt ??
          'Help me build an AI agent - walk me through it',
        step: 'audience',
        audience: null,
        selectedModelId: null,
        selectedQuestionId: null,
      },
    })
    return undefined
  }

  if (actionName === 'setGuideAudience') {
    updateGuideFlow((guideFlow) => ({
      ...guideFlow,
      audience: args[0],
      step: 'recommendations',
      selectedModelId: null,
      selectedQuestionId: null,
    }))
    return undefined
  }

  if (actionName === 'proceedGuideModel') {
    updateGuideFlow((guideFlow) => ({
      ...guideFlow,
      selectedModelId: args[0],
      selectedQuestionId: null,
      step: 'deep-dive',
    }))
    return undefined
  }

  if (actionName === 'selectGuideQuestion') {
    updateGuideFlow((guideFlow) => ({
      ...guideFlow,
      selectedQuestionId:
        guideFlow.selectedQuestionId === args[0] ? null : args[0],
    }))
    return undefined
  }

  if (actionName === 'clearGuideFlow') {
    useChatStore.setState({ guideFlow: { ...defaultGuideFlow } })
    return undefined
  }

  console.warn(`[chatStore] Missing action: ${actionName}`)
  return undefined
}

export function queuePendingComposer(payload = {}) {
  useChatStore.setState({
    pendingComposer: normalizePendingComposer(payload),
  })
}

export function consumePendingComposer() {
  const pendingComposer = useChatStore.getState().pendingComposer
  useChatStore.setState({ pendingComposer: null })
  return pendingComposer
}
