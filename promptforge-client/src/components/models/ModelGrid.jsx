import { ModelCard } from './ModelCard'

export function ModelGrid(props) {
  const { models = [], selectedModelId } = props
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {models.map((model) => (
        <ModelCard
          key={model.modelId}
          model={model}
          selected={selectedModelId === model.modelId}
          {...props}
        />
      ))}
    </div>
  )
}
