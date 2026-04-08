import { create } from 'zustand'
import { modelService } from '../services/modelService'

function getPricingBucket(model) {
  const totalPrice = Number(model.inputPricePer1M ?? 0) + Number(model.outputPricePer1M ?? 0)
  if (model.isFree || totalPrice === 0) return 'Free tier'
  if (totalPrice <= 5) return 'Pay-per-use'
  if (totalPrice <= 20) return 'Subscription'
  return 'Enterprise'
}

function matchesCategoryValue(model, category) {
  if (!category) return true
  if (category === 'open-source') return Boolean(model.isOpenSource)
  if (category === 'image-gen') return model.multimodal || model.category.includes('vision')
  if (category === 'audio') return model.category.includes('audio')
  return model.category.includes(category)
}

function applyFilters(models, filters) {
  return models.filter((model) => {
    const matchesLabs =
      filters.labs?.length > 0
        ? filters.labs.includes(model.lab)
        : filters.lab
          ? model.lab === filters.lab
          : true
    const matchesCategory = matchesCategoryValue(model, filters.category)
    const matchesPrice =
      filters.maxPrice != null
        ? model.inputPricePer1M + model.outputPricePer1M <= filters.maxPrice
        : true
    const matchesRating = filters.minRating ? model.rating >= filters.minRating : true
    const matchesLicenses =
      filters.licenses?.length > 0
        ? filters.licenses.includes(model.license)
        : filters.license
          ? model.license.toLowerCase().includes(filters.license.toLowerCase())
          : true
    const matchesPricing =
      filters.pricingModels?.length > 0
        ? filters.pricingModels.includes(getPricingBucket(model))
        : true
    const searchTerm = filters.search?.toLowerCase().trim()
    const matchesSearch = searchTerm
      ? [model.name, model.lab, model.description, ...model.tags]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm)
      : true

    return (
      matchesCategory &&
      matchesLabs &&
      matchesPrice &&
      matchesRating &&
      matchesLicenses &&
      matchesPricing &&
      matchesSearch
    )
  })
}

export const useModelStore = create((set, get) => ({
  allModels: [],
  filteredModels: [],
  recommended: [],
  selectedModel: null,
  labs: [],
  compareSelection: [],
  filters: {
    category: '',
    lab: '',
    labs: [],
    maxPrice: null,
    minRating: null,
    license: '',
    licenses: [],
    pricingModels: [],
    search: '',
  },
  isLoading: false,
  actions: {
    async loadModels(filters = {}) {
      set({ isLoading: true })
      const response = await modelService.list(filters)
      const items = response.items ?? []
      const nextFilters = { ...get().filters, ...filters }
      set({
        allModels: items,
        filteredModels: applyFilters(items, nextFilters),
        isLoading: false,
      })
      return items
    },
    async loadLabs() {
      const labs = await modelService.labs()
      set({ labs })
      return labs
    },
    setFilter(key, value) {
      const filters = { ...get().filters, [key]: value }
      set({
        filters,
        filteredModels: applyFilters(get().allModels, filters),
      })
    },
    toggleListFilter(key, value) {
      const current = get().filters[key] ?? []
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
      const filters = { ...get().filters, [key]: next }
      set({
        filters,
        filteredModels: applyFilters(get().allModels, filters),
      })
    },
    clearFilters() {
      const filters = {
        category: '',
        lab: '',
        labs: [],
        maxPrice: null,
        minRating: null,
        license: '',
        licenses: [],
        pricingModels: [],
        search: '',
      }
      set({
        filters,
        filteredModels: applyFilters(get().allModels, filters),
      })
    },
    selectModel(model) {
      set({ selectedModel: model })
    },
    clearRecommendations() {
      set({ recommended: [] })
    },
    async recommend(payload) {
      const result = await modelService.recommend(payload)
      set({ recommended: result.recommendations ?? [] })
      return result
    },
    async compare(ids) {
      const compared = await modelService.compare(ids)
      set({ compareSelection: compared })
      return compared
    },
    hydrate(snapshot = {}) {
      set({
        allModels: snapshot.allModels ?? get().allModels,
        filteredModels: snapshot.filteredModels ?? get().filteredModels,
        recommended: snapshot.recommended ?? [],
        selectedModel: snapshot.selectedModel ?? null,
      })
    },
  },
}))
