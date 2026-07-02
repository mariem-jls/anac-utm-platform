import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabaseAdmin } from '../lib/supabase'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  MapPin,
  Clock,
  Drone
} from 'lucide-react'

// Zones de geofencing
const GEOFENCE_ZONES = [
  { lat: 36.8510, lng: 10.2272, radius: 5000, name: 'Tunis-Carthage CTR', danger: true },
  { lat: 36.8565, lng: 10.2450, radius: 2000, name: 'Zone Presidentielle', danger: true },
  { lat: 37.2430, lng: 9.8010, radius: 8000, name: 'Base Militaire Bizerte', danger: false },
  { lat: 34.7179, lng: 10.6904, radius: 4000, name: 'Sfax-Thyna CTR', danger: true }
]

const PoliceScanner = () => {
  const [searchParams] = useSearchParams()
  const droneParam = searchParams.get('drone')
  
  const [loading, setLoading] = useState(false)
  const [droneInfo, setDroneInfo] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [error, setError] = useState(null)
  const [flightPlan, setFlightPlan] = useState(null)
  const [scanResult, setScanResult] = useState(null)

  useEffect(() => {
    if (droneParam) {
      verifyDrone(droneParam)
    } else {
      setLoading(false)
      setScanResult(null)
    }
  }, [droneParam])

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
const verifyDrone = async (registrationNumber) => {
  setLoading(true)
  setError(null)
  setScanResult(null)
  
  try {
    console.log('🔍 Vérification du drone:', registrationNumber)
    
    // Normaliser le paramètre scanné
    const normalizedId = registrationNumber
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')

    // Lookup direct sur l'immatriculation normalisée
    const { data: droneData, error: droneError } = await supabaseAdmin
      .from('registered_drones')
      .select('*')
      .eq('registration_number', normalizedId)
      .maybeSingle()

    console.log('📊 Résultat lookup:', { data: droneData, error: droneError })

    if (droneError) {
      console.error('❌ Erreur Supabase:', droneError)
      throw new Error('Erreur de base de données: ' + droneError.message)
    }

    if (!droneData) {
      console.log('❌ Drone non trouvé:', normalizedId)
      setScanResult('not_found')
      setLoading(false)
      return
    }

    console.log('✅ Drone trouvé:', droneData)
    setDroneInfo(droneData)

    // 2. Vérifier si le drone est autorisé
    if (droneData.status !== 'approved' && droneData.status !== 'active') {
      setScanResult('unauthorized')
      setLoading(false)
      return
    }

    // 3. Récupérer la dernière position du drone depuis telemetry
    const { data: telemetryData, error: telemetryError } = await supabaseAdmin
      .from('telemetry')
      .select('*')
      .eq('drone_id', droneData.registration_number)
      .order('recorded_at', { ascending: false })
      .limit(1)

    if (!telemetryError && telemetryData && telemetryData.length > 0) {
      setTelemetry(telemetryData[0])
    } else {
      console.log('ℹ️ Aucune télémétrie disponible')
    }

    // 4. Vérifier les plans de vol actifs
    const now = new Date().toISOString()
    const { data: flightData, error: flightError } = await supabaseAdmin
      .from('flight_plans')
      .select('*')
      .eq('drone_id', droneData.id)
      .eq('status', 'approved')
      .lte('start_time', now)
      .gte('end_time', now)
      .limit(1)

    if (!flightError && flightData && flightData.length > 0) {
      setFlightPlan(flightData[0])
    }

    // 5. Vérifier si le drone est dans une zone interdite
    let isInRestrictedZone = false
    let restrictedZoneName = null

    if (telemetryData && telemetryData.length > 0) {
      const tele = telemetryData[0]
      for (const zone of GEOFENCE_ZONES) {
        if (!zone.danger) continue
        const distance = calculateDistance(tele.lat, tele.lng, zone.lat, zone.lng)
        if (distance <= zone.radius) {
          isInRestrictedZone = true
          restrictedZoneName = zone.name
          break
        }
      }
    }

    // 6. Déterminer le résultat final
    if (isInRestrictedZone) {
      setScanResult('zone_violation')
      await supabaseAdmin.from('police_scans').insert({
        drone_id: droneData.id,
        officer_id: null,
        scan_result: 'zone_violation',
        lat: telemetryData?.[0]?.lat || null,
        lng: telemetryData?.[0]?.lng || null
      })
    } else if (!flightPlan) {
      setScanResult('no_flight_plan')
    } else {
      setScanResult('authorized')
      await supabaseAdmin.from('police_scans').insert({
        drone_id: droneData.id,
        officer_id: null,
        scan_result: 'authorized',
        lat: telemetryData?.[0]?.lat || null,
        lng: telemetryData?.[0]?.lng || null
      })
    }

  } catch (err) {
    console.error('❌ Erreur:', err)
    setError(err.message)
    setScanResult('unauthorized')
  } finally {
    setLoading(false)
  }
}
  const renderResult = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-[#4f8ef7] animate-spin mx-auto mb-4" />
          <p className="text-[#64748b]">Verification en cours...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#f04040]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-[#f04040]" />
          </div>
          <h3 className="text-xl font-semibold text-[#f04040] mb-2">Erreur</h3>
          <p className="text-[#64748b]">{error}</p>
        </div>
      )
    }

    if (!droneParam) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-[#1a2332] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-[#64748b]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Scan de QR code</h3>
          <p className="text-[#64748b] max-w-md mx-auto">
            Utilisez un QR code ou le lien de verification pour consulter le statut d'un drone.
          </p>
          <p className="text-sm text-[#64748b] mt-2 font-mono bg-[#1a2332] px-4 py-2 rounded-lg inline-block">
            /verify?drone=TN-DRN-XXXXX
          </p>
        </div>
      )
    }

    const resultConfig = {
      authorized: {
        icon: CheckCircle,
        color: 'text-[#22c55e]',
        bg: 'bg-[#22c55e]/10',
        border: 'border-[#22c55e]/30',
        title: 'Drone autorise',
        description: 'Ce drone est autorise a voler dans cette zone.',
        subtext: 'Tous les documents sont en regle.'
      },
      unauthorized: {
        icon: XCircle,
        color: 'text-[#f04040]',
        bg: 'bg-[#f04040]/10',
        border: 'border-[#f04040]/30',
        title: 'Drone non autorise',
        description: 'Ce drone n\'est pas immatricule ou son autorisation a expire.',
        subtext: 'Veuillez contacter l\'operateur.'
      },
      not_found: {
        icon: XCircle,
        color: 'text-[#f04040]',
        bg: 'bg-[#f04040]/10',
        border: 'border-[#f04040]/30',
        title: 'Drone non trouve',
        description: 'Aucun drone trouve avec ce numero d\'immatriculation.',
        subtext: 'Verifiez que le QR code est valide.'
      },
      no_flight_plan: {
        icon: AlertTriangle,
        color: 'text-[#f5a623]',
        bg: 'bg-[#f5a623]/10',
        border: 'border-[#f5a623]/30',
        title: 'Drone sans plan de vol actif',
        description: 'Ce drone n\'a pas de plan de vol valide pour cette zone.',
        subtext: 'L\'operateur doit soumettre un plan de vol.'
      },
      zone_violation: {
        icon: AlertTriangle,
        color: 'text-[#f04040]',
        bg: 'bg-[#f04040]/10',
        border: 'border-[#f04040]/30',
        title: 'Alerte : Zone interdite',
        description: 'Ce drone se trouve actuellement dans une zone interdite.',
        subtext: 'La zone Tunis-Carthage CTR est une zone reglementee.'
      }
    }

    const config = resultConfig[scanResult] || resultConfig.unauthorized
    const ResultIcon = config.icon

    return (
      <div className={`border-2 ${config.border} rounded-xl p-6 ${config.bg}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ResultIcon className={`w-8 h-8 ${config.color}`} />
          </div>
          <h3 className={`text-xl font-bold ${config.color} mb-2`}>
            {config.title}
          </h3>
          <p className="text-[#e2e8f0] mb-1">{config.description}</p>
          <p className="text-sm text-[#64748b]">{config.subtext}</p>
        </div>

        {droneInfo && (
          <div className="mt-6 p-4 bg-[#111827] rounded-lg border border-[#1f2937]">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Drone className="w-4 h-4 text-[#4f8ef7]" />
              Details du drone
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#64748b]">Immatriculation</span>
                <p className="text-[#e2e8f0] font-mono">{droneInfo.registration_number}</p>
              </div>
              <div>
                <span className="text-[#64748b]">Modele</span>
                <p className="text-[#e2e8f0]">{droneInfo.model}</p>
              </div>
              <div>
                <span className="text-[#64748b]">Statut</span>
                <p className={`font-medium ${
                  droneInfo.status === 'approved' || droneInfo.status === 'active' 
                    ? 'text-[#22c55e]' 
                    : 'text-[#f04040]'
                }`}>
                  {droneInfo.status === 'approved' ? 'Approuve' : 
                   droneInfo.status === 'active' ? 'Actif' : droneInfo.status}
                </p>
              </div>
              <div>
                <span className="text-[#64748b]">Proprietaire</span>
                <p className="text-[#e2e8f0] text-xs font-mono">
                  {droneInfo.owner_id?.slice(0, 8) || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {telemetry ? (
          <div className="mt-3 p-4 bg-[#111827] rounded-lg border border-[#1f2937]">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4f8ef7]" />
              Derniere position connue
            </h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-[#64748b]">Latitude</span>
                <p className="text-[#e2e8f0] font-mono">{telemetry.lat?.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-[#64748b]">Longitude</span>
                <p className="text-[#e2e8f0] font-mono">{telemetry.lng?.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-[#64748b]">Altitude</span>
                <p className="text-[#e2e8f0]">{telemetry.altitude || 0} m</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#64748b] flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Derniere mise a jour : {new Date(telemetry.recorded_at).toLocaleString('fr-FR')}
            </div>
          </div>
        ) : droneParam && droneInfo && (
          <div className="mt-3 p-4 bg-[#111827] rounded-lg border border-[#1f2937] text-center">
            <p className="text-sm text-[#64748b]">
              <span className="text-[#f5a623]">Aucune donnee de telemetrie disponible</span>
            </p>
            <p className="text-xs text-[#64748b] mt-1">Le drone est probablement au sol ou n'a pas encore transmis de donnees.</p>
          </div>
        )}

        {flightPlan && (
          <div className="mt-3 p-4 bg-[#111827] rounded-lg border border-[#1f2937]">
            <h4 className="text-sm font-semibold text-white mb-3">Plan de vol actif</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#64748b]">Mission</span>
                <p className="text-[#e2e8f0]">{flightPlan.mission_type}</p>
              </div>
              <div>
                <span className="text-[#64748b]">Zone</span>
                <p className="text-[#e2e8f0]">{flightPlan.zone_name || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-[#0a0e1a]">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-[#4f8ef7]" />
            <h1 className="text-xl font-bold text-white">Verification de drone</h1>
          </div>
          <p className="text-sm text-[#64748b]">
            {droneParam 
              ? `Verification du drone : ${droneParam}` 
              : 'Scannez un QR code pour verifier un drone'}
          </p>
        </div>

        {renderResult()}
      </div>
    </div>
  )
}

export default PoliceScanner