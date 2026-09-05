import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, AlertTriangle, ExternalLink } from 'lucide-react';

export default function GISMap({
  incidents,
  selectedIncident,
  onSelectIncident,
  onAssignCrew
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' or 'streets'

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: City center (Chennai / Metro sample coordinates)
      const defaultCenter = [13.0827, 80.2707];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution
      L.control.attribution({
        position: 'bottomright',
        prefix: 'CIVICSHIELD GIS Engine &copy; OpenStreetMap'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer based on theme
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl = mapTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: mapTheme === 'dark' ? 'abcd' : 'abc'
    }).addTo(map);
  }, [mapTheme]);

  // Update Markers when incidents list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (incidents.length === 0) return;

    const bounds = L.latLngBounds();

    incidents.forEach((incident) => {
      const lat = parseFloat(incident.latitude);
      const lng = parseFloat(incident.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      bounds.extend([lat, lng]);

      // Determine urgency colors
      let markerColor = '#10b981'; // green for LOW
      let pulseClass = '';
      if (incident.priority_level === 'CRITICAL') {
        markerColor = '#ef4444';
        pulseClass = 'marker-pulse-critical';
      } else if (incident.priority_level === 'HIGH') {
        markerColor = '#f97316';
        pulseClass = 'marker-pulse-high';
      } else if (incident.priority_level === 'MEDIUM') {
        markerColor = '#eab308';
      }

      // Custom animated SVG icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="custom-marker-wrapper ${pulseClass}">
            <div class="marker-pin" style="background-color: ${markerColor};">
              <span class="marker-score">${incident.priority_score || incident.severity * 10}</span>
            </div>
            <div class="marker-shadow"></div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Build popup content
      const popupHtml = `
        <div class="gis-popup-card">
          <div class="popup-header">
            <span class="popup-id">${incident.id}</span>
            <span class="popup-priority-badge ${incident.priority_level?.toLowerCase()}">${incident.priority_level}</span>
          </div>
          <div class="popup-image-wrapper">
            <img src="${incident.image_url}" alt="${incident.issue_type}" class="popup-thumb" onerror="this.style.display='none'"/>
          </div>
          <div class="popup-body">
            <div class="popup-issue-title">${incident.issue_type}</div>
            <div class="popup-location-line">📍 ${incident.location_name || 'Geo-Captured Location'}</div>
            
            <div class="popup-metrics-grid">
              <div class="popup-metric">
                <span class="p-label">Severity</span>
                <span class="p-val">${incident.severity}/10</span>
              </div>
              <div class="popup-metric">
                <span class="p-label">Risk</span>
                <span class="p-val highlight">${incident.risk_score}</span>
              </div>
              <div class="popup-metric">
                <span class="p-label">Priority</span>
                <span class="p-val highlight-crit">${incident.priority_score}</span>
              </div>
            </div>

            <div class="popup-dept-tag">🏛️ ${incident.department}</div>
            <div class="popup-status-line">Status: <strong>${incident.status}</strong></div>

            <button id="btn-inspect-${incident.id}" class="popup-action-btn">
              Inspect Incident Details &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'civic-leaflet-popup',
        maxWidth: 280
      });

      marker.on('popupopen', () => {
        // Add event listener to the inspect button inside popup
        setTimeout(() => {
          const btn = document.getElementById(`btn-inspect-${incident.id}`);
          if (btn) {
            btn.onclick = () => onSelectIncident(incident);
          }
        }, 50);
      });

      markersGroup.addLayer(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [incidents, mapTheme]);

  // Center on selected incident if triggered externally
  useEffect(() => {
    if (selectedIncident && mapInstanceRef.current) {
      const lat = parseFloat(selectedIncident.latitude);
      const lng = parseFloat(selectedIncident.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
      }
    }
  }, [selectedIncident]);

  const handleCenterOnCritical = () => {
    const criticals = incidents.filter(i => i.priority_level === 'CRITICAL');
    if (criticals.length > 0 && mapInstanceRef.current) {
      const c = criticals[0];
      mapInstanceRef.current.flyTo([c.latitude, c.longitude], 15, { duration: 1 });
    }
  };

  const handleResetBounds = () => {
    if (markersGroupRef.current && mapInstanceRef.current) {
      const bounds = L.latLngBounds();
      incidents.forEach(i => bounds.extend([i.latitude, i.longitude]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  };

  return (
    <div className="gis-map-component">
      <div className="gis-map-toolbar">
        <div className="toolbar-left">
          <span className="map-badge-live">
            <span className="live-dot"></span> GIS INCIDENT MATRIX
          </span>
          <span className="map-incident-count">{incidents.length} Markers Plotted</span>
        </div>

        <div className="toolbar-right">
          <button 
            className="map-tool-btn" 
            onClick={handleCenterOnCritical} 
            title="Focus camera on highest critical incident"
          >
            <AlertTriangle size={14} className="text-red" /> Focus Critical
          </button>
          <button 
            className="map-tool-btn" 
            onClick={handleResetBounds} 
            title="Fit all markers in view"
          >
            <Crosshair size={14} /> Center All
          </button>
          <button 
            className="map-tool-btn" 
            onClick={() => setMapTheme(mapTheme === 'dark' ? 'streets' : 'dark')}
            title="Toggle Map Style (Dark/Light)"
          >
            <Layers size={14} /> {mapTheme === 'dark' ? 'Satellite/Streets' : 'Command Dark'}
          </button>
        </div>
      </div>

      <div className="map-render-container" ref={mapContainerRef}></div>

      {/* Map Legend Overlay */}
      <div className="map-legend-overlay">
        <div className="legend-title">PRIORITY SCALE</div>
        <div className="legend-row">
          <span className="legend-dot critical"></span> Critical (&ge;85)
        </div>
        <div className="legend-row">
          <span className="legend-dot high"></span> High (70-84)
        </div>
        <div className="legend-row">
          <span className="legend-dot medium"></span> Medium (40-69)
        </div>
        <div className="legend-row">
          <span className="legend-dot low"></span> Low (&lt;40)
        </div>
      </div>
    </div>
  );
}

