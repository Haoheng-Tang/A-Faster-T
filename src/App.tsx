import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import ControlPanel from './components/ControlPanel'
import MapArea from './components/MapArea'
import { fetchFromAdapter } from './services/dataAdapters'
import screenshot from './resources/Screenshot 2025-09-20 160708.png'
import subway from './resources/SubwayMapExample.png'
import DiagramsWindow from './components/diagrams/DiagramsWindow'


export default function App(): JSX.Element {
  const [showBus, setShowBus] = useState<boolean>(true)
  const [showTrain, setShowTrain] = useState<boolean>(true)
  const [liveMode, setLiveMode] = useState<boolean>(false)
  const [data, setData] = useState<any[]>([])

  const [adapter, setAdapter] = useState<string>('openStreetMap')
  const [adapterUrl, setAdapterUrl] = useState<string>('')
  const [showControls, setShowControls] = useState<boolean>(true)

  // New: random node size for selected node (by id)
  const [grownNodeId, setGrownNodeId] = useState<string | null>(null);
  const [grownNodeSize, setGrownNodeSize] = useState<number>(14);

  // Helper to generate random int in [min, max]
  function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // selectedStopId is tracked in MapArea, so we need to lift it up
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const estimateTraffic = async () => {
    const d = await fetchFromAdapter(adapter, { url: adapterUrl, live: liveMode })
    setData(d)
    // Only grow the node that is currently selected
    if (selectedStopId) {
      setGrownNodeId(selectedStopId);
      setGrownNodeSize(getRandomInt(14, 28));
    } else {
      setGrownNodeId(null);
      setGrownNodeSize(14);
    }
  }

  // map adapter key to a resource image
  const adapterImageMap: Record<string, string | undefined> = {
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

  // When switching sections, automatically hide controls in diagrams (section 1)
  useEffect(() => {
    if (section === 1) {
      setShowControls(false)
    } else {
      // show controls again when returning to map section
      setShowControls(true)
    }
  }, [section])

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
            estimateTraffic={estimateTraffic}
            adapter={adapter}
            setAdapter={setAdapter}
            adapterUrl={adapterUrl}
            setAdapterUrl={setAdapterUrl}
            onClose={() => setShowControls(false)}
          />
        )}
  <Navbar title="Faster T" variant="transparent" onToggleControls={() => setShowControls((s) => !s)} whiteBrand={section === 0} />
  <MapArea
    data={data}
    showBus={showBus}
    showTrain={showTrain}
    backgroundImage={backgroundImage}
    adapter={adapter}
    selectedStopId={selectedStopId}
    setSelectedStopId={setSelectedStopId}
    grownNodeId={grownNodeId}
    grownNodeSize={grownNodeSize}
  />
        {section === 0 && (
          <button className="scroll-down-btn" aria-label="Scroll down" onClick={scrollDown}>▾</button>
        )}
      </div>

      <div className="vh-section charts-section" id="charts-section">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <DiagramsWindow />
        </div>
        {section === 1 && (
          <button className="scroll-down-btn" aria-label="Scroll up" onClick={scrollUp}>▴</button>
        )}
  </div>
    </div>
  )
}
