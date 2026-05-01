from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import platform
import os
import threading
import time
import urllib.request
import json

app = Flask(__name__)
CORS(app)

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:3001")
REGISTER_INTERVAL = 30


def get_detailed_system_info():
    cpu_cores = psutil.cpu_count(logical=True)
    cpu_usage = psutil.cpu_percent(interval=0.1)

    memory = psutil.virtual_memory()
    total_ram = round(memory.total / (1024 ** 3), 2)
    available_ram = round(memory.available / (1024 ** 3), 2)
    usage_percent_ram = memory.percent

    disk = psutil.disk_usage("/")
    total_storage = round(disk.total / (1024 ** 3), 2)
    available_storage = round(disk.free / (1024 ** 3), 2)

    battery = psutil.sensors_battery()
    battery_data = {
        "percent": battery.percent if battery else 100,
        "is_charging": battery.power_plugged if battery else True,
    }

    return {
        "hostname": platform.node(),
        "cpu": {
            "cores": cpu_cores,
            "model": "Architecture: " + platform.machine(),
            "usage": round(cpu_usage / 100, 4),
        },
        "ram": {
            "total": total_ram,
            "available": available_ram,
            "usagePercent": usage_percent_ram,
        },
        "gpu": {"status": "Available", "available": "Integrated GPU"},
        "storage": {
            "total": total_storage,
            "available": available_storage,
        },
        "battery": battery_data,
    }


def register_with_backend():
    while True:
        try:
            info = get_detailed_system_info()
            battery_pct = info["battery"]["percent"]

            if battery_pct < 15:
                print(f"[agent] Battery {battery_pct}% < 15%, skipping registration.")
                time.sleep(REGISTER_INTERVAL)
                continue

            payload = json.dumps(info).encode("utf-8")
            req = urllib.request.Request(
                f"{BACKEND_URL}/api/node/register",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = json.loads(resp.read().decode())
                print(f"[agent] Registered node: {body.get('nodeId', '?')} status={body.get('status', '?')}")
        except Exception as e:
            print(f"[agent] Registration failed: {e}")

        time.sleep(REGISTER_INTERVAL)


@app.route("/api/system-resources", methods=["GET"])
def system_resources():
    return jsonify(get_detailed_system_info())


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    port = int(os.getenv("AGENT_PORT", "5001"))
    print(f"Resource agent running on http://localhost:{port}")

    reg_thread = threading.Thread(target=register_with_backend, daemon=True)
    reg_thread.start()

    app.run(port=port, debug=False, use_reloader=False)
