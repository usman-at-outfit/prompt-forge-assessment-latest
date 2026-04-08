import { create } from 'zustand'
import { promptService } from '../services/promptService'
import { useAuthStore } from './authStore'
import { useModelStore } from './modelStore'
import { useTokenStore } from './tokenStore'

export const usePromptStore = create((set, get) => ({
  currentStep: 0,
  entryMessage: '',
  answers: {
    useCase: '',
    audience: '',
    experience: '',
    followUp: '',
  },
  generatedPrompt: null,
  promptHistory: [],
  isGenerating: false,
  actions: {
    startFlow(useCase, entryMessage = '') {
      useModelStore.getState().actions.clearRecommendations()
      set((state) => ({
        currentStep: useCase ? 1 : 0,
        entryMessage: entryMessage ?? '',
        answers: {
          useCase: useCase ?? '',
          audience: '',
          experience: '',
          followUp: '',
        },
        generatedPrompt: null,
        isGenerating: false,
        promptHistory: state.promptHistory,
      }))
    },
    nextStep() {
      set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) }))
    },
    prevStep() {
      set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) }))
    },
    setStep(step) {
      set({ currentStep: Math.max(0, Math.min(4, step)) })
    },
    setEntryMessage(entryMessage) {
      set({ entryMessage: entryMessage ?? '' })
    },
    setAnswer(key, value) {
      set((state) => ({
        answers: {
          ...state.answers,
          [key]: value,
        },
        generatedPrompt: null,
      }))
    },
    async generatePrompt() {
      const authState = useAuthStore.getState()
      set({ isGenerating: true })
      const result = await promptService.generate({
        answers: get().answers,
        sessionId: authState.sessionId,
        userId: authState.user?.id ?? null,
      })
      set((state) => ({
        isGenerating: false,
        generatedPrompt: result,
        promptHistory: [
          {
            id: result.promptId,
            promptText: result.promptText,
            modelRecommendations: result.suggestedModels,
            estimatedTokens: result.estimatedTokens,
            templateUsed: result.templateUsed,
            createdAt: new Date().toISOString(),
            answers: state.answers,
          },
          ...state.promptHistory,
        ],
      }))

      await useModelStore.getState().actions.recommend({
        useCase: get().answers.useCase,
        audience: get().answers.audience,
        experience: get().answers.experience,
        promptText: result.promptText,
        sessionId: authState.sessionId,
      })
      await useTokenStore.getState().actions.loadSession(authState.sessionId)
      return result
    },
    async regeneratePrompt(promptId) {
      const authState = useAuthStore.getState()
      const currentPrompt = get().generatedPrompt
      const result = await promptService.regenerate({
        promptId,
        sessionId: authState.sessionId,
        userId: authState.user?.id ?? null,
        promptText: currentPrompt?.promptText,
        answers: get().answers,
      })
      set((state) => ({
        generatedPrompt: {
          ...state.generatedPrompt,
          promptId: result.promptId,
          promptText: result.promptText,
          estimatedTokens: result.estimatedTokens,
        },
      }))
      await useTokenStore.getState().actions.loadSession(authState.sessionId)
      return result
    },
    async editPrompt(promptId, promptText) {
      const authState = useAuthStore.getState()
      const result = await promptService.update(promptId, {
        sessionId: authState.sessionId,
        userId: authState.user?.id ?? null,
        promptText,
      })
      set((state) => ({
        generatedPrompt: state.generatedPrompt
          ? {
              ...state.generatedPrompt,
              promptId: result.promptId,
              promptText: result.promptText,
              estimatedTokens: result.estimatedTokens,
            }
          : state.generatedPrompt,
        promptHistory: state.promptHistory.map((entry) =>
          entry.id === promptId
            ? {
                ...entry,
                promptText: result.promptText,
                estimatedTokens: result.estimatedTokens,
              }
            : entry,
        ),
      }))
      await useTokenStore.getState().actions.loadSession(authState.sessionId)
      return result
    },
    async deletePrompt(promptId) {
      const sessionId = useAuthStore.getState().sessionId
      await promptService.remove(promptId, sessionId)
      set((state) => ({
        generatedPrompt:
          state.generatedPrompt?.promptId === promptId ? null : state.generatedPrompt,
        promptHistory: state.promptHistory.filter((entry) => entry.id !== promptId),
      }))
      useModelStore.getState().actions.clearRecommendations()
    },
    hydrate(session = {}) {
      set({
        promptHistory: session.promptHistory ?? [],
      })
    },
    reset() {
      useModelStore.getState().actions.clearRecommendations()
      set({
        currentStep: 0,
        entryMessage: '',
        answers: {
          useCase: '',
          audience: '',
          experience: '',
          followUp: '',
        },
        generatedPrompt: null,
        promptHistory: [],
        isGenerating: false,
      })
    },
  },
}))
