import React from 'react'

export interface Item {
  id: string
  type: 'bus' | 'train' | 'other'
  label: string
  lat?: number
  lon?: number
}

interface Props {
  data: Item[]
  showBus: boolean
  showTrain: boolean
  backgroundImage?: string
}

export default function MapArea({ data, showBus, showTrain, backgroundImage }: Props): JSX.Element {
  const filtered = data.filter((d) => {
    if (d.type === 'bus' && !showBus) return false
    if (d.type === 'train' && !showTrain) return false
    return true
  })

  return (
    <div className="map-fullscreen">
      {backgroundImage ? (
        <img src={backgroundImage} alt="background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div className="map-placeholder">
          <span className="text-muted">Map visualization will appear here</span>
        </div>
      )}
      {/* Hidden list for now; developers can inspect via React devtools */}
      <div style={{ display: 'none' }}>
        {filtered.map((item) => (
          <div key={item.id}>[{item.type}] {item.label}</div>
        ))}
      </div>
    </div>
  )
}
