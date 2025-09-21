import React, { useRef, useState } from 'react'

interface Props {
  showBus: boolean
  setShowBus: (v: boolean) => void
  showTrain: boolean
  setShowTrain: (v: boolean) => void
  liveMode: boolean
  setLiveMode: (v: boolean) => void
  loadData: () => void
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
  loadData,
  adapter,
  setAdapter,
  adapterUrl,
  setAdapterUrl,
  onClose,
}: Props): JSX.Element {
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
        <label className="form-label">Data Adapter</label>
        <select
          className="form-select"
          value={adapter}
          onChange={(e) => {
            setAdapter(e.target.value)
            // attempt to load data immediately when adapter changes
            loadData()
          }}
        >
          
          <option value="openStreetMap">OpenStreetMap</option>
          <option value="unrealVM">Unreal VM</option>
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label">Adapter URL (optional)</label>
        <input
          className="form-control"
          value={adapterUrl ?? ''}
          onChange={(e) => setAdapterUrl && setAdapterUrl(e.target.value)}
          placeholder="http://..."
        />
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="chkBus"
          checked={showBus}
          onChange={(e) => setShowBus(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="chkBus">
          Show Buses
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="chkTrain"
          checked={showTrain}
          onChange={(e) => setShowTrain(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="chkTrain">
          Show Trains
        </label>
      </div>

      <div className="form-check form-switch mt-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="switchLive"
          checked={liveMode}
          onChange={(e) => setLiveMode(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="switchLive">
          Live Mode
        </label>
      </div>

      <div className="mt-3 d-grid">
        <button className="btn btn-primary" onClick={loadData}>
          Load Data
        </button>
        <button className="btn btn-outline-secondary mt-2">Reset View</button>
      </div>
    </div>
  )
}
