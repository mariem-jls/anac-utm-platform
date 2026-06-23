import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const Map = ({ drones, onSelectDrone, selectedDrone }) => {
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const [mapReady, setMapReady] = useState(false)
  
  // Zones de géofencing
  const geofenceZones = [
    { lat: 36.8510, lng: 10.2272, radius: 5000, name: 'Tunis-Carthage CTR', color: '#f04040' },
    { lat: 36.8565, lng: 10.2450, radius: 2000, name: 'Zone Présidentielle', color: '#f04040' },
    { lat: 37.2430, lng: 9.8010, radius: 8000, name: 'Base Militaire Bizerte', color: '#f5a623' },
    { lat: 34.7179, lng: 10.6904, radius: 4000, name: 'Sfax-Thyna CTR', color: '#f04040' }
  ]

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [36.8, 10.18],
        zoom: 10,
        zoomControl: false
      })
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 19
      }).addTo(mapRef.current)
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
      
      // Ajouter les zones de géofencing
      geofenceZones.forEach(zone => {
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: '6 4'
        }).addTo(mapRef.current)
        
        circle.bindTooltip(`🚫 ${zone.name}`, {
          permanent: false,
          direction: 'top',
          className: 'bg-[#111827] text-white border border-[#1f2937] text-xs'
        })
      })
      
      setMapReady(true)
    }
  }, [])

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    
    // Supprimer les anciens marqueurs
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}
    
    drones.forEach(drone => {
      const isViolation = drone.status === 'alert'
      const isWarning = drone.status === 'warning'
      const color = isViolation ? '#f04040' : isWarning ? '#f5a623' : '#4f8ef7'
      const pulse = isViolation ? 'animation: pulse 0.8s infinite;' : ''
      
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${color}22;
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          ${pulse}
        ">
          <div style="
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: ${color};
          "></div>
        </div>
        <div style="
          font-family: monospace;
          font-size: 8px;
          color: ${color};
          background: rgba(17, 24, 39, 0.92);
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 3px;
          border: 1px solid ${color}44;
          backdrop-filter: blur(4px);
          white-space: nowrap;
          font-weight: 500;
        ">
          ${drone.id.replace('TN-DRN-', 'DRN-')}
        </div>`,
        iconSize: [50, 32],
        iconAnchor: [7, 7]
      })
      
      const marker = L.marker([drone.lat, drone.lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => onSelectDrone(drone.id))
      
      // Effet de "traînée" pour le drone sélectionné
      if (drone.id === selectedDrone) {
        const circle = L.circle([drone.lat, drone.lng], {
          radius: 30,
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 1
        }).addTo(mapRef.current)
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.removeLayer(circle)
          }
        }, 2000)
      }
      
      markersRef.current[drone.id] = marker
    })
  }, [drones, onSelectDrone, selectedDrone, mapReady])

  // Recentrer sur le drone sélectionné
  useEffect(() => {
    if (selectedDrone && mapRef.current && mapReady) {
      const drone = drones.find(d => d.id === selectedDrone)
      if (drone) {
        mapRef.current.setView([drone.lat, drone.lng], 14, {
          animate: true,
          duration: 0.8
        })
      }
    }
  }, [selectedDrone, drones, mapReady])

  return (
    <div 
      id="map" 
      className="w-full h-full bg-[#0a0e1a]"
      style={{ background: '#0a0e1a' }}
    />
  )
}

export default Map