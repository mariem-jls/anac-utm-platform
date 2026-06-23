import paho.mqtt.client as mqtt
import json
import random
import time
from datetime import datetime

# Configuration du drone
DRONE_ID = "TN-DRN-001"
BROKER = "broker.emqx.io" 
PORT = 1883
TOPIC = f"telemetry/{DRONE_ID}"

# Position initiale (Tunis, près du lac)
lat = 36.8190
lng = 10.1658

print(f"Simulateur drone {DRONE_ID} démarre...")
print(f"Connexion au broker MQTT: {BROKER}:{PORT}")
print(f"Publication sur: {TOPIC}")
print("Appuie sur Ctrl+C pour arrêter\n")

# 1. Connexion au broker MQTT
client = mqtt.Client()
client.connect(BROKER, PORT, 60)

try:
    while True:
        # 2. Simuler un mouvement (petit déplacement aléatoire)
        lat += random.uniform(-0.003, 0.003)
        lng += random.uniform(-0.003, 0.003)
        
        # 3. Créer le message
        telemetry = {
            "drone_id": DRONE_ID,
            "timestamp": datetime.utcnow().isoformat(),
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "altitude": round(50 + random.uniform(-10, 30), 1),
            "speed": round(random.uniform(0, 45), 1),
            "battery": round(100 - random.uniform(0, 0.5), 1)
        }
        
        # 4. Publier sur MQTT
        payload = json.dumps(telemetry)
        client.publish(TOPIC, payload)
        
        # 5. Afficher dans le terminal
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Lat:{telemetry['lat']} Lng:{telemetry['lng']} | Alt:{telemetry['altitude']}m | Vit:{telemetry['speed']}km/h | {telemetry['battery']}%")
        
        # Attendre 2 secondes avant l'envoi suivant
        time.sleep(2)
        
except KeyboardInterrupt:
    print("\n🛑 Simulateur arrêté")
    client.disconnect()