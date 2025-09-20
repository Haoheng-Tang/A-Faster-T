import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import ControlPanel from './components/ControlPanel'
import MapArea from './components/MapArea'
import { fetchFromAdapter } from './services/dataAdapters'
import screenshot from './resources/Screenshot 2025-09-20 160708.png'
import subway from './resources/SubwayMapExample.png'


export default function App(): JSX.Element {
  const [showBus, setShowBus] = useState<boolean>(true)
  const [showTrain, setShowTrain] = useState<boolean>(true)
  const [liveMode, setLiveMode] = useState<boolean>(false)
  const [data, setData] = useState<any[]>([])

  const [adapter, setAdapter] = useState<string>('mock')
  const [adapterUrl, setAdapterUrl] = useState<string>('')
  const [showControls, setShowControls] = useState<boolean>(true)

  const loadData = async () => {
    const d = await fetchFromAdapter(adapter, { url: adapterUrl, live: liveMode })
    setData(d)
  }

  // map adapter key to a resource image
  const adapterImageMap: Record<string, string | undefined> = {
    mock: undefined,
    openStreetMap: screenshot,
    unrealVM: subway,
  }
  const backgroundImage = adapterImageMap[adapter]
  const [section, setSection] = useState<number>(0) // 0 = map, 1 = charts

  const scrollDown = () => {
    try {
      window.scrollBy({ top: window.innerHeight, left: 0, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, window.innerHeight)
    }
    setSection(1)
  }

  const scrollUp = () => {
    try {
      window.scrollBy({ top: -window.innerHeight, left: 0, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }
    setSection(0)
  }

  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY || window.pageYOffset || 0
      const s = pos >= window.innerHeight / 2 ? 1 : 0
      setSection(s)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="p-0">
      <div className="vh-section" id="map-section">
        
        {showControls && (
          <ControlPanel
            showBus={showBus}
            setShowBus={setShowBus}
            showTrain={showTrain}
            setShowTrain={setShowTrain}
            liveMode={liveMode}
            setLiveMode={setLiveMode}
            loadData={loadData}
            adapter={adapter}
            setAdapter={setAdapter}
            adapterUrl={adapterUrl}
            setAdapterUrl={setAdapterUrl}
            onClose={() => setShowControls(false)}
          />
        )}
        <Navbar title="Faster T" variant="transparent" onToggleControls={() => setShowControls((s) => !s)} />
        <MapArea data={data} showBus={showBus} showTrain={showTrain} backgroundImage={backgroundImage} />
        {section === 0 && (
          <button className="scroll-down-btn" aria-label="Scroll down" onClick={scrollDown}>▾</button>
        )}
      </div>

      <div className="vh-section charts-section" id="charts-section">
        <div style={{ width: '90%', maxWidth: 1200 }}>
          <h3>System Status</h3>
          <p>Placeholder for diagrams and graphs. Paste your HTML here later.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 220 }}>Chart placeholder 1</div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 220 }}>Chart placeholder 2</div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 220 }}>Chart placeholder 3</div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 220 }}>Chart placeholder 4</div>
          </div>
        </div>
        {section === 1 && (
          <button className="scroll-down-btn" aria-label="Scroll up" onClick={scrollUp}>▴</button>
        )}
      </div>
    </div>
  )
}
