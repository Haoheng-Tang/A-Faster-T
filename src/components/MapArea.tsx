
import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
}

export default function MapArea({ data, showBus, showTrain, backgroundImage, adapter }: Props): JSX.Element {
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
  // Track selected stop by id (station + line); only one selected at a time
  const [selectedStop, setSelectedStop] = useState<string | null>(null)

  useEffect(() => {
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
  fetch('/data/Metro Station - Geojson data/MBTA_ARC.geojson')
      .then(res => res.json())
      .then(geojson => {
        geoJsonLineRef.current = L.geoJSON(geojson, {
          style: feature => ({
            color: getLineColor(feature?.properties?.LINE),
            weight: 5,
          })
        }).addTo(map);

        // Now add stops after line, so circles are in front
        fetch('/data/Metro Station - Geojson data/MBTA_NODE.geojson')
          .then(res => res.json())
          .then(geojsonStops => {
            geoJsonStopsRef.current = L.geoJSON(geojsonStops, {
              pointToLayer: (feature, latlng) => {
                const stopId = `${feature.properties?.STATION || ''}_${feature.properties?.LINE || ''}`;
                const isSelected = selectedStop === stopId;
                const baseStyle = {
                  radius: isSelected ? 14 : 7, // much larger if selected
                  color: '#fff', // blue or white outline
                  weight: isSelected ? 4 : 2, // thicker outline if selected
                  fillColor: '#000', // white fill if selected, black otherwise
                  fillOpacity: 1
                };
                const marker = L.circleMarker(latlng, baseStyle)
                  .bindPopup(
                    `<strong>${feature.properties?.STATION || 'Stop'}</strong><br/>LINE: ${feature.properties?.LINE || 'N/A'}`
                  );
                marker.on('click', (e) => {
                  e.originalEvent?.stopPropagation?.(); // prevent map click from firing
                  setSelectedStop(stopId);
                  // Animate: pulse effect (optional, can be removed if not needed)
                  let grow = true;
                  let count = 0;
                  const pulse = setInterval(() => {
                    if (grow) {
                      marker.setStyle({ radius: 22 });
                    } else {
                      marker.setStyle({ radius: 18 });
                    }
                    grow = !grow;
                    count++;
                    if (count > 3) clearInterval(pulse);
                  }, 100);
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
            map.on('click', () => setSelectedStop(null));
          });
      });
  }, [adapter, selectedStop])

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
