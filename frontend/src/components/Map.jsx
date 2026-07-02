import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { supabase } from '../lib/supabase'

const Map = ({ drones, onSelectDrone, selectedDrone }) => {
  console.log('Map reçoit les drones:', drones.map(d => d.id))
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const circlesRef = useRef({})
  const zoneCirclesRef = useRef({})
  const [mapReady, setMapReady] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [zones, setZones] = useState([])
  const userInteracted = useRef(false)
  const updateTimeoutRef = useRef(null)

  // ============================================================
  // RÉCUPÉRATION DES ZONES DEPUIS SUPABASE
  // ============================================================

  const fetchZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('geofence_zones')
        .select('*')
        .eq('active', true)

      if (error) throw error
      setZones(data || [])
    } catch (error) {
      console.error('Erreur chargement zones:', error)
    }
  }, [])

  // Charger les zones au montage
  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  // ============================================================
  // INITIALISATION DE LA CARTE
  // ============================================================

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

      mapRef.current = map
      setMapReady(true)

      // Détecter les interactions utilisateur
      map.on('dragstart', () => {
        userInteracted.current = true
        setIsFollowing(false)
      })

      map.on('zoomstart', () => {
        userInteracted.current = true
        setIsFollowing(false)
      })
    }
  }, [])

  // ============================================================
  // AJOUTER LES ZONES SUR LA CARTE
  // ============================================================

  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    const map = mapRef.current

    // Supprimer les anciens cercles de zones
    Object.values(zoneCirclesRef.current).forEach(circle => {
      map.removeLayer(circle)
    })
    zoneCirclesRef.current = {}

    // Ajouter les zones actives
    zones.forEach(zone => {
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: zone.color || '#f04040',
        fillColor: zone.color || '#f04040',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 4'
      }).addTo(map)

      circle.bindTooltip(`${zone.danger ? '🚫' : '✓'} ${zone.name}`, {
        permanent: false,
        direction: 'top',
        className: 'bg-[#111827] text-white border border-[#1f2937] text-xs'
      })

      zoneCirclesRef.current[zone.id] = circle
    })

  }, [zones, mapReady])

  // ============================================================
  // METTRE À JOUR LES MARQUEURS DES DRONES
  // ============================================================
const updateMarkers = useCallback(() => {
  console.log('📍 updateMarkers, drones:', drones.length, drones.map(d => d.id))
  
  if (!mapRef.current || !mapReady) return

  const map = mapRef.current
  const currentDroneIds = new Set(drones.map(d => d.id))

  // Supprimer les anciens marqueurs
  Object.keys(markersRef.current).forEach(id => {
    if (!currentDroneIds.has(id)) {
      map.removeLayer(markersRef.current[id])
      delete markersRef.current[id]
    }
  })

  // Créer les nouveaux marqueurs
  drones.forEach(drone => {
    const color = drone.status === 'alert' ? '#f04040' : drone.status === 'warning' ? '#f5a623' : '#4f8ef7'
    
    // UTILISER UN MARQUEUR STANDARD POUR TESTER
    const marker = L.marker([drone.lat, drone.lng], {
      title: drone.id
    }).addTo(map)
    
    // Ajouter une popup
    marker.bindPopup(`
      <div style="font-family: sans-serif; padding: 8px;">
        <strong style="color: ${color};">${drone.id}</strong><br/>
        Status: ${drone.status}<br/>
        Alt: ${drone.altitude}m<br/>
        Batterie: ${drone.battery}%
      </div>
    `)
    
    marker.on('click', () => {
      setIsFollowing(true)
      userInteracted.current = false
      onSelectDrone(drone.id)
    })

    markersRef.current[drone.id] = marker
  })

  console.log('📌 Marqueurs actifs:', Object.keys(markersRef.current))
}, [drones, onSelectDrone, mapReady, isFollowing])

  // Gérer les cercles de suivi sans relancer toute la mise à jour des marqueurs
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    const map = mapRef.current

    Object.values(circlesRef.current).forEach(circle => {
      map.removeLayer(circle)
    })
    circlesRef.current = {}

    if (!selectedDrone) return

    const selected = drones.find(d => d.id === selectedDrone)
    if (!selected) return

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

    const circleTimeout = setTimeout(() => {
      if (circlesRef.current[selected.id]) {
        map.removeLayer(circlesRef.current[selected.id])
        delete circlesRef.current[selected.id]
      }
    }, 2000)

    return () => clearTimeout(circleTimeout)
  }, [selectedDrone, drones, mapReady])

  // Mettre à jour les marqueurs avec debounce
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
  }, [drones, mapReady, updateMarkers])

  // Recentrer sur le drone sélectionné
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

  // Réactiver le suivi
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

  // Nettoyer les ressources
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
          className="absolute bottom-20 right-4 bg-[#4f8ef7] hover:bg-[#3b7de0] text-white px-3 py-1.5 rounded-lg text-sm shadow-lg z-[1000] transition-colors flex items-center gap-1.5"
        >
          <span className="text-base">+</span>
          Suivre le drone
        </button>
      )}

      {isFollowing && (
        <div className="absolute top-4 right-4 bg-[#111827]/90 backdrop-blur-sm border border-[#4f8ef7]/30 rounded-lg px-3 py-1.5 text-xs text-[#4f8ef7] z-[1000] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#4f8ef7] rounded-full animate-pulse" />
          Suivi actif
        </div>
      )}
      {/* Bouton Voir tous les drones */}
<button
  onClick={() => {
    if (drones.length > 0) {
      const bounds = L.latLngBounds(drones.map(d => [d.lat, d.lng]))
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 11
      })
    }
  }}
  className="absolute bottom-32 right-4 bg-[#1a2332] border border-[#4f8ef7] text-[#4f8ef7] px-3 py-1.5 rounded-lg text-xs z-[1000] hover:bg-[#4f8ef7]/10 transition-colors"
>
  Voir tous les drones
</button>

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