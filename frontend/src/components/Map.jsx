import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const Map = ({ drones, onSelectDrone, selectedDrone }) => {
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const circlesRef = useRef({})
  const [mapReady, setMapReady] = useState(false)
  const [isFollowing, setIsFollowing] = useState(true)
  const userInteracted = useRef(false)
  const updateTimeoutRef = useRef(null)

  // Zones de géofencing
  const geofenceZones = [
    { lat: 36.8510, lng: 10.2272, radius: 5000, name: 'Tunis-Carthage CTR', color: '#f04040' },
    { lat: 36.8565, lng: 10.2450, radius: 2000, name: 'Zone Presidentielle', color: '#f04040' },
    { lat: 37.2430, lng: 9.8010, radius: 8000, name: 'Base Militaire Bizerte', color: '#f5a623' },
    { lat: 34.7179, lng: 10.6904, radius: 4000, name: 'Sfax-Thyna CTR', color: '#f04040' }
  ]

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        center: [36.8, 10.18],
        zoom: 10,
        zoomControl: false
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 19
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Ajouter les zones de géofencing (une seule fois)
      geofenceZones.forEach(zone => {
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: '6 4'
        }).addTo(map)

        circle.bindTooltip(zone.name, {
          permanent: false,
          direction: 'top',
          className: 'bg-[#111827] text-white border border-[#1f2937] text-xs'
        })
      })

      map.on('dragstart', () => {
        userInteracted.current = true
        setIsFollowing(false)
      })

      map.on('zoomstart', () => {
        userInteracted.current = true
        setIsFollowing(false)
      })

      mapRef.current = map
      setMapReady(true)
    }
  }, [])

  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !mapReady) return

    const map = mapRef.current
    const currentDroneIds = new Set(drones.map(d => d.id))

    Object.keys(markersRef.current).forEach(id => {
      if (!currentDroneIds.has(id)) {
        map.removeLayer(markersRef.current[id])
        delete markersRef.current[id]
      }
    })

    drones.forEach(drone => {
      const isViolation = drone.status === 'alert'
      const isWarning = drone.status === 'warning'
      const color = isViolation ? '#f04040' : isWarning ? '#f5a623' : '#4f8ef7'

      const icon = L.divIcon({
        className: 'drone-marker',
        html: `<div style="
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${color}33;
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          ${isViolation ? 'animation: pulse-alert 0.8s infinite;' : ''}
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
          background: rgba(17, 24, 39, 0.9);
          padding: 1px 5px;
          border-radius: 3px;
          margin-top: 2px;
          border: 1px solid ${color}44;
          white-space: nowrap;
          font-weight: 500;
        ">
          ${drone.id.replace('TN-DRN-', 'DRN-')}
        </div>`,
        iconSize: [48, 30],
        iconAnchor: [6, 6]
      })

      const position = [drone.lat, drone.lng]

      if (markersRef.current[drone.id]) {
        markersRef.current[drone.id].setLatLng(position)
        markersRef.current[drone.id].setIcon(icon)
      } else {
        const marker = L.marker(position, { icon })
          .addTo(map)
          .on('click', () => {
            setIsFollowing(true)
            userInteracted.current = false
            onSelectDrone(drone.id)
          })

        markersRef.current[drone.id] = marker
      }
    })

    if (selectedDrone) {
      const selected = drones.find(d => d.id === selectedDrone)
      if (selected) {
        Object.values(circlesRef.current).forEach(circle => {
          map.removeLayer(circle)
        })
        circlesRef.current = {}

        const isViolation = selected.status === 'alert'
        const color = isViolation ? '#f04040' : '#4f8ef7'
        const circle = L.circle([selected.lat, selected.lng], {
          radius: 25,
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1.5
        }).addTo(map)

        circlesRef.current[selected.id] = circle

        setTimeout(() => {
          if (circlesRef.current[selected.id]) {
            map.removeLayer(circlesRef.current[selected.id])
            delete circlesRef.current[selected.id]
          }
        }, 2000)
      }
    }
  }, [drones, onSelectDrone, selectedDrone, mapReady])

  useEffect(() => {
    if (!mapReady) return

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateMarkers()
    }, 50)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [drones, selectedDrone, mapReady, updateMarkers])

  useEffect(() => {
    if (selectedDrone && mapRef.current && mapReady && isFollowing) {
      const drone = drones.find(d => d.id === selectedDrone)
      if (drone) {
        mapRef.current.setView([drone.lat, drone.lng], 14, {
          animate: true,
          duration: 0.5
        })
      }
    }
  }, [selectedDrone, drones, mapReady, isFollowing])

  const handleFollow = useCallback(() => {
    setIsFollowing(true)
    userInteracted.current = false
    if (selectedDrone && mapRef.current) {
      const drone = drones.find(d => d.id === selectedDrone)
      if (drone) {
        mapRef.current.setView([drone.lat, drone.lng], 14, {
          animate: true,
          duration: 0.6
        })
      }
    }
  }, [selectedDrone, drones])

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])


return (
  <div className="relative w-full h-full bg-[#0a0e1a]">
    <div id="map" className="w-full h-full" />

    {!isFollowing && (
      <button
        onClick={handleFollow}
        className="fixed bottom-24 right-6 bg-[#4f8ef7] hover:bg-[#3b7de0] text-white px-4 py-2 rounded-lg text-sm shadow-lg z-[1000] transition-colors flex items-center gap-2"
      >
        <span className="text-base">+</span>
        Suivre le drone
      </button>
    )}

    {isFollowing && (
      <div className="fixed top-20 right-6 bg-[#111827]/90 backdrop-blur-sm border border-[#4f8ef7]/30 rounded-lg px-3 py-1.5 text-xs text-[#4f8ef7] z-[1000] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-[#4f8ef7] rounded-full animate-pulse" />
        Suivi actif
      </div>
    )}

    <style>{`
      @keyframes pulse-alert {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
  </div>
)
}

export default Map