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

  // New: support for line and multi-node selection
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // New: lift date and time state from ControlPanel
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedHour, setSelectedHour] = useState<string>('12:00');

  // Store per-node estimated values
  const [nodeEstimates, setNodeEstimates] = useState<Record<string, number>>({});

  // Load node data from GeoJSON on mount
  useEffect(() => {
    fetch('/data/Metro Station - Geojson data/MBTA_NODE.geojson')
      .then(res => res.json())
      .then(geojson => {
        // Convert geojson.features to your data format
        const nodes = geojson.features.map((f: any) => ({
          station: f.properties.STATION,
          line: f.properties.LINE,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        }));
        setData(nodes);
      });
  }, []);

  // Hide bubbles by clearing nodeEstimates when deselecting all
  useEffect(() => {
    if (!selectedLine && (!selectedNodeIds || selectedNodeIds.length === 0) && !selectedStopId) {
      setNodeEstimates({});
    }
  }, [selectedLine, selectedNodeIds, selectedStopId]);

  const estimateTraffic = async () => {
    // Use selectedNodeIds if any, else fallback to selectedStopId
    const nodeKeys = selectedNodeIds && selectedNodeIds.length > 0 ? selectedNodeIds : (selectedStopId ? [selectedStopId] : []);
    console.log("nodeKeys:", nodeKeys);
    if (nodeKeys.length === 0) return;

    console.log(data)

    // Parse keys into station/line
    const nodeInfo = nodeKeys.map(key => {
      const [station, line] = key.split('_');
      // Try to find a node in data with matching station and line
      return data.find(item => item.station === station && item.line === line);
    });

    // For each node, send a request and collect results
    const results: Record<string, number> = {};
    console.log("Node info for estimation:", nodeInfo);
    await Promise.all(nodeInfo.map(async (node, idx) => {
      if (!node) return;
      const payload = {
        date: selectedDate,
        time: selectedHour,
        station: node.station,
        line: node.line,
        lat: node.lat,
        lon: node.lon,
      };
      console.log("Sending estimate request for node", node.station, node.line, "with payload:", payload);
      let estimatedValue = null;
      try {
        const resp = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log("Response for node", node.station, node.line, ":", resp);
        if (resp.ok) {
          const result = await resp.json();
          estimatedValue = result.value;
        } else {
          estimatedValue = getRandomInt(14, 28);
        }
      } catch (e) {
        console.log("Response for node", node.station, node.line, ":", e);
        estimatedValue = getRandomInt(14, 28);
      }
      results[`${node.station}_${node.line}`] = estimatedValue;
    }));
    setNodeEstimates(results);
    console.log('Estimate results:', results);

    // For single node selection, keep old grown node logic for animation
    if (nodeKeys.length === 1) {
      setGrownNodeId(nodeKeys[0]);
      setGrownNodeSize(results[nodeKeys[0]]);
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
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedHour={selectedHour}
            setSelectedHour={setSelectedHour}
            onClose={() => setShowControls(false)}
          />
        )}
  <Navbar title="CityPulse" variant="transparent" onToggleControls={() => setShowControls((s) => !s)} whiteBrand={section === 0} />
  <MapArea
    data={data}
    showBus={showBus}
    showTrain={showTrain}
    backgroundImage={backgroundImage}
    adapter={adapter}
    selectedStopId={selectedStopId}
    setSelectedStopId={setSelectedStopId}
    selectedLine={selectedLine}
    setSelectedLine={setSelectedLine}
    selectedNodeIds={selectedNodeIds}
    setSelectedNodeIds={setSelectedNodeIds}
    grownNodeId={grownNodeId}
    grownNodeSize={grownNodeSize}
    nodeEstimates={nodeEstimates}
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
