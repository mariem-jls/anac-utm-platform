import paho.mqtt.client as mqtt
import json
import random
import time
from datetime import datetime
import threading

# Configuration MQTT
BROKER = "broker.emqx.io"
PORT = 1883

# Définition des 3 drones
DRONES = [
    {
        "id": "TN-DRN-001",
        "lat": 36.8190,   # Tunis Nord
        "lng": 10.1658,
        "altitude": 50,
        "speed": 0,
        "battery": 100,
        "status": "normal",
        "zone": "safe"
    },
    {
        "id": "TN-DRN-002",
        "lat": 36.8450,   # Proche de Tunis-Carthage CTR (zone critique)
        "lng": 10.2200,
        "altitude": 60,
        "speed": 0,
        "battery": 100,
        "status": "normal",
        "zone": "safe"
    },
    {
        "id": "TN-DRN-003",
        "lat": 36.7800,   # Tunis Sud
        "lng": 10.1000,
        "altitude": 45,
        "speed": 0,
        "battery": 100,
        "status": "normal",
        "zone": "safe"
    }
]

# Zone critique (Tunis-Carthage CTR) - centre et rayon
CRITICAL_ZONE = {"lat": 36.8510, "lng": 10.2272, "radius": 5000}  # 5km

def check_zone_violation(lat, lng):
    """Vérifie si le drone est dans la zone critique"""
    R = 6371e3
    φ1 = lat * 3.14159 / 180
    φ2 = CRITICAL_ZONE["lat"] * 3.14159 / 180
    Δφ = (CRITICAL_ZONE["lat"] - lat) * 3.14159 / 180
    Δλ = (CRITICAL_ZONE["lng"] - lng) * 3.14159 / 180
    
    a = (Δφ/2)**2 + (Δφ/2)**2 + \
        (Δλ/2)**2 * ( (φ1)**2 + (φ2)**2 ) / 2
    # Version simplifiée du calcul de distance
    distance = ((lat - CRITICAL_ZONE["lat"])**2 + (lng - CRITICAL_ZONE["lng"])**2)**0.5 * 111000
    return distance < CRITICAL_ZONE["radius"]

def generate_telemetry(drone):
    """Génère une nouvelle position pour un drone"""
    # Mouvement différent selon le drone
    if drone["id"] == "TN-DRN-002":
        # Drone 002 : se dirige vers la zone critique (Tunis-Carthage)
        drone["lng"] += 0.0008
        drone["lat"] += 0.0005
        drone["altitude"] += random.uniform(-2, 5)
        drone["speed"] = random.uniform(15, 35)
        drone["battery"] -= random.uniform(0, 0.3)
        
        # Vérifier violation
        is_violation = check_zone_violation(drone["lat"], drone["lng"])
        drone["zone"] = "critical" if is_violation else "warning"
        drone["status"] = "alert" if is_violation else "warning"
    else:
        # Drone 001 et 003 : vol normal autour de leurs positions
        drone["lng"] += random.uniform(-0.002, 0.002)
        drone["lat"] += random.uniform(-0.002, 0.002)
        drone["altitude"] += random.uniform(-5, 8)
        drone["altitude"] = max(20, min(150, drone["altitude"]))
        drone["speed"] = random.uniform(5, 45)
        drone["battery"] -= random.uniform(0, 0.2)
        drone["zone"] = "safe"
        drone["status"] = "normal"
    
    drone["battery"] = max(0, drone["battery"])
    drone["altitude"] = max(0, min(150, drone["altitude"]))
    
    return {
        "drone_id": drone["id"],
        "timestamp": datetime.utcnow().isoformat(),
        "lat": round(drone["lat"], 6),
        "lng": round(drone["lng"], 6),
        "altitude": round(drone["altitude"], 1),
        "speed": round(drone["speed"], 1),
        "battery": round(drone["battery"], 1),
        "zone": drone["zone"],
        "status": drone["status"]
    }

def publish_drone(drone):
    """Fonction pour publier les données d'un drone spécifique"""
    client = mqtt.Client()
    client.connect(BROKER, PORT, 60)
    topic = f"telemetry/{drone['id']}"
    
    print(f" Drone {drone['id']} démarré")
    
    while True:
        telemetry = generate_telemetry(drone)
        payload = json.dumps(telemetry)
        client.publish(topic, payload, qos=0)
        
        # Afficher avec indicateur de zone
        zone_symbol = "" if telemetry["zone"] == "critical" else "" if telemetry["zone"] == "warning" else ""
        print(f"{zone_symbol} {telemetry['timestamp'][11:19]} | {telemetry['drone_id']} | "
              f"Lat:{telemetry['lat']:.4f} Lng:{telemetry['lng']:.4f} | "
              f"Alt:{telemetry['altitude']}m | Vit:{telemetry['speed']}km/h | {telemetry['battery']}% | {telemetry['zone']}")
        
        time.sleep(3)

# Démarrer un thread pour chaque drone
print("Lancement des 3 simulateurs de drones...")
print("=" * 60)

threads = []
for drone in DRONES:
    thread = threading.Thread(target=publish_drone, args=(drone,))
    thread.daemon = True
    thread.start()
    threads.append(thread)
    time.sleep(0.5)

print("=" * 60)
print("3 drones actifs :")
print("   TN-DRN-001 - Vol normal")
print("   TN-DRN-002 - Se dirige vers zone critique (alerte!)")
print("   TN-DRN-003 - Vol normal")
print("Appuie sur Ctrl+C pour arrêter\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 Tous les simulateurs arrêtés")