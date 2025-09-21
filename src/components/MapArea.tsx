
import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Add CSS for multi-color, multi-ring pulsating effect and selected line glow
const ringStyle = `
.leaflet-pulse-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 60px;
  height: 60px;
  margin-left: -30px;
  margin-top: -30px;
  border-radius: 50%;
  pointer-events: none;
  box-sizing: border-box;
  border: 3px solid var(--pulse-color, #fff);
  opacity: 0.7;
}
.leaflet-pulse-ring.ring1 {
  animation: leaflet-pulse 1.5s cubic-bezier(0.66,0,0,1) 0s infinite;
}
.leaflet-pulse-ring.ring2 {
  animation: leaflet-pulse 1.5s cubic-bezier(0.66,0,0,1) 0.1s infinite;
}
.leaflet-pulse-ring.ring3 {
  animation: leaflet-pulse 1.5s cubic-bezier(0.66,0,0,1) 0.2s infinite;
}
@keyframes leaflet-pulse {
  0% { transform: scale(0.7); opacity: 0.7; }
  70% { transform: scale(1.5); opacity: 0; }
  100% { transform: scale(0.7); opacity: 0; }
}
`;
const selectedLineGlowStyle = `
  .selected-line-glow {
    filter: drop-shadow(0 0 8px #fff) drop-shadow(0 0 12px #fff8);
    /* fallback for browsers that don't support filter on SVG: use stroke */
    stroke-width: 12px !important;
    stroke: #fff8;
  }
`;
if (typeof window !== 'undefined') {
  if (!document.getElementById('leaflet-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'leaflet-pulse-style';
    style.innerHTML = ringStyle;
    document.head.appendChild(style);
  }
  if (!document.getElementById('selected-line-glow-style')) {
    const style = document.createElement('style');
    style.id = 'selected-line-glow-style';
    style.innerHTML = selectedLineGlowStyle;
    document.head.appendChild(style);
  }
}

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
  adapter?: string
  selectedStopId?: string | null
  setSelectedStopId?: (id: string | null) => void
  selectedLine?: string | null
  setSelectedLine?: (line: string | null) => void
  selectedNodeIds?: string[]
  setSelectedNodeIds?: (ids: string[]) => void
  grownNodeId?: string | null
  grownNodeSize?: number
  nodeEstimates?: Record<string, number>
}

export default function MapArea({ data, showBus, showTrain, backgroundImage, adapter, selectedStopId, setSelectedStopId, selectedLine, setSelectedLine, selectedNodeIds, setSelectedNodeIds, grownNodeId, grownNodeSize, nodeEstimates }: Props): JSX.Element {
  // Ref to track all line layers by line name for group hover/select and selection
  const lineLayersByNameRef = useRef<Record<string, L.Layer[]>>({});
  // Track if we've already fit bounds for this map session
  const hasFitBoundsRef = useRef(false);
  const filtered = data.filter((d) => {
    if (d.type === 'bus' && !showBus) return false
    if (d.type === 'train' && !showTrain) return false
    return true
  })
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  // Refs for geojson layers so we can remove them before adding new
  const geoJsonLineRef = useRef<L.GeoJSON | null>(null)
  const geoJsonStopsRef = useRef<L.GeoJSON | null>(null)
  // Ref to keep track of ring markers so we can remove them
  const ringMarkersRef = useRef<L.Marker[]>([])
  // Ref for all value label markers (bubbles)
  const valueLabelMarkersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Remove any existing ring markers before updating
    if (ringMarkersRef.current.length > 0 && leafletMapRef.current) {
      ringMarkersRef.current.forEach((rm) => rm.remove());
      ringMarkersRef.current = [];
    }
    // Remove all value label markers if present
    if (valueLabelMarkersRef.current.length > 0 && leafletMapRef.current) {
      valueLabelMarkersRef.current.forEach((m) => m.remove());
      valueLabelMarkersRef.current = [];
    }
    // Reset fit bounds tracker when adapter changes
    hasFitBoundsRef.current = false;
    if (!mapRef.current) return;

    // If switching away from OSM, remove the map instance
    if (adapter !== 'openStreetMap') {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    // initialize map if not already
    if (!leafletMapRef.current) {
      const m = L.map(mapRef.current, {
        center: [42.3601, -71.0589],
        zoom: 12,
        zoomControl: false // disable default zoom control
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB'
      }).addTo(m);
      // Add zoom control to bottom left
      L.control.zoom({ position: 'bottomleft' }).addTo(m);
      leafletMapRef.current = m;
    }

    // No need to remove/add tile layers, just ensure map is present

    return () => {
      // Clean up map if component unmounts
      if (leafletMapRef.current && adapter !== 'openStreetMap') {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    }
  }, [adapter])

  // update markers when data changes and adapter is OSM
  useEffect(() => {
    if (adapter !== 'openStreetMap') return
    const map = leafletMapRef.current
    if (!map) return

    // remove existing markers
    markersRef.current.forEach((mk) => mk.remove())
    markersRef.current = []

    filtered.forEach((item) => {
      if (item.lat == null || item.lon == null) return
      const marker = L.circleMarker([item.lat, item.lon], { radius: 6, color: item.type === 'bus' ? '#2563eb' : '#ef4444' })
      marker.bindPopup(`<strong>${item.label}</strong><br/>${item.type}`)
      marker.addTo(map)
      markersRef.current.push(marker as unknown as L.Marker)
    })

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current as any)
      map.fitBounds(group.getBounds().pad(0.3))
    }
  }, [data, showBus, showTrain, adapter])

  // Load and display subway line (ARC) and stops (NODE) from GeoJSON
  useEffect(() => {
    if (adapter !== 'openStreetMap') return
    const map = leafletMapRef.current
    if (!map) return

    // Remove previous layers
    geoJsonLineRef.current?.remove()
    geoJsonStopsRef.current?.remove()

    // Helper: map line name to color
    const lineColorMap: Record<string, string> = {
      red: '#d32f2f',
      blue: '#1976d2',
      orange: '#f57c00',
      green: '#388e3c',
      silver: '#757575',
      mattapan: '#ad1457',
      // fallback
      default: '#00bcd4',
    };
    function getLineColor(line: string | undefined): string {
      if (!line) return lineColorMap.default;
      // If two lines, e.g. 'Red/Blue', use the first
      const first = line.split(/[\/]/)[0].trim().toLowerCase();
      return lineColorMap[first] || lineColorMap.default;
    }

    // Add subway line (ARC), then stops (NODE) after line is added
    if (adapter !== 'openStreetMap') return;

    // Remove previous line layer before adding new (to force re-render on selection change)
    geoJsonLineRef.current?.remove();

    fetch('/data/Metro Station - Geojson data/MBTA_ARC.geojson')
      .then(res => res.json())
      .then(geojson => {
        // Reset the ref on each load
        lineLayersByNameRef.current = {};
        geoJsonLineRef.current = L.geoJSON(geojson, {
          style: feature => {
            const lineName = feature?.properties?.LINE;
            const isSelectedLine = selectedLine && lineName && lineName.toLowerCase() === selectedLine.toLowerCase();
            const baseColor = getLineColor(lineName);
            // Use an inline filter for colored glow if selected
            const filter = isSelectedLine
              ? `drop-shadow(0 0 8px ${baseColor}) drop-shadow(0 0 12px ${baseColor}cc)`
              : undefined;
            return {
              color: baseColor,
              weight: isSelectedLine ? 10 : 5,
              opacity: isSelectedLine ? 1 : 0.7,
              dashArray: undefined,
              zIndex: isSelectedLine ? 1000 : 500,
              className: '',
              // @ts-ignore
              filter,
            };
          },
          onEachFeature: (feature, layer) => {
            const lineName = feature?.properties?.LINE;
            if (lineName) {
              const key = lineName.toLowerCase();
              if (!lineLayersByNameRef.current[key]) lineLayersByNameRef.current[key] = [];
              lineLayersByNameRef.current[key].push(layer);
            }
            layer.on('click', (e) => {
              if (e.originalEvent) {
                if (typeof L !== 'undefined' && L.DomEvent && L.DomEvent.stopPropagation) {
                  L.DomEvent.stopPropagation(e);
                } else {
                  e.originalEvent.stopPropagation?.();
                }
              }
              if (!lineName) return;
              if (selectedLine && selectedLine.toLowerCase() === lineName.toLowerCase()) {
                console.log('Deselecting line:', lineName);
                setSelectedLine && setSelectedLine(null);
                setSelectedNodeIds && setSelectedNodeIds([]);
              } else {
                console.log('Selecting line:', lineName);
                setSelectedLine && setSelectedLine(lineName);
                setSelectedStopId && setSelectedStopId(null); // Deselect single node
                // Immediately highlight all nodes on this line if stops are already loaded
                if (geoJsonStopsRef.current) {
                  const geojson = geoJsonStopsRef.current.toGeoJSON();
                  if (
                    geojson &&
                    'features' in geojson &&
                    Array.isArray(geojson.features)
                  ) {
                    const nodeIds = geojson.features
                      .filter((f: any) => f.properties?.LINE && f.properties.LINE.toLowerCase() === lineName.toLowerCase())
                      .map((f: any) => `${f.properties?.STATION || ''}_${f.properties?.LINE || ''}`);
                    setSelectedNodeIds && setSelectedNodeIds(nodeIds);
                  }
                }
              }
            });
            layer.on('mouseover', function () {
              if (!lineName) return;
              const key = lineName.toLowerCase();
              (lineLayersByNameRef.current[key] || []).forEach(l => (l as L.Path).setStyle({ weight: 12, opacity: 1 }));
            });
            layer.on('mouseout', function () {
              if (!lineName) return;
              const key = lineName.toLowerCase();
              const isSelected = selectedLine && key === selectedLine.toLowerCase();
              (lineLayersByNameRef.current[key] || []).forEach(l => (l as L.Path).setStyle({ weight: isSelected ? 10 : 5, opacity: isSelected ? 1 : 0.7 }));
            });
          },
        }).addTo(map);

        // Now add stops after line, so circles are in front
        fetch('/data/Metro Station - Geojson data/MBTA_NODE.geojson')
          .then(res => res.json())
          .then(geojsonStops => {
            // If a line is selected, collect all node IDs for that line
            if (selectedLine && setSelectedNodeIds) {
              // Select all nodes on any line with the same name (case-insensitive)
              const nodeIds = geojsonStops.features
                .filter((f: any) => f.properties?.LINE && f.properties.LINE.toLowerCase() === selectedLine.toLowerCase())
                .map((f: any) => `${f.properties?.STATION || ''}_${f.properties?.LINE || ''}`);
              setSelectedNodeIds(nodeIds);
            }
            if (!selectedLine && setSelectedNodeIds) {
              setSelectedNodeIds([]);
            }
            geoJsonStopsRef.current = L.geoJSON(geojsonStops, {
              pointToLayer: (feature, latlng) => {
                const stopId = `${feature.properties?.STATION || ''}_${feature.properties?.LINE || ''}`;
                // Node is selected if:
                // - single node selection (no line selected) and selectedStopId matches
                // - OR, line is selected and this node is in selectedNodeIds
                const isSelected = (!selectedLine && selectedStopId === stopId) || (selectedLine && selectedNodeIds && selectedNodeIds.includes(stopId));
                // Helper: interpolate color from green (14) to yellow (21) to red (28)
                function getNodeFillColor(val: number) {
                  if (val <= 14) return '#22c55e'; // green
                  if (val >= 28) return '#ef4444'; // red
                  if (val <= 21) {
                    // green to yellow
                    // green: hsl(142, 70%, 49%) -> yellow: hsl(50, 100%, 50%)
                    const t = (val - 14) / (21 - 14);
                    const h = 142 + (50 - 142) * t;
                    const s = 70 + (100 - 70) * t;
                    const l = 49 + (50 - 49) * t;
                    return `hsl(${h},${s}%,${l}%)`;
                  } else {
                    // yellow to red
                    // yellow: hsl(50, 100%, 50%) -> red: hsl(0, 84%, 60%)
                    const t = (val - 21) / (28 - 21);
                    const h = 50 + (0 - 50) * t;
                    const s = 100 + (84 - 100) * t;
                    const l = 50 + (60 - 50) * t;
                    return `hsl(${h},${s}%,${l}%)`;
                  }
                }

                let fillColor = '#000';
                let nodeValue = undefined;
                let nodeRadius = 7;
                let showRings = false;
                // Use nodeEstimates for selected nodes if available
                if (nodeEstimates && nodeEstimates[stopId] !== undefined && isSelected) {
                  nodeValue = nodeEstimates[stopId];
                  fillColor = getNodeFillColor(nodeValue);
                  nodeRadius = 14 + ((nodeValue - 14) / (28 - 14)) * 14; // 14-28 maps to radius 14-28
                  showRings = true;
                } else if (isSelected && grownNodeId === stopId && grownNodeSize) {
                  fillColor = getNodeFillColor(grownNodeSize);
                  nodeValue = grownNodeSize;
                  nodeRadius = grownNodeSize;
                  showRings = true;
                } else if (isSelected) {
                  nodeRadius = 14;
                }

                const baseStyle = {
                  radius: isSelected ? nodeRadius : 7,
                  color: '#fff',
                  weight: isSelected ? 4 : 2,
                  fillColor,
                  fillOpacity: 1
                };
                const marker = L.circleMarker(latlng, baseStyle)
                  .bindPopup(
                    `<strong>${feature.properties?.STATION || 'Stop'}</strong><br/>LINE: ${feature.properties?.LINE || 'N/A'}`
                  );
                marker.on('click', (e) => {
                  e.originalEvent?.stopPropagation?.(); // prevent map click from firing
                  // Remove all ring markers when selecting a new node
                  if (ringMarkersRef.current.length > 0 && leafletMapRef.current) {
                    ringMarkersRef.current.forEach((rm) => rm.remove());
                    ringMarkersRef.current = [];
                  }
                  // Only allow single node selection if no line is selected
                  if (!selectedLine && setSelectedStopId) setSelectedStopId(stopId);
                });
                let popupTimer: any = null;
                marker.on('mouseover', function () {
                  popupTimer = setTimeout(() => {
                    marker.openPopup();
                  }, 1000);
                });
                marker.on('mouseout', function () {
                  if (popupTimer) {
                    clearTimeout(popupTimer);
                    popupTimer = null;
                  }
                  marker.closePopup();
                });

                // Add three pulsating rings for any selected node with a value (multi-node or single)
                if (showRings && isSelected && nodeValue !== undefined) {
                  // Remove all previous rings before adding new ones (only once per render cycle)
                  if (ringMarkersRef.current.length > 0 && leafletMapRef.current) {
                    ringMarkersRef.current.forEach((rm) => rm.remove());
                    ringMarkersRef.current = [];
                  }
                  // Remove previous value label marker (only for single node)
                  // No need to remove a single value label marker, all are managed in valueLabelMarkersRef
                  const ringColor = getNodeFillColor(nodeValue);
                  const ringDiv = L.divIcon({
                    className: '',
                    html: `
                      <div class="leaflet-pulse-ring ring1" style="--pulse-color: ${ringColor}"></div>
                      <div class="leaflet-pulse-ring ring2" style="--pulse-color: ${ringColor}"></div>
                      <div class="leaflet-pulse-ring ring3" style="--pulse-color: ${ringColor}"></div>
                    `,
                    iconSize: [60, 60],
                    iconAnchor: [30, 30],
                  });
                  const ringMarker = L.marker(latlng, { icon: ringDiv, interactive: false });
                  setTimeout(() => {
                    if (map && ringMarker) {
                      ringMarker.addTo(map);
                      ringMarkersRef.current.push(ringMarker);
                    }
                  }, 0);
                }

                // Show value label for any node with an estimate (multi-node or single)
                if (nodeValue !== undefined && isSelected) {
                  const labelDiv = L.divIcon({
                    className: 'node-value-bubble',
                    html: `
                      <div style="
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: none;
                        z-index: 10;
                      ">
                        <div style="
                          background: rgba(30,30,30,0.92);
                          color: #fff;
                          padding: 7px 16px;
                          border-radius: 18px;
                          font-size: 1rem;
                          font-weight: 500;
                          white-space: nowrap;
                          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
                          border: 2px solid #fff2;
                          position: relative;
                          z-index: 2;
                        ">
                          ${nodeValue} passengers
                        </div>
                        <span style="
                          position: relative;
                          display: block;
                          width: 0;
                          height: 0;
                          margin-top: -2px;
                          z-index: 1;
                          border-left: 13px solid transparent;
                          border-right: 13px solid transparent;
                          border-top: 16px solid rgba(30,30,30,0.92);
                          /* White outline */
                          filter: drop-shadow(0 0 0 gray) drop-shadow(0 1px 0 gray) drop-shadow(0 -1px 0 gray) drop-shadow(-1px 0 0 gray) drop-shadow(1px 0 0 gray) drop-shadow(0 2px 0 gray);
                        "></span>
                      </div>
                    `
                  });
                  // Offset the label above the node
                  const labelMarker = L.marker([latlng.lat, latlng.lng], {
                    icon: labelDiv,
                    interactive: false,
                  });
                  // Use Leaflet's latLngToLayerPoint to offset label in pixels (centered above the node)
                  setTimeout(() => {
                    if (map && labelMarker) {
                      // Helper to update label position above the node
                      const updateLabelPosition = () => {
                        const point = map.latLngToLayerPoint(latlng);
                        const offsetPoint = L.point(point.x, point.y - 75);
                        const newLatLng = map.layerPointToLatLng(offsetPoint);
                        labelMarker.setLatLng(newLatLng);
                      };
                      updateLabelPosition();
                      labelMarker.addTo(map);
                      valueLabelMarkersRef.current.push(labelMarker);
                      // Listen for map move/zoom to keep label above node
                      map.on('zoom move', updateLabelPosition);
                      // Clean up event listeners if marker is removed
                      labelMarker.on('remove', () => {
                        map.off('zoom move', updateLabelPosition);
                      });
                    }
                  }, 0);
                }

                return marker;
              }
            }).addTo(map);
            // Only fit map to stops on very first load
            if (!hasFitBoundsRef.current && geoJsonStopsRef.current && geoJsonStopsRef.current.getLayers().length > 0) {
              map.fitBounds(geoJsonStopsRef.current.getBounds().pad(0.3));
              hasFitBoundsRef.current = true;
            }

            // Deselect on map click (anywhere else)
            map.off('click');
            map.on('click', () => {
              // Remove all ring markers immediately on deselect
              if (ringMarkersRef.current.length > 0 && leafletMapRef.current) {
                ringMarkersRef.current.forEach((rm) => rm.remove());
                ringMarkersRef.current = [];
              }
              // Reset all selection state: stop, line, nodes
              setSelectedStopId && setSelectedStopId(null);
              setSelectedLine && setSelectedLine(null);
              setSelectedNodeIds && setSelectedNodeIds([]);
            });
          });
      });
    // Cleanup: remove all ring markers and value label on unmount or dependency change
    return () => {
      if (ringMarkersRef.current.length > 0 && leafletMapRef.current) {
        ringMarkersRef.current.forEach((rm) => rm.remove());
        ringMarkersRef.current = [];
      }
      if (valueLabelMarkersRef.current.length > 0 && leafletMapRef.current) {
        valueLabelMarkersRef.current.forEach((m) => m.remove());
        valueLabelMarkersRef.current = [];
      }
    };
  }, [adapter, selectedStopId, grownNodeId, grownNodeSize, selectedLine])

  return (
    <div className="map-fullscreen">
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          display: adapter === 'openStreetMap' ? 'block' : 'none',
        }}
      />
      {adapter === 'unrealVM' && backgroundImage && (
        <img src={backgroundImage} alt="background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
