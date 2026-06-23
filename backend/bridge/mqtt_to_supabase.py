#!/usr/bin/env python3
import paho.mqtt.client as mqtt
from supabase import create_client, Client
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erreur: Variables SUPABASE_URL ou SUPABASE_KEY non définies")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Connecté à Supabase")

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "telemetry/#"

# Zones critiques (géofencing)
CRITICAL_ZONES = [
    {"lat": 36.8510, "lng": 10.2272, "radius": 5000, "name": "Tunis-Carthage CTR"},
    {"lat": 36.8565, "lng": 10.2450, "radius": 2000, "name": "Zone Présidentielle"},
]

def check_zone_violation(lat, lng):
    """Vérifie si les coordonnées sont dans une zone critique"""
    for zone in CRITICAL_ZONES:
        # Calcul simplifié de distance
        distance = ((lat - zone["lat"])**2 + (lng - zone["lng"])**2)**0.5 * 111000
        if distance < zone["radius"]:
            return zone["name"]
    return None

def add_log(drone_id, event_type, message, severity, lat=None, lng=None):
    """Ajoute un log dans Supabase"""
    try:
        supabase.table("drone_logs").insert({
            "drone_id": drone_id,
            "event_type": event_type,
            "message": message,
            "severity": severity,
            "lat": lat,
            "lng": lng
        }).execute()
        print(f"Log ajouté: [{drone_id}] {event_type} - {message}")
    except Exception as e:
        print(f"Erreur log: {e}")

def on_message(client, userdata, msg):
    topic = msg.topic
    try:
        data = json.loads(msg.payload)
        
        if not data.get("drone_id") or not data.get("lat"):
            return
        
        drone_id = data["drone_id"]
        lat = data["lat"]
        lng = data["lng"]
        altitude = data.get("altitude", 0)
        speed = data.get("speed", 0)
        battery = data.get("battery", 0)
        timestamp = data.get("timestamp", datetime.utcnow().isoformat())
        
        # Vérifier violation de zone
        zone_name = check_zone_violation(lat, lng)
        
        # Stocker dans telemetry
        result = supabase.table("telemetry").insert({
            "drone_id": drone_id,
            "lat": lat,
            "lng": lng,
            "altitude": altitude,
            "speed": speed,
            "battery": battery,
            "recorded_at": timestamp
        }).execute()
        
        # Générer des logs selon les événements
        if zone_name:
            add_log(drone_id, "geofence_violation", 
                   f"Drone entré dans zone interdite: {zone_name}", 
                   "critical", lat, lng)
        
        if battery < 25:
            add_log(drone_id, "battery_warning", 
                   f"Batterie faible: {battery}%", "warning", lat, lng)
        elif battery < 15:
            add_log(drone_id, "battery_critical", 
                   f"Batterie critique: {battery}%", "critical", lat, lng)
        
        if altitude > 120:
            add_log(drone_id, "altitude_warning", 
                   f"Altitude excessive: {altitude}m (limite: 120m)", "warning", lat, lng)
        
        zone_symbol = "" if zone_name else ""
        print(f"{zone_symbol} {drone_id} | Lat:{lat:.4f} Lng:{lng:.4f} | Alt:{altitude}m | {battery}%")
        
    except Exception as e:
        print(f"Erreur: {e}")

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqtt_client.on_message = on_message
mqtt_client.connect(BROKER, PORT, 60)
mqtt_client.subscribe(TOPIC)

print("Bridge MQTT → Supabase actif avec logs")
print("Écoute sur: telemetry/#")
print("En attente des messages...\n")

try:
    mqtt_client.loop_forever()
except KeyboardInterrupt:
    print("\n🛑 Bridge arrêté")