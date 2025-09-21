import React, { useState, useEffect } from 'react'
import { DashboardCircle } from './DashboardCircle'

export default function DiagramsWindow(): JSX.Element {
  const [demand, setDemand] = useState(92845)
  const [eff, setEff] = useState(105)

  useEffect(() => {
    const id = setInterval(() => {
      setDemand(prev => Math.max(90000, Math.min(95000, prev + Math.round((Math.random() - 0.5) * 1000))))
      setEff(prev => Math.max(85, Math.min(95, prev + Math.round((Math.random() - 0.5) * 3))))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ height: '100vh', width: '100%', background: 'linear-gradient(180deg,#0f0f0f,#111111)', padding: 24, color: '#e5e7eb', boxSizing: 'border-box', position: 'relative', overflow: 'visible' }}>
      <div style={{ height: '100%', display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        <DashboardCircle type="demand" value={demand} label="Current Demand" sublabel="Current Capacity" color="#00f5ff" glowColor="#00f5ff" progress={75} />
        <DashboardCircle type="efficiency" value={eff} label="System Efficiency" sublabel="Predicted Demand Next 24 HRS" color="#ff8c42" glowColor="#ff8c42" progress={90} />
      </div>
    </div>
  )
}
