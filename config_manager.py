import json
import os

CONFIG_FILE = "settings.json"

DEFAULT_CONFIG = {
    "last_directory": "/home/rjegj/문서"
}

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return DEFAULT_CONFIG
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return DEFAULT_CONFIG

def save_config(key, value):
    config = load_config()
    config[key] = value
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4, ensure_ascii=False)
