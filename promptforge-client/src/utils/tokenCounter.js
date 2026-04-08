export function estimateTokens(text = '') {
  return Math.ceil(String(text).length / 4)
}

export function estimateCost(tokens = 0, modelId = 'gpt-4o', models = []) {
  const model = models.find((entry) => entry.modelId === modelId)
  if (!model) return 0
  return Number(((tokens / 1_000_000) * model.outputPricePer1M).toFixed(6))
}
