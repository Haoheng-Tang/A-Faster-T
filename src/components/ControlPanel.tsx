import React, { useRef, useState } from 'react'

interface Props {
  showBus: boolean
  setShowBus: (v: boolean) => void
  showTrain: boolean
  setShowTrain: (v: boolean) => void
  liveMode: boolean
  setLiveMode: (v: boolean) => void
  estimateTraffic: () => void
  adapter: string
  setAdapter: (a: string) => void
  adapterUrl?: string
  setAdapterUrl?: (u: string) => void
  onClose?: () => void
}

export default function ControlPanel({
  showBus,
  setShowBus,
  showTrain,
  setShowTrain,
  liveMode,
  setLiveMode,
  estimateTraffic,
  adapter,
  setAdapter,
  adapterUrl,
  setAdapterUrl,
  onClose,
}: Props): JSX.Element {
  // Date and hour state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedHour, setSelectedHour] = useState<string>('12:00');
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ x: 16, y: 80 })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onPointerDown = (e: React.PointerEvent) => {
    const el = panelRef.current
    if (!el) return
    // ignore pointerdown if it originated from a control (like the close button)
    const target = e.target as HTMLElement
    if (target && (target.closest('button') || target.closest('input') || target.closest('select'))) {
      return
    }
    dragging.current = true
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    const rect = el.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const nx = e.clientX - offset.current.x
    const ny = e.clientY - offset.current.y
    setPos({ x: Math.max(8, nx), y: Math.max(8, ny) })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const el = panelRef.current
    if (!el) return
    dragging.current = false
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const style: React.CSSProperties = { left: pos.x, top: pos.y, position: 'fixed', zIndex: 1100 }

  return (
    <div
      ref={panelRef}
      className="card p-3"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="group"
    >
      <div className="d-flex justify-content-between align-items-center mb-2" style={{ cursor: 'grab', userSelect: 'none' }} onPointerDown={(e) => onPointerDown(e)}>
        <strong>Controls</strong>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onClose && onClose()
          }}
          onPointerDown={(e) => {
            // prevent the pointerdown from being treated as drag start
            e.stopPropagation()
          }}
        >
          ✕
        </button>
      </div>
      

      <div className="mb-2">
        <label className="form-label">Date</label>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="form-label">Hour</label>
        <input
          type="time"
          className="form-control"
          value={selectedHour}
          onChange={e => setSelectedHour(e.target.value)}
          step="300"
        />
      </div>

      <div className="mb-2">
        <label className="form-label">Data Adapter</label>
        <select
          className="form-select"
          value={adapter}
          onChange={(e) => {
            setAdapter(e.target.value)
            // attempt to load data immediately when adapter changes
            estimateTraffic()
          }}
        >
          
          <option value="openStreetMap">OpenStreetMap</option>
          <option value="unrealVM">Unreal Engine</option>
        </select>
      </div>

      <div className="mt-3 d-grid">
        <button className="btn btn-primary" onClick={estimateTraffic}>
          Estimate
        </button>
        
      </div>
    </div>
  )
}
