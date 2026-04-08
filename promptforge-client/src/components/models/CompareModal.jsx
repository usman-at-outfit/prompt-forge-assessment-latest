import { Modal } from '../ui/Modal'

export function CompareModal({ isOpen, onClose, models = [] }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Models" className="max-w-6xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[var(--text-muted)]">
            <tr>
              <th className="pb-3 pr-4">Model</th>
              {models.map((model) => (
                <th key={model.modelId} className="pb-3 pr-4">
                  {model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-top">
            {[
              ['Lab', (model) => model.lab],
              ['Context', (model) => `${(model.contextWindow / 1000).toFixed(0)}K`],
              ['Price', (model) => `$${model.inputPricePer1M} / $${model.outputPricePer1M}`],
              ['Speed', (model) => model.speed],
              ['License', (model) => model.license],
              ['Multimodal', (model) => (model.multimodal ? 'Yes' : 'No')],
            ].map(([label, getter]) => (
              <tr key={label} className="border-t border-[var(--border)]">
                <td className="py-3 pr-4 text-[var(--text-muted)]">{label}</td>
                {models.map((model) => (
                  <td key={`${model.modelId}-${label}`} className="py-3 pr-4 text-[var(--text-primary)]">
                    {getter(model)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
