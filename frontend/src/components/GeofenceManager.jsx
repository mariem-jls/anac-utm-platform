import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Loader2,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  X
} from 'lucide-react'

const GeofenceManager = () => {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showForm, setShowForm] = useState(false) // ← NOUVEAU : contrôle l'affichage du formulaire
  const [form, setForm] = useState({
    name: '',
    lat: 36.8,
    lng: 10.18,
    radius: 5000,
    color: '#f04040',
    danger: true,
    active: true
  })
  
  const mapRef = useRef(null)
  const circlesRef = useRef({})
  const drawMarkerRef = useRef(null)
  const drawCircleRef = useRef(null)
  const isDrawingRef = useRef(false)

  // ============================================================
  // RÉCUPÉRATION DES ZONES
  // ============================================================

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('geofence_zones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setZones(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // INITIALISATION DE LA CARTE
  // ============================================================

  const initMap = useCallback(() => {
    if (!mapRef.current) {
      const map = L.map('geofence-map', {
        center: [36.8, 10.18],
        zoom: 10,
        zoomControl: false
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 19
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      map.on('click', (e) => {
        if (isDrawingRef.current) {
          const { lat, lng } = e.latlng
          
          // Mettre à jour le formulaire
          setForm(prev => ({
            ...prev,
            lat: lat,
            lng: lng
          }))
          
          // Supprimer l'ancien marqueur
          if (drawMarkerRef.current) {
            map.removeLayer(drawMarkerRef.current)
            drawMarkerRef.current = null
          }
          if (drawCircleRef.current) {
            map.removeLayer(drawCircleRef.current)
            drawCircleRef.current = null
          }
          
          // Ajouter un marqueur temporaire
          const marker = L.marker([lat, lng]).addTo(map)
          drawMarkerRef.current = marker
          
          // Ajouter un cercle temporaire
          const circle = L.circle([lat, lng], {
            radius: form.radius || 5000,
            color: '#4f8ef7',
            fillColor: '#4f8ef7',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5 5'
          }).addTo(map)
          drawCircleRef.current = circle
          
          // Désactiver le mode dessin mais GARDER le formulaire affiché
          setIsDrawing(false)
          isDrawingRef.current = false
          setShowForm(true)  // ← IMPORTANT : garder le formulaire visible
          
          console.log('✅ Zone placée, formulaire disponible')
        }
      })

      mapRef.current = map
    }
  }, [form.radius])

  // Initialiser la carte
  useEffect(() => {
    initMap()
  }, [initMap])

  // ============================================================
  // METTRE À JOUR LES ZONES SUR LA CARTE
  // ============================================================

  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    Object.values(circlesRef.current).forEach(circle => {
      map.removeLayer(circle)
    })
    circlesRef.current = {}

    zones.forEach(zone => {
      if (!zone.active) return
      
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 4'
      }).addTo(map)

      circle.bindTooltip(zone.name, {
        permanent: false,
        direction: 'top',
        className: 'bg-[#111827] text-white border border-[#1f2937] text-xs'
      })

      circle.on('click', () => {
        setSelectedZone(zone)
        setForm({
          name: zone.name,
          lat: zone.lat,
          lng: zone.lng,
          radius: zone.radius,
          color: zone.color,
          danger: zone.danger,
          active: zone.active
        })
        setIsDrawing(false)
        isDrawingRef.current = false
        setShowForm(true)
      })
      
      circlesRef.current[zone.id] = circle
    })
  }, [zones])

  // ============================================================
  // GESTION DU FORMULAIRE
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const zoneData = {
        name: form.name,
        lat: form.lat,
        lng: form.lng,
        radius: form.radius,
        color: form.color,
        danger: form.danger,
        active: form.active
      }

      if (selectedZone) {
        const { error } = await supabase
          .from('geofence_zones')
          .update({ ...zoneData, updated_at: new Date().toISOString() })
          .eq('id', selectedZone.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('geofence_zones')
          .insert(zoneData)
        if (error) throw error
      }

      await fetchZones()
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (zone) => {
    try {
      const { error } = await supabase
        .from('geofence_zones')
        .update({ active: !zone.active, updated_at: new Date().toISOString() })
        .eq('id', zone.id)
      if (error) throw error
      await fetchZones()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (zoneId) => {
    if (!confirm('Supprimer cette zone ?')) return
    try {
      const { error } = await supabase
        .from('geofence_zones')
        .delete()
        .eq('id', zoneId)
      if (error) throw error
      await fetchZones()
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setSelectedZone(null)
    setForm({
      name: '',
      lat: 36.8,
      lng: 10.18,
      radius: 5000,
      color: '#f04040',
      danger: true,
      active: true
    })
    setError(null)
    setIsDrawing(false)
    isDrawingRef.current = false
    setShowForm(false)  // ← Cacher le formulaire
    
    if (drawMarkerRef.current) {
      mapRef.current?.removeLayer(drawMarkerRef.current)
      drawMarkerRef.current = null
    }
    if (drawCircleRef.current) {
      mapRef.current?.removeLayer(drawCircleRef.current)
      drawCircleRef.current = null
    }
  }

  const startDrawing = () => {
    console.log('✏️ Mode dessin activé')
    setIsDrawing(true)
    isDrawingRef.current = true
    setShowForm(true)  // ← Afficher le formulaire
    setSelectedZone(null)
    setForm(prev => ({
      ...prev,
      name: '',
      lat: 36.8,
      lng: 10.18
    }))
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0e1a]">
      {/* En-tête */}
      <div className="flex-shrink-0 p-4 border-b border-[#1f2937] bg-[#111827]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-lg font-semibold text-white">Gestion des zones de geofencing</h2>
            <p className="text-sm text-[#64748b]">
              {zones.filter(z => z.active).length} zone(s) active(s) sur {zones.length}
              {isDrawing && ' — Cliquez sur la carte pour placer le centre de la zone'}
              {showForm && !isDrawing && !selectedZone && ' — Remplissez le formulaire ci-dessous'}
            </p>
          </div>
          <div className="flex gap-2">
            {isDrawing && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-[#f04040]/20 text-[#f04040] border border-[#f04040]/30 rounded-lg hover:bg-[#f04040]/30 transition-colors flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            )}
            <button
              onClick={startDrawing}
              disabled={isDrawing}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                isDrawing 
                  ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 cursor-not-allowed'
                  : 'bg-[#4f8ef7] text-white hover:bg-[#3b7de0]'
              }`}
            >
              <Plus className="w-4 h-4" />
              {isDrawing ? 'En cours...' : 'Nouvelle zone'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 p-3 bg-[#f04040]/10 border-b border-[#f04040]/30 text-[#f04040] text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Corps principal : Carte + Panneau */}
      <div className="flex-1 flex min-h-0">
        {/* Carte */}
        <div className="flex-1 relative bg-[#0a0e1a]">
          <div id="geofence-map" className="w-full h-full" />
          
          {isDrawing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#111827]/90 backdrop-blur-sm border border-[#4f8ef7]/30 rounded-lg px-4 py-2 text-sm text-[#4f8ef7] z-[1000] flex items-center gap-2 animate-pulse">
              <MapPin className="w-4 h-4" />
              Cliquez sur la carte pour placer le centre de la zone
            </div>
          )}
        </div>

        {/* Panneau de droite */}
        <div className="w-96 bg-[#111827] border-l border-[#1f2937] flex flex-col flex-shrink-0 overflow-hidden">
          {/* Formulaire - s'affiche si showForm est vrai */}
          <div className="flex-shrink-0 p-4 border-b border-[#1f2937] overflow-y-auto max-h-[50%]">
            <h3 className="text-sm font-medium text-white mb-3">
              {selectedZone ? 'Modifier la zone' : showForm ? 'Nouvelle zone' : 'Selectionnez une zone'}
            </h3>
            
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-[#64748b] mb-1">Nom</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nom de la zone"
                    className="w-full px-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#64748b] mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748b] mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-[#64748b] mb-1">Rayon (mètres)</label>
                  <input
                    type="number"
                    value={form.radius}
                    onChange={(e) => setForm({ ...form, radius: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#64748b] mb-1">Couleur</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="w-10 h-9 bg-[#1a2332] border border-[#1f2937] rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#4f8ef7]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748b] mb-1">Statut</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, danger: !form.danger })}
                      className={`w-full px-3 py-1.5 rounded-lg text-sm flex items-center justify-center gap-2 ${
                        form.danger ? 'bg-[#f04040]/20 text-[#f04040] border border-[#f04040]/30' : 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                      }`}
                    >
                      {form.danger ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {form.danger ? 'Interdite' : 'Autorisee'}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-[#1f2937]">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-3 py-1.5 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-3 py-1.5 bg-[#4f8ef7] text-white rounded-lg hover:bg-[#3b7de0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {selectedZone ? 'Mettre a jour' : 'Creer'}
                  </button>
                </div>
              </form>
            )}
            
            {!showForm && (
              <div className="text-center py-8 text-[#64748b]">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Cliquez sur "Nouvelle zone" ou sur une zone existante</p>
              </div>
            )}
          </div>

          {/* Liste des zones */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-white mb-3">Liste des zones</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-[#4f8ef7] animate-spin" />
              </div>
            ) : zones.length === 0 ? (
              <p className="text-sm text-[#64748b] text-center py-4">Aucune zone definie</p>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedZone?.id === zone.id
                        ? 'border-[#4f8ef7] bg-[#4f8ef7]/5'
                        : 'border-[#1f2937] hover:border-[#4f8ef7]/30'
                    }`}
                    onClick={() => {
                      setSelectedZone(zone)
                      setForm({
                        name: zone.name,
                        lat: zone.lat,
                        lng: zone.lng,
                        radius: zone.radius,
                        color: zone.color,
                        danger: zone.danger,
                        active: zone.active
                      })
                      setIsDrawing(false)
                      isDrawingRef.current = false
                      setShowForm(true)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-sm font-medium text-white">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(zone); }}
                          className={`p-1 rounded transition-colors ${
                            zone.active ? 'text-[#22c55e] hover:bg-[#22c55e]/10' : 'text-[#64748b] hover:bg-[#1f2937]'
                          }`}
                          title={zone.active ? 'Desactiver' : 'Activer'}
                        >
                          {zone.active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(zone.id); }}
                          className="p-1 text-[#f04040] hover:bg-[#f04040]/10 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-[#64748b] mt-1">
                      {zone.lat.toFixed(4)}°, {zone.lng.toFixed(4)}° · {zone.radius}m
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        zone.danger ? 'bg-[#f04040]/10 text-[#f04040]' : 'bg-[#22c55e]/10 text-[#22c55e]'
                      }`}>
                        {zone.danger ? 'Interdite' : 'Autorisee'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeofenceManager